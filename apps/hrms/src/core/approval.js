import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { leaveService } from '../core/leave.js';
import { notificationService } from '../core/notification.js';

// Approval Workflow Service (Supabase-backed)
class ApprovalService {
    constructor() { }

    // Initialize (seeds handled by SQL migration)
    async initializeApprovalSettings() { }

    // Get approval settings
    async getApprovalSettings() {
        const rows = await db.getAll('approval_settings');
        if (rows.length === 0) return {};
        const r = rows[0];
        return {
            leaveApprovalLevels: r.leave_approval_levels,
            autoApproveThreshold: r.auto_approve_threshold,
            escalationEnabled: r.escalation_enabled,
            escalationDays: r.escalation_days,
            allowDelegation: r.allow_delegation
        };
    }

    // Update approval settings
    async updateApprovalSettings(settings) {
        const rows = await db.getAll('approval_settings');
        if (rows.length > 0) {
            const updates = {};
            if (settings.leaveApprovalLevels !== undefined) updates.leave_approval_levels = settings.leaveApprovalLevels;
            if (settings.autoApproveThreshold !== undefined) updates.auto_approve_threshold = settings.autoApproveThreshold;
            if (settings.escalationEnabled !== undefined) updates.escalation_enabled = settings.escalationEnabled;
            if (settings.escalationDays !== undefined) updates.escalation_days = settings.escalationDays;
            if (settings.allowDelegation !== undefined) updates.allow_delegation = settings.allowDelegation;

            await db.update('approval_settings', 'id', rows[0].id, updates);
        }
    }

    // Get pending approvals for a user
    async getPendingApprovals(userId, type = null) {
        const results = [];
        const employees = await employeeService.getEmployees();
        const currentUser = employees.find(e => e.id === userId);

        if (!currentUser) return results;

        // Find team members (those who report to this user)
        const teamMemberIds = employees
            .filter(e => e.manager === currentUser.name || e.managerId === userId)
            .map(e => e.id);

        // Include HR admin access - they can see all
        const isHR = currentUser.role === 'hr_admin' || currentUser.role === 'super_admin';

        // 1. Leave Requests
        if (!type || type === 'leave') {
            const leaveRequests = await leaveService.getLeaveRequests({ status: 'pending' });

            for (const req of leaveRequests) {
                if (isHR || teamMemberIds.includes(req.employeeId)) {
                    results.push({
                        id: req.id,
                        type: 'leave',
                        title: `${req.leaveType} Leave Request`,
                        description: `${req.employeeName} requested ${req.days} days (${req.startDate} to ${req.endDate})`,
                        requestedBy: req.employeeName,
                        requestedById: req.employeeId,
                        requestedOn: req.appliedOn,
                        status: 'pending',
                        data: req
                    });
                }
            }
        }

        // 2. Attendance Corrections
        if (!type || type === 'attendance_correction') {
            const corrections = await db.getAll('attendance_corrections', { status: 'pending' });

            for (const corr of corrections) {
                if (isHR || teamMemberIds.includes(corr.employee_id)) {
                    results.push({
                        id: corr.id,
                        type: 'attendance_correction',
                        title: 'Attendance Correction',
                        description: `Correction for ${corr.date}`,
                        requestedById: corr.employee_id,
                        requestedOn: corr.requested_on,
                        status: 'pending',
                        data: this._mapCorrectionToLegacy(corr)
                    });
                }
            }
        }

        return results;
    }

    // Get approval history
    async getApprovalHistory(userId, limit = 50) {
        const results = [];
        const employees = await employeeService.getEmployees();
        const currentUser = employees.find(e => e.id === userId);
        if (!currentUser) return results;

        const isHR = currentUser.role === 'hr_admin' || currentUser.role === 'super_admin';
        const teamMemberIds = employees
            .filter(e => e.manager === currentUser.name || e.managerId === userId)
            .map(e => e.id);

        // Leave history
        const allLeaves = await leaveService.getLeaveRequests({});
        const processedLeaves = allLeaves.filter(r => r.status !== 'pending');

        for (const req of processedLeaves) {
            if (isHR || teamMemberIds.includes(req.employeeId)) {
                results.push({
                    id: req.id,
                    type: 'leave',
                    title: `${req.leaveType} Leave`,
                    description: `${req.employeeName} - ${req.days} days - ${req.status}`,
                    requestedBy: req.employeeName,
                    status: req.status,
                    processedOn: req.approvedOn,
                    processedBy: req.approvedBy,
                    data: req
                });
            }
        }

        // Attendance correction history
        const allCorrections = await db.getAll('attendance_corrections');
        const processedCorrections = allCorrections.filter(c => c.status !== 'pending');

        for (const corr of processedCorrections) {
            if (isHR || teamMemberIds.includes(corr.employee_id)) {
                results.push({
                    id: corr.id,
                    type: 'attendance_correction',
                    title: 'Attendance Correction',
                    description: `Correction for ${corr.date} - ${corr.status}`,
                    requestedById: corr.employee_id,
                    status: corr.status,
                    processedOn: corr.approved_on || corr.rejected_on,
                    data: this._mapCorrectionToLegacy(corr)
                });
            }
        }

        return results
            .sort((a, b) => new Date(b.processedOn) - new Date(a.processedOn))
            .slice(0, limit);
    }

    // Approve an item
    async approve(itemId, itemType, approverId, comments = '') {
        if (itemType === 'leave') {
            return await leaveService.approveLeave(itemId, approverId);
        } else if (itemType === 'attendance_correction') {
            return await this.approveAttendanceCorrection(itemId, approverId, comments);
        }
        return { success: false, message: 'Unknown approval type' };
    }

    // Reject an item
    async reject(itemId, itemType, approverId, reason = '') {
        if (itemType === 'leave') {
            return await leaveService.rejectLeave(itemId, approverId, reason);
        } else if (itemType === 'attendance_correction') {
            return await this.rejectAttendanceCorrection(itemId, approverId, reason);
        }
        return { success: false, message: 'Unknown approval type' };
    }

    // ---- Attendance Corrections ----

    async submitAttendanceCorrection(correctionData) {
        const corrections = await db.getAll('attendance_corrections');
        const newCorrection = {
            id: 'CORR' + String(corrections.length + 1).padStart(4, '0'),
            employee_id: correctionData.employeeId,
            date: correctionData.date,
            current_in_time: correctionData.currentInTime,
            current_out_time: correctionData.currentOutTime,
            requested_in_time: correctionData.requestedInTime,
            requested_out_time: correctionData.requestedOutTime,
            reason: correctionData.reason,
            status: 'pending'
        };

        await db.insert('attendance_corrections', newCorrection);
        await this.logAction('correction_submitted', `Attendance correction for ${correctionData.date}`);

        return { success: true, correction: this._mapCorrectionToLegacy(newCorrection) };
    }

    async approveAttendanceCorrection(correctionId, approverId, comments = '') {
        const row = await db.getOne('attendance_corrections', 'id', correctionId);
        if (!row) return { success: false, message: 'Correction not found' };

        const approver = await employeeService.getEmployee(approverId);
        await db.update('attendance_corrections', 'id', correctionId, {
            status: 'approved',
            approved_by: approver?.name || approverId,
            approved_on: new Date().toISOString(),
            approver_comments: comments
        });

        // Auto-correct the attendance record
        await db.upsert('attendance', {
            employee_id: row.employee_id,
            date: row.date,
            in_time: row.requested_in_time,
            out_time: row.requested_out_time,
            corrected: true,
            correction_id: correctionId,
            status: 'present'
        }, { onConflict: 'employee_id,date' });

        await notificationService.notify(row.employee_id, 'Correction Approved ✅', `Your attendance correction for ${row.date} has been approved.`, 'success');
        await this.logAction('correction_approved', `Attendance correction ${correctionId} approved`);

        return { success: true };
    }

    async rejectAttendanceCorrection(correctionId, approverId, reason = '') {
        const row = await db.getOne('attendance_corrections', 'id', correctionId);
        if (!row) return { success: false, message: 'Correction not found' };

        const approver = await employeeService.getEmployee(approverId);
        await db.update('attendance_corrections', 'id', correctionId, {
            status: 'rejected',
            rejected_by: approver?.name || approverId,
            rejected_on: new Date().toISOString(),
            rejection_reason: reason
        });

        await notificationService.notify(row.employee_id, 'Correction Rejected ❌', `Your attendance correction for ${row.date} was rejected. Reason: ${reason}`, 'warning');
        await this.logAction('correction_rejected', `Attendance correction ${correctionId} rejected`);

        return { success: true };
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }

    _mapCorrectionToLegacy(r) {
        if (!r) return null;
        return {
            id: r.id,
            employeeId: r.employee_id,
            date: r.date,
            currentInTime: r.current_in_time,
            currentOutTime: r.current_out_time,
            requestedInTime: r.requested_in_time,
            requestedOutTime: r.requested_out_time,
            reason: r.reason,
            status: r.status,
            requestedOn: r.requested_on,
            approvedBy: r.approved_by,
            approvedOn: r.approved_on,
            approverComments: r.approver_comments,
            rejectedBy: r.rejected_by,
            rejectedOn: r.rejected_on,
            rejectionReason: r.rejection_reason
        };
    }
}

export const approvalService = new ApprovalService();
