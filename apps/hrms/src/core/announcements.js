import { db } from './database.js';
import { authService } from './auth.js';

// Announcements/Company Updates Service (Supabase-backed)
class AnnouncementService {
    constructor() { }

    // Create announcement
    async createAnnouncement(data) {
        const announcements = await db.getAll('announcements');
        const currentUser = authService.getCurrentUser();

        const newAnnouncement = {
            id: 'ANN' + String(announcements.length + 1).padStart(4, '0'),
            title: data.title,
            content: data.content,
            category: data.category,
            priority: data.priority || 'normal',
            publish_date: new Date().toISOString(),
            expiry_date: data.expiryDate || null,
            created_by: currentUser?.userId || 'system',
            created_by_name: currentUser?.name || 'System',
            attachments: data.attachments || [],
            is_active: true,
            views: 0,
            likes: []
        };

        const inserted = await db.insert('announcements', newAnnouncement);
        await this.logAction('announcement_created', `Announcement ${newAnnouncement.id} created`);

        return inserted ? this._mapToLegacy(inserted) : null;
    }

    // Get all announcements
    async getAnnouncements(filters = {}) {
        let announcements = await db.getAll('announcements', {}, { column: 'publish_date', ascending: false });

        // Map to legacy format
        announcements = announcements.map(a => this._mapToLegacy(a));

        if (filters.category) {
            announcements = announcements.filter(a => a.category === filters.category);
        }
        if (filters.active !== undefined) {
            announcements = announcements.filter(a => a.isActive === filters.active);
        }
        if (filters.startDate) {
            announcements = announcements.filter(a =>
                new Date(a.publishDate) >= new Date(filters.startDate)
            );
        }

        // Remove expired
        announcements = announcements.filter(a => {
            if (!a.expiryDate) return true;
            return new Date(a.expiryDate) >= new Date();
        });

        return announcements;
    }

    // Get single announcement
    async getAnnouncement(id) {
        const row = await db.getOne('announcements', 'id', id);
        return row ? this._mapToLegacy(row) : null;
    }

    // Update announcement
    async updateAnnouncement(id, updates) {
        const dbUpdates = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        dbUpdates.updated_at = new Date().toISOString();

        const updated = await db.update('announcements', 'id', id, dbUpdates);
        return updated ? this._mapToLegacy(updated) : null;
    }

    // Delete announcement
    async deleteAnnouncement(id) {
        return await db.deleteRow('announcements', 'id', id);
    }

    // Like announcement
    async likeAnnouncement(announcementId, userId) {
        const row = await db.getOne('announcements', 'id', announcementId);
        if (row && !row.likes.includes(userId)) {
            row.likes.push(userId);
            await db.update('announcements', 'id', announcementId, { likes: row.likes });
        }
    }

    // Get birthdays
    async getBirthdays(days = 7) {
        const users = await db.getAll('users', { status: 'active' });
        const today = new Date();
        const birthdays = [];

        users.forEach(user => {
            if (!user.date_of_birth) return;

            const dob = new Date(user.date_of_birth);
            const thisYear = today.getFullYear();
            const birthdayThisYear = new Date(thisYear, dob.getMonth(), dob.getDate());
            const diffTime = birthdayThisYear - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= days) {
                birthdays.push({
                    userId: user.id,
                    name: user.name,
                    date: birthdayThisYear.toISOString().split('T')[0],
                    daysUntil: diffDays,
                    age: thisYear - dob.getFullYear(),
                    isToday: diffDays === 0
                });
            }
        });

        return birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    }

    // Get work anniversaries
    async getAnniversaries(days = 7) {
        const users = await db.getAll('users', { status: 'active' });
        const today = new Date();
        const anniversaries = [];

        users.forEach(user => {
            if (!user.joining_date) return;

            const joinDate = new Date(user.joining_date);
            const thisYear = today.getFullYear();
            const anniversaryThisYear = new Date(thisYear, joinDate.getMonth(), joinDate.getDate());
            const diffTime = anniversaryThisYear - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const yearsCompleted = thisYear - joinDate.getFullYear();

            if (diffDays >= 0 && diffDays <= days && yearsCompleted > 0) {
                anniversaries.push({
                    userId: user.id,
                    name: user.name,
                    date: anniversaryThisYear.toISOString().split('T')[0],
                    daysUntil: diffDays,
                    years: yearsCompleted,
                    isToday: diffDays === 0
                });
            }
        });

        return anniversaries.sort((a, b) => a.daysUntil - b.daysUntil);
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }

    // Map DB row to legacy format
    _mapToLegacy(row) {
        if (!row) return null;
        return {
            id: row.id,
            title: row.title,
            content: row.content,
            category: row.category,
            priority: row.priority,
            publishDate: row.publish_date,
            expiryDate: row.expiry_date,
            createdBy: row.created_by,
            createdByName: row.created_by_name,
            attachments: row.attachments || [],
            isActive: row.is_active,
            views: row.views,
            likes: row.likes || []
        };
    }
}

export const announcementService = new AnnouncementService();
