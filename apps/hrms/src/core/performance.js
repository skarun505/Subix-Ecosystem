import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { notificationService } from '../core/notification.js';

// Performance Management Service (Supabase-backed)
class PerformanceService {
    constructor() { }

    // Initialize (seeds handled by SQL migration)
    async initializePerformance() { }

    // --- Goals Management ---

    async createGoal(goalData) {
        const newGoal = {
            id: 'GOAL' + Date.now(),
            employee_id: goalData.employeeId,
            title: goalData.title,
            description: goalData.description,
            category: goalData.category || 'Professional',
            target_date: goalData.targetDate,
            weight: goalData.weight || 25,
            progress: goalData.progress || 0,
            status: 'pending'
        };

        const inserted = await db.insert('goals', newGoal);
        await this.logAction('goal_created', goalData.employeeId, `Created goal: ${newGoal.title}`);
        return { success: true, goal: inserted ? this._mapGoalToLegacy(inserted) : newGoal };
    }

    async getGoals(employeeId) {
        const filters = employeeId ? { employee_id: employeeId } : {};
        const rows = await db.getAll('goals', filters);
        return rows.map(r => this._mapGoalToLegacy(r));
    }

    async updateGoal(goalId, updates) {
        const dbUpdates = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
        if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
        if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        dbUpdates.updated_at = new Date().toISOString();

        const updated = await db.update('goals', 'id', goalId, dbUpdates);
        if (!updated) return { success: false, message: 'Goal not found' };
        return { success: true, goal: this._mapGoalToLegacy(updated) };
    }

    // --- Performance Reviews ---

    async initiateReview(employeeId, cycleId) {
        const reviews = await db.getAll('performance_reviews', { employee_id: employeeId, cycle_id: cycleId });
        if (reviews.length > 0) return { success: false, message: 'Review already initiated for this cycle' };

        const employee = await employeeService.getEmployee(employeeId);
        if (!employee) return { success: false, message: 'Employee not found' };

        const newReview = {
            id: 'REV' + Date.now(),
            employee_id: employeeId,
            employee_name: employee.name,
            cycle_id: cycleId,
            status: 'in_self_assessment',
            template_id: 'standard_dev',
            assessments: { self: null, manager: null },
            final_score: 0,
            manager_comments: '',
            employee_comments: ''
        };

        await db.insert('performance_reviews', newReview);

        await notificationService.notify(employeeId, 'Appraisal Initiated 📈', `The ${cycleId} appraisal cycle has started. Please submit your self-assessment.`, 'info');

        return { success: true, review: this._mapReviewToLegacy(newReview) };
    }

    async submitAssessment(reviewId, role, data) {
        const row = await db.getOne('performance_reviews', 'id', reviewId);
        if (!row) return { success: false, message: 'Review not found' };

        const updates = {};
        if (role === 'self') {
            row.assessments.self = data.ratings;
            updates.assessments = row.assessments;
            updates.employee_comments = data.comments;
            updates.status = 'in_manager_assessment';
        } else if (role === 'manager') {
            row.assessments.manager = data.ratings;
            updates.assessments = row.assessments;
            updates.manager_comments = data.comments;
            updates.status = 'completed';
            updates.final_score = this._calculateFinalScoreFromRow(row);
            updates.completed_at = new Date().toISOString();
        }

        await db.update('performance_reviews', 'id', reviewId, updates);
        return { success: true };
    }

    _calculateFinalScoreFromRow(review) {
        // Use hardcoded template sections since we can't do sync DB calls
        const sections = [
            { id: 'tech_skills', weight: 40 },
            { id: 'delivery', weight: 30 },
            { id: 'soft_skills', weight: 20 },
            { id: 'values', weight: 10 }
        ];

        if (!review.assessments?.manager) return 0;

        let totalWeighted = 0;
        sections.forEach(sec => {
            const rating = review.assessments.manager[sec.id] || 0;
            totalWeighted += (rating * (sec.weight / 100));
        });

        return parseFloat(totalWeighted.toFixed(2));
    }

    async getReviews(filters = {}) {
        const dbFilters = {};
        if (filters.employeeId) dbFilters.employee_id = filters.employeeId;
        if (filters.status) dbFilters.status = filters.status;
        if (filters.cycleId) dbFilters.cycle_id = filters.cycleId;

        const rows = await db.getAll('performance_reviews', dbFilters);
        return rows.map(r => this._mapReviewToLegacy(r));
    }

    async getCycles() {
        return await db.getAll('performance_cycles');
    }

    // --- Analytics ---

    async getPerformanceStats(employeeId) {
        const goals = await this.getGoals(employeeId);
        const reviews = await this.getReviews({ employeeId });

        return {
            totalGoals: goals.length,
            completedGoals: goals.filter(g => g.status === 'completed').length,
            avgProgress: goals.length ? (goals.reduce((a, b) => a + b.progress, 0) / goals.length) : 0,
            latestReview: reviews.sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt))[0] || null
        };
    }

    async logAction(action, userId, details) {
        await authService.logAudit(action, userId, details);
    }

    // Mapping helpers
    _mapGoalToLegacy(r) {
        if (!r) return null;
        return {
            id: r.id,
            employeeId: r.employee_id,
            title: r.title,
            description: r.description,
            category: r.category,
            targetDate: r.target_date,
            weight: r.weight,
            progress: r.progress,
            status: r.status,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        };
    }

    _mapReviewToLegacy(r) {
        if (!r) return null;
        return {
            id: r.id,
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            cycleId: r.cycle_id,
            status: r.status,
            initiatedAt: r.initiated_at,
            templateId: r.template_id,
            assessments: r.assessments,
            finalScore: r.final_score,
            managerComments: r.manager_comments,
            employeeComments: r.employee_comments,
            completedAt: r.completed_at
        };
    }
}

export const performanceService = new PerformanceService();
