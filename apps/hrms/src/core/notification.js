import { db } from './database.js';
import { authService } from './auth.js';

// Notification Service (Supabase-backed)
class NotificationService {
    // Create a new notification
    async notify(userId, title, message, type = 'info', link = null) {
        const newNotification = {
            id: 'NOTIF' + Date.now(),
            user_id: userId,
            title,
            message,
            type,
            link,
            is_read: false
        };

        await db.insert('notifications', newNotification);

        // Trigger custom event for real-time UI update
        window.dispatchEvent(new CustomEvent('new-notification', {
            detail: {
                id: newNotification.id,
                userId,
                title,
                message,
                type,
                link,
                isRead: false,
                createdAt: new Date().toISOString()
            }
        }));

        return newNotification;
    }

    // Get notifications for a user
    async getNotifications(userId, unreadOnly = false) {
        const filters = { user_id: userId };
        if (unreadOnly) filters.is_read = false;

        const rows = await db.getAll('notifications', filters, { column: 'created_at', ascending: false });
        return rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            title: r.title,
            message: r.message,
            type: r.type,
            link: r.link,
            isRead: r.is_read,
            createdAt: r.created_at
        }));
    }

    // Mark as read
    async markAsRead(notificationId) {
        await db.update('notifications', 'id', notificationId, { is_read: true });
        window.dispatchEvent(new CustomEvent('notification-updated'));
    }

    // Mark all as read
    async markAllAsRead(userId) {
        // Get all unread for this user and update each
        const unread = await db.getAll('notifications', { user_id: userId, is_read: false });
        for (const n of unread) {
            await db.update('notifications', 'id', n.id, { is_read: true });
        }
        window.dispatchEvent(new CustomEvent('notification-updated'));
    }

    // System-wide broadcast
    async broadcast(title, message, type = 'info') {
        const users = await db.getAll('users', { status: 'active' });
        for (const user of users) {
            await this.notify(user.id, title, message, type);
        }
    }
}

export const notificationService = new NotificationService();
