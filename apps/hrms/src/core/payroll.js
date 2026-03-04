import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { biometricService } from '../core/biometric.js';
import { leaveService } from '../core/leave.js';

// Payroll Engine Service (Supabase-backed)
class PayrollService {
    constructor() { }

    // Initialize (seeds handled by SQL migration)
    async initializePayrollSettings() { }

    // Get payroll settings
    async getPayrollSettings() {
        const rows = await db.getAll('payroll_settings');
        if (rows.length === 0) return {};
        const r = rows[0];
        return {
            pfRate: r.pf_rate,
            esiRate: r.esi_rate,
            esiThreshold: r.esi_threshold,
            professionalTax: r.professional_tax,
            tdsEnabled: r.tds_enabled,
            workingDaysPerMonth: r.working_days_per_month,
            overtimeRate: r.overtime_rate,
            lateDeductionPerDay: r.late_deduction_per_day
        };
    }

    // Update payroll settings
    async updatePayrollSettings(settings) {
        const rows = await db.getAll('payroll_settings');
        if (rows.length > 0) {
            const dbUpdates = {};
            if (settings.pfRate !== undefined) dbUpdates.pf_rate = settings.pfRate;
            if (settings.esiRate !== undefined) dbUpdates.esi_rate = settings.esiRate;
            if (settings.esiThreshold !== undefined) dbUpdates.esi_threshold = settings.esiThreshold;
            if (settings.professionalTax !== undefined) dbUpdates.professional_tax = settings.professionalTax;
            if (settings.tdsEnabled !== undefined) dbUpdates.tds_enabled = settings.tdsEnabled;
            if (settings.workingDaysPerMonth !== undefined) dbUpdates.working_days_per_month = settings.workingDaysPerMonth;
            if (settings.overtimeRate !== undefined) dbUpdates.overtime_rate = settings.overtimeRate;
            if (settings.lateDeductionPerDay !== undefined) dbUpdates.late_deduction_per_day = settings.lateDeductionPerDay;

            await db.update('payroll_settings', 'id', rows[0].id, dbUpdates);
        }
        await this.logAction('payroll_settings_updated', 'Payroll settings updated');
    }

    // Process monthly payroll
    async processMonthlyPayroll(month, year) {
        const employees = await employeeService.getEmployees({ status: 'active' });
        const results = [];

        for (const employee of employees) {
            try {
                const payslip = await this.calculatePayslip(employee.id, month, year);
                results.push({ success: true, employee: employee.name, payslip });
            } catch (error) {
                results.push({ success: false, employee: employee.name, error: error.message });
            }
        }

        await this.logAction('payroll_processed', `Processed payroll for ${month}/${year}`);
        return results;
    }

    // Calculate payslip
    async calculatePayslip(employeeId, month, year) {
        const employee = await employeeService.getEmployee(employeeId);
        if (!employee) throw new Error('Employee not found');

        let salary = employee.salaryStructure;
        if (!salary) {
            const userSalary = employee.salary || { basic: 25000, hra: 10000, special: 8000 };
            salary = {
                basic: userSalary.basic || 25000,
                hra: userSalary.hra || 10000,
                conveyance: userSalary.conveyance || 1600,
                medicalAllowance: userSalary.medicalAllowance || 1250,
                specialAllowance: userSalary.special || userSalary.specialAllowance || 8000,
                gross: (userSalary.basic || 25000) + (userSalary.hra || 10000) + (userSalary.special || 8000) + 2850
            };
        }

        const settings = await this.getPayrollSettings();
        const attendanceSummary = await biometricService.getAttendanceSummary(employeeId, month, year);
        const leaves = await this.getApprovedLeaves(employeeId, month, year);

        const totalDaysInMonth = new Date(year, month, 0).getDate();
        const workingDays = settings.workingDaysPerMonth || 26;
        const presentDays = attendanceSummary.present;
        const absentDays = attendanceSummary.absent;
        const leaveDays = leaves.totalDays;
        const paidLeaveDays = leaves.paidDays;
        const unpaidLeaveDays = leaves.unpaidDays;
        const effectiveWorkingDays = presentDays + paidLeaveDays;
        const perDaySalary = salary.gross / workingDays;

        let earnings = {
            basic: salary.basic,
            hra: salary.hra,
            conveyance: salary.conveyance || 0,
            medicalAllowance: salary.medicalAllowance || 0,
            specialAllowance: salary.specialAllowance || 0
        };

        const overtimeHours = attendanceSummary.overtimeHours || 0;
        const hourlyRate = salary.gross / (workingDays * 8);
        const overtimeEarnings = overtimeHours * hourlyRate * (settings.overtimeRate || 1.5);
        earnings.overtime = Math.round(overtimeEarnings);

        const grossEarnings = Object.values(earnings).reduce((sum, val) => sum + val, 0);

        let deductions = {
            pf: Math.round(salary.basic * ((settings.pfRate || 12) / 100)),
            esi: salary.gross < (settings.esiThreshold || 21000) ? Math.round(salary.gross * ((settings.esiRate || 0.75) / 100)) : 0,
            professionalTax: settings.professionalTax || 200,
            tds: 0
        };

        const unpaidDaysTotal = absentDays + unpaidLeaveDays;
        deductions.absence = Math.round(unpaidDaysTotal * perDaySalary);

        if ((settings.lateDeductionPerDay || 0) > 0) {
            deductions.lateMark = attendanceSummary.late * settings.lateDeductionPerDay;
        } else {
            deductions.lateMark = 0;
        }

        const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
        const netSalary = grossEarnings - totalDeductions;

        const payslip = {
            id: `PAY${employeeId}_${month}_${year}`,
            employee_id: employeeId,
            employee_name: employee.name,
            employee_code: employee.employeeId,
            month,
            year,
            designation: employee.designation,
            department: employee.department,
            attendance: {
                totalDays: totalDaysInMonth,
                workingDays,
                presentDays,
                absentDays,
                paidLeaveDays,
                unpaidLeaveDays,
                lateMarks: attendanceSummary.late,
                overtimeHours: overtimeHours.toFixed(2),
                effectiveWorkingDays
            },
            earnings,
            gross_earnings: grossEarnings,
            deductions,
            total_deductions: totalDeductions,
            net_salary: netSalary,
            status: 'draft',
            processed_on: new Date().toISOString(),
            processed_by: authService.getCurrentUser()?.userId || 'system',
            approved_on: null,
            approved_by: null,
            paid_on: null
        };

        await db.upsert('payslips', payslip, { onConflict: 'id' });
        return this._mapPayslipToLegacy(payslip);
    }

    // Get approved leaves for month
    async getApprovedLeaves(employeeId, month, year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const requests = await leaveService.getLeaveRequests({
            employeeId,
            status: 'approved'
        });

        const monthLeaves = requests.filter(r =>
            r.startDate >= startDate && r.startDate <= endDate
        );

        let paidDays = 0;
        let unpaidDays = 0;

        monthLeaves.forEach(leave => {
            if (leave.salaryImpact && leave.salaryImpact.unpaidDays > 0) {
                unpaidDays += leave.salaryImpact.unpaidDays;
                paidDays += (leave.days - leave.salaryImpact.unpaidDays);
            } else {
                paidDays += leave.days;
            }
        });

        return { totalDays: paidDays + unpaidDays, paidDays, unpaidDays };
    }

    // Get payslips
    async getPayslips(filters = {}) {
        const dbFilters = {};
        if (filters.employeeId) dbFilters.employee_id = filters.employeeId;
        if (filters.month) dbFilters.month = filters.month;
        if (filters.year) dbFilters.year = filters.year;
        if (filters.status) dbFilters.status = filters.status;

        const rows = await db.getAll('payslips', dbFilters, { column: 'year', ascending: false });
        return rows.map(r => this._mapPayslipToLegacy(r));
    }

    // Get single payslip
    async getPayslip(id) {
        const row = await db.getOne('payslips', 'id', id);
        return row ? this._mapPayslipToLegacy(row) : null;
    }

    // Approve payslip
    async approvePayslip(payslipId, approverId) {
        const row = await db.getOne('payslips', 'id', payslipId);
        if (!row) return { success: false, message: 'Payslip not found' };

        const approver = await employeeService.getEmployee(approverId);
        await db.update('payslips', 'id', payslipId, {
            status: 'approved',
            approved_on: new Date().toISOString(),
            approved_by: approver?.name || approverId
        });

        await this.logAction('payslip_approved', `Payslip ${payslipId} approved`);
        const updated = await db.getOne('payslips', 'id', payslipId);
        return { success: true, payslip: this._mapPayslipToLegacy(updated) };
    }

    // Mark as paid
    async markAsPaid(payslipId) {
        const row = await db.getOne('payslips', 'id', payslipId);
        if (!row) return { success: false, message: 'Payslip not found' };

        await db.update('payslips', 'id', payslipId, {
            status: 'paid',
            paid_on: new Date().toISOString()
        });

        await this.logAction('payslip_paid', `Payslip ${payslipId} marked as paid`);
        const updated = await db.getOne('payslips', 'id', payslipId);
        return { success: true, payslip: this._mapPayslipToLegacy(updated) };
    }

    // Get payroll summary
    async getPayrollSummary(month, year) {
        const payslips = await this.getPayslips({ month, year });

        const summary = {
            totalEmployees: payslips.length,
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
            totalOvertimePaid: 0,
            totalAbsenceDeduction: 0,
            byStatus: { draft: 0, approved: 0, paid: 0 }
        };

        payslips.forEach(p => {
            summary.totalGross += p.grossEarnings;
            summary.totalDeductions += p.totalDeductions;
            summary.totalNet += p.netSalary;
            summary.totalOvertimePaid += (p.earnings.overtime || 0);
            summary.totalAbsenceDeduction += (p.deductions.absence || 0);
            summary.byStatus[p.status]++;
        });

        return summary;
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }

    // Map payslip to legacy format
    _mapPayslipToLegacy(r) {
        if (!r) return null;
        return {
            id: r.id,
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            employeeCode: r.employee_code,
            month: r.month,
            year: r.year,
            designation: r.designation,
            department: r.department,
            attendance: r.attendance,
            earnings: r.earnings,
            grossEarnings: r.gross_earnings,
            deductions: r.deductions,
            totalDeductions: r.total_deductions,
            netSalary: r.net_salary,
            status: r.status,
            processedOn: r.processed_on,
            processedBy: r.processed_by,
            approvedOn: r.approved_on,
            approvedBy: r.approved_by,
            paidOn: r.paid_on
        };
    }
}

export const payrollService = new PayrollService();
