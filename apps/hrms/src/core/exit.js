import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { leaveService } from '../core/leave.js';
import { payrollService } from '../core/payroll.js';
import { notificationService } from '../core/notification.js';

// Employee Exit Process Service (Supabase-backed)
class ExitService {
    constructor() { }

    // Initialize (seeds handled by SQL migration)
    async initializeExitModule() { }

    // Get exit reasons
    async getExitReasons() {
        return await db.getAll('exit_reasons');
    }

    // Get clearance checkpoints
    async getClearanceCheckpoints() {
        return await db.getAll('clearance_checkpoints');
    }

    // Submit resignation
    async initiateExit(data) {
        const employee = await employeeService.getEmployee(data.employeeId);
        if (!employee) return { success: false, message: 'Employee not found' };

        // Check for existing active exit request
        const existingExits = await db.getAll('employee_exits', { employee_id: data.employeeId });
        const activeExit = existingExits.find(e => ['pending_approval', 'approved', 'in_clearance'].includes(e.status));
        if (activeExit) return { success: false, message: 'An active exit request already exists' };

        const noticePeriod = employee.noticePeriod || 30;
        const lwdDate = new Date();
        lwdDate.setDate(lwdDate.getDate() + noticePeriod);

        const clearanceCheckpoints = await this.getClearanceCheckpoints();
        const clearance = {};
        clearanceCheckpoints.forEach(cp => {
            clearance[cp.id] = {
                department: cp.department,
                items: cp.items.map(item => ({ name: item, cleared: false, clearedBy: null, clearedOn: null })),
                completed: false
            };
        });

        const exits = await db.getAll('employee_exits');
        const newExit = {
            id: 'EXIT' + String(exits.length + 1).padStart(4, '0'),
            employee_id: data.employeeId,
            employee_name: employee.name,
            resignation_date: new Date().toISOString(),
            requested_lwd: data.requestedLWD || lwdDate.toISOString().split('T')[0],
            reason: data.reason,
            personal_email: data.personalEmail,
            status: 'pending_approval',
            clearance: clearance,
            fnf: null,
            comments: data.comments || ''
        };

        await db.insert('employee_exits', newExit);
        await notificationService.broadcast('Employee Resignation', `${employee.name} has submitted their resignation.`, 'warning');

        await this.logAction('exit_initiated', `Exit initiated for ${employee.name}`);
        return { success: true, exit: this._mapToLegacy(newExit) };
    }

    // Approve resignation
    async approveExit(exitId, approverId, comments = '') {
        const row = await db.getOne('employee_exits', 'id', exitId);
        if (!row) return { success: false, message: 'Exit request not found' };

        await db.update('employee_exits', 'id', exitId, {
            status: 'approved',
            approver_comments: comments,
            approval_date: new Date().toISOString()
        });

        // Move employee to notice period
        await employeeService.updateStatus(row.employee_id, 'notice_period', new Date().toISOString().split('T')[0], 'Resignation approved');

        await notificationService.notify(row.employee_id, 'Resignation Approved', 'Your resignation has been approved. Clearance process will begin.', 'info');
        await this.logAction('exit_approved', `Exit approved for ${row.employee_name}`);

        const updated = await db.getOne('employee_exits', 'id', exitId);
        return { success: true, exit: this._mapToLegacy(updated) };
    }

    // Reject resignation
    async rejectExit(exitId, approverId, reason) {
        const row = await db.getOne('employee_exits', 'id', exitId);
        if (!row) return { success: false, message: 'Exit request not found' };

        await db.update('employee_exits', 'id', exitId, {
            status: 'rejected',
            approver_comments: reason,
            approval_date: new Date().toISOString()
        });

        await notificationService.notify(row.employee_id, 'Resignation Rejected', `Your resignation request has been rejected. Reason: ${reason}`, 'info');
        await this.logAction('exit_rejected', `Exit rejected for ${row.employee_name}`);

        const updated = await db.getOne('employee_exits', 'id', exitId);
        return { success: true, exit: this._mapToLegacy(updated) };
    }

    // Update clearance
    async updateClearance(exitId, department, itemIndex, cleared, clearedBy) {
        const row = await db.getOne('employee_exits', 'id', exitId);
        if (!row) return { success: false, message: 'Exit request not found' };

        const clearance = row.clearance || {};
        if (!clearance[department]) return { success: false, message: 'Department not found in clearance' };

        clearance[department].items[itemIndex].cleared = cleared;
        clearance[department].items[itemIndex].clearedBy = clearedBy;
        clearance[department].items[itemIndex].clearedOn = new Date().toISOString();

        clearance[department].completed = clearance[department].items.every(item => item.cleared);

        // Check if all departments are cleared
        const allCleared = Object.values(clearance).every(dept => dept.completed);
        const status = allCleared ? 'in_fnf' : row.status;

        await db.update('employee_exits', 'id', exitId, { clearance, status });

        if (allCleared) {
            await notificationService.notify(row.employee_id, 'Clearance Complete ✅', 'All clearance departments have been completed. F&F processing will begin.', 'success');
        }

        return { success: true };
    }

    // Calculate F&F settlement
    async calculateFnF(exitId) {
        const row = await db.getOne('employee_exits', 'id', exitId);
        if (!row) return { success: false, message: 'Exit request not found' };

        const employee = await employeeService.getEmployee(row.employee_id);
        if (!employee) return { success: false, message: 'Employee not found' };

        const salary = employee.salaryStructure || { gross: employee.monthlyCTC || 0, basic: 0, hra: 0 };
        const leaveBalance = await leaveService.getLeaveBalance(row.employee_id);

        const perDaySalary = salary.gross / 30;
        const lastWorkingDay = row.requested_lwd ? new Date(row.requested_lwd) : new Date();
        const currentDate = new Date();
        const daysWorked = Math.ceil((currentDate - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) / (1000 * 60 * 60 * 24));

        const earnedSalary = Math.round(perDaySalary * daysWorked);
        const leaveEncashment = leaveBalance?.pl?.remaining
            ? Math.round(leaveBalance.pl.remaining * perDaySalary)
            : 0;
        const gratuity = this.calculateGratuity(employee);
        const bonus = 0;

        const pfDeduction = salary.pf || Math.round(salary.basic * 0.12) || 0;
        const taxDeduction = 0;
        const noticePayRecovery = 0;
        const otherDeductions = 0;

        const totalEarnings = earnedSalary + leaveEncashment + gratuity + bonus;
        const totalDeductions = pfDeduction + taxDeduction + noticePayRecovery + otherDeductions;
        const netPayable = totalEarnings - totalDeductions;

        const fnf = {
            earnings: {
                earnedSalary,
                leaveEncashment,
                gratuity,
                bonus
            },
            deductions: {
                pf: pfDeduction,
                tax: taxDeduction,
                noticePayRecovery,
                otherDeductions
            },
            totalEarnings,
            totalDeductions,
            netPayable,
            calculatedOn: new Date().toISOString()
        };

        await db.update('employee_exits', 'id', exitId, { fnf, status: 'in_fnf' });
        return { success: true, fnf };
    }

    // Calculate gratuity
    calculateGratuity(employee) {
        const joiningDate = new Date(employee.joiningDate);
        const yearsOfService = (new Date() - joiningDate) / (1000 * 60 * 60 * 24 * 365.25);

        if (yearsOfService < 5) return 0;

        const lastDrawnSalary = employee.salaryStructure?.basic || 0;
        return Math.round((lastDrawnSalary * 15 * Math.floor(yearsOfService)) / 26);
    }

    // Complete exit
    async completeExit(exitId) {
        const row = await db.getOne('employee_exits', 'id', exitId);
        if (!row) return { success: false, message: 'Exit request not found' };

        await db.update('employee_exits', 'id', exitId, {
            status: 'completed',
            completed_at: new Date().toISOString()
        });

        // Mark employee as exited
        await employeeService.updateStatus(row.employee_id, 'exited', new Date().toISOString().split('T')[0], 'Exit completed');

        await this.logAction('exit_completed', `Exit completed for ${row.employee_name}`);

        const updated = await db.getOne('employee_exits', 'id', exitId);
        return { success: true, exit: this._mapToLegacy(updated) };
    }

    // Get all exit records
    async getExits(filters = {}) {
        const dbFilters = {};
        if (filters.employeeId) dbFilters.employee_id = filters.employeeId;
        if (filters.status) dbFilters.status = filters.status;

        const rows = await db.getAll('employee_exits', dbFilters);
        return rows.map(r => this._mapToLegacy(r));
    }

    // Get single exit
    async getExit(exitId) {
        const row = await db.getOne('employee_exits', 'id', exitId);
        return row ? this._mapToLegacy(row) : null;
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }

    _mapToLegacy(r) {
        if (!r) return null;
        return {
            id: r.id,
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            resignationDate: r.resignation_date,
            requestedLWD: r.requested_lwd,
            reason: r.reason,
            personalEmail: r.personal_email,
            status: r.status,
            clearance: r.clearance,
            fnf: r.fnf,
            comments: r.comments,
            approverComments: r.approver_comments,
            approvalDate: r.approval_date,
            completedAt: r.completed_at
        };
    }
}

export const exitService = new ExitService();
