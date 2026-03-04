import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { notificationService } from '../core/notification.js';

// Leave Management Service (Supabase-backed)
class LeaveService {
    constructor() { }

    // Initialize leave types (seeds handled by SQL migration)
    async initializeLeaveTypes() { }

    // Get leave types
    async getLeaveTypes() {
        const rows = await db.getAll('leave_types');
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            shortName: r.short_name,
            color: r.color,
            requiresApproval: r.requires_approval,
            maxConsecutive: r.max_consecutive,
            advanceNoticeDays: r.advance_notice_days,
            canCarryForward: r.can_carry_forward,
            encashable: r.encashable
        }));
    }

    // Get employee leave balance
    async getLeaveBalance(employeeId) {
        const employee = await employeeService.getEmployee(employeeId);
        if (!employee || !employee.leavePolicy) return null;
        return employee.leavePolicy;
    }

    // Apply for leave
    async applyLeave(leaveData) {
        const { employeeId, leaveType, startDate, endDate, reason, isHalfDay } = leaveData;

        const employee = await employeeService.getEmployee(employeeId);
        if (!employee) return { success: false, message: 'Employee not found' };

        const balance = await this.getLeaveBalance(employeeId);
        if (!balance) return { success: false, message: 'Leave policy not assigned' };

        const days = isHalfDay ? 0.5 : this.calculateLeaveDays(startDate, endDate);
        const leaveTypeKey = leaveType.toLowerCase();

        if (!balance[leaveTypeKey]) return { success: false, message: 'Invalid leave type' };
        if (balance[leaveTypeKey].remaining < days) {
            return { success: false, message: `Insufficient ${leaveType} balance. Available: ${balance[leaveTypeKey].remaining} days` };
        }

        const allRequests = await db.getAll('leave_requests');
        const newRequest = {
            id: 'LR' + String(allRequests.length + 1).padStart(4, '0'),
            employee_id: employeeId,
            employee_name: employee.name,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            days,
            is_half_day: isHalfDay || false,
            reason: reason || '',
            status: 'pending',
            applied_on: new Date().toISOString(),
            approved_by: null,
            approved_on: null,
            rejection_reason: null,
            salary_impact: this.calculateSalaryImpact(employee, leaveType, days)
        };

        await db.insert('leave_requests', newRequest);
        await this.logAction('leave_applied', `${employee.name} applied for ${days} days ${leaveType}`);

        // Notify admins
        const admins = await employeeService.getEmployees({ role: 'hr_admin' });
        for (const admin of admins) {
            await notificationService.notify(admin.id, 'New Leave Application', `${employee.name} has applied for ${days} days of ${leaveType}.`, 'info');
        }

        return { success: true, request: this._mapRequestToLegacy(newRequest) };
    }

    // Calculate leave days (excluding weekends)
    calculateLeaveDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let days = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
            current.setDate(current.getDate() + 1);
        }
        return days;
    }

    // Calculate salary impact
    calculateSalaryImpact(employee, leaveType, days) {
        const balance = employee.leavePolicy;
        if (!balance) return { unpaidDays: 0, deduction: 0 };

        const leaveTypeKey = leaveType.toLowerCase();
        const remaining = balance[leaveTypeKey]?.remaining || 0;

        if (remaining >= days) {
            return { unpaidDays: 0, deduction: 0, message: 'No salary impact - leave available' };
        } else {
            const unpaidDays = days - remaining;
            const monthlySalary = employee.salaryStructure?.gross || 0;
            const perDaySalary = monthlySalary / 30;
            const deduction = Math.round(perDaySalary * unpaidDays);
            return { unpaidDays, deduction, message: `${unpaidDays} days unpaid. Deduction: ₹${deduction}` };
        }
    }

    // Get leave requests
    async getLeaveRequests(filters = {}) {
        const dbFilters = {};
        if (filters.employeeId) dbFilters.employee_id = filters.employeeId;
        if (filters.status) dbFilters.status = filters.status;

        let requests = await db.getAll('leave_requests', dbFilters, { column: 'applied_on', ascending: false });

        if (filters.approverId) {
            const employees = await employeeService.getEmployees();
            const manager = employees.find(e => e.id === filters.approverId);
            if (manager) {
                const teamMembers = employees.filter(e => e.manager === manager.name);
                const teamIds = teamMembers.map(e => e.id);
                requests = requests.filter(r => teamIds.includes(r.employee_id));
            }
        }

        return requests.map(r => this._mapRequestToLegacy(r));
    }

    // Approve leave
    async approveLeave(requestId, approverId) {
        const row = await db.getOne('leave_requests', 'id', requestId);
        if (!row) return { success: false, message: 'Leave request not found' };
        if (row.status !== 'pending') return { success: false, message: 'Leave request already processed' };

        const approver = await employeeService.getEmployee(approverId);
        await db.update('leave_requests', 'id', requestId, {
            status: 'approved',
            approved_by: approver?.name || approverId,
            approved_on: new Date().toISOString()
        });

        await this.deductLeaveBalance(row.employee_id, row.leave_type, row.days);
        await this.logAction('leave_approved', `Leave request ${requestId} approved by ${approver?.name}`);

        await notificationService.notify(row.employee_id, 'Leave Approved ✅', `Your ${row.leave_type} for ${row.days} days has been approved.`, 'success');

        const updated = await db.getOne('leave_requests', 'id', requestId);
        return { success: true, request: this._mapRequestToLegacy(updated) };
    }

    // Reject leave
    async rejectLeave(requestId, approverId, reason) {
        const row = await db.getOne('leave_requests', 'id', requestId);
        if (!row) return { success: false, message: 'Leave request not found' };
        if (row.status !== 'pending') return { success: false, message: 'Leave request already processed' };

        const approver = await employeeService.getEmployee(approverId);
        await db.update('leave_requests', 'id', requestId, {
            status: 'rejected',
            approved_by: approver?.name || approverId,
            approved_on: new Date().toISOString(),
            rejection_reason: reason
        });

        await this.logAction('leave_rejected', `Leave request ${requestId} rejected by ${approver?.name}`);

        const updated = await db.getOne('leave_requests', 'id', requestId);
        return { success: true, request: this._mapRequestToLegacy(updated) };
    }

    // Deduct leave balance
    async deductLeaveBalance(employeeId, leaveType, days) {
        const employee = await employeeService.getEmployee(employeeId);
        if (!employee || !employee.leavePolicy) return;

        const leaveTypeKey = leaveType.toLowerCase();
        if (employee.leavePolicy[leaveTypeKey]) {
            employee.leavePolicy[leaveTypeKey].used += days;
            employee.leavePolicy[leaveTypeKey].remaining -= days;
            await employeeService.updateEmployee(employeeId, { leavePolicy: employee.leavePolicy });
        }
    }

    // Cancel leave
    async cancelLeave(requestId, employeeId) {
        const row = await db.getOne('leave_requests', 'id', requestId);
        if (!row) return { success: false, message: 'Leave request not found' };
        if (row.employee_id !== employeeId) return { success: false, message: 'Unauthorized' };

        if (row.status === 'approved') {
            await this.creditLeaveBalance(row.employee_id, row.leave_type, row.days);
        }

        await db.update('leave_requests', 'id', requestId, { status: 'cancelled' });
        await this.logAction('leave_cancelled', `Leave request ${requestId} cancelled`);

        const updated = await db.getOne('leave_requests', 'id', requestId);
        return { success: true, request: this._mapRequestToLegacy(updated) };
    }

    // Credit leave balance
    async creditLeaveBalance(employeeId, leaveType, days) {
        const employee = await employeeService.getEmployee(employeeId);
        if (!employee || !employee.leavePolicy) return;

        const leaveTypeKey = leaveType.toLowerCase();
        if (employee.leavePolicy[leaveTypeKey]) {
            employee.leavePolicy[leaveTypeKey].used -= days;
            employee.leavePolicy[leaveTypeKey].remaining += days;
            await employeeService.updateEmployee(employeeId, { leavePolicy: employee.leavePolicy });
        }
    }

    // Get leave statistics
    async getLeaveStatistics(month, year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const allRequests = await db.getAll('leave_requests');
        const monthRequests = allRequests.filter(r =>
            r.start_date >= startDate && r.start_date <= endDate
        );

        return {
            total: monthRequests.length,
            pending: monthRequests.filter(r => r.status === 'pending').length,
            approved: monthRequests.filter(r => r.status === 'approved').length,
            rejected: monthRequests.filter(r => r.status === 'rejected').length,
            totalDays: monthRequests
                .filter(r => r.status === 'approved')
                .reduce((sum, r) => sum + r.days, 0)
        };
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }

    // Map DB row to legacy format
    _mapRequestToLegacy(r) {
        if (!r) return null;
        return {
            id: r.id,
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            leaveType: r.leave_type,
            startDate: r.start_date,
            endDate: r.end_date,
            days: r.days,
            isHalfDay: r.is_half_day,
            reason: r.reason,
            status: r.status,
            appliedOn: r.applied_on,
            approvedBy: r.approved_by,
            approvedOn: r.approved_on,
            rejectionReason: r.rejection_reason,
            salaryImpact: r.salary_impact
        };
    }
}

export const leaveService = new LeaveService();
