import { db } from '../core/database.js';
import { employeeService } from '../core/employee.js';
import { biometricService } from '../core/biometric.js';
import { leaveService } from '../core/leave.js';
import { payrollService } from '../core/payroll.js';

// HR Analytics & Reporting Service (Supabase-backed)
class ReportService {
    constructor() { }

    // Headcount report
    async getHeadcountReport() {
        const employees = await employeeService.getEmployees();
        const activeEmployees = employees.filter(e => e.status === 'active');

        // Department distribution
        const deptDistribution = {};
        activeEmployees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
        });

        // Gender distribution
        const genderDistribution = {};
        activeEmployees.forEach(emp => {
            const gender = emp.gender || 'Not Specified';
            genderDistribution[gender] = (genderDistribution[gender] || 0) + 1;
        });

        // New joinees (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newJoinees = activeEmployees.filter(emp =>
            emp.joiningDate && new Date(emp.joiningDate) > thirtyDaysAgo
        ).length;

        // Exits (last 30 days)
        const exitedRecentlyList = employees.filter(emp =>
            emp.status === 'exited' && emp.exitDate && new Date(emp.exitDate) > thirtyDaysAgo
        );

        return {
            totalActive: activeEmployees.length,
            totalExited: employees.filter(e => e.status === 'exited').length,
            totalDraft: employees.filter(e => e.status === 'draft').length,
            noticePeriod: employees.filter(e => e.status === 'notice_period').length,
            newJoinees,
            exitedRecently: exitedRecentlyList.length,
            departmentDistribution: deptDistribution,
            genderDistribution,
            attritionRate: employees.length > 0
                ? Math.round((exitedRecentlyList.length / employees.length) * 100)
                : 0
        };
    }

    // Attendance report
    async getAttendanceReport(month, year) {
        const employees = await employeeService.getEmployees({ status: 'active' });
        const report = {
            employees: [],
            summary: {
                avgPresent: 0,
                avgAbsent: 0,
                avgLate: 0,
                avgWorkingHours: 0,
                mostLateEmployee: null,
                bestAttendanceEmployee: null
            }
        };

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalWorkingHours = 0;
        let maxLate = 0;
        let maxPresent = 0;

        for (const emp of employees) {
            const attendance = await biometricService.getAttendanceSummary(emp.id, month, year);
            const empReport = {
                employeeId: emp.id,
                employeeName: emp.name,
                department: emp.department,
                ...attendance
            };

            report.employees.push(empReport);

            totalPresent += attendance.present;
            totalAbsent += attendance.absent;
            totalLate += attendance.late;
            totalWorkingHours += attendance.totalWorkingHours;

            if (attendance.late > maxLate) {
                maxLate = attendance.late;
                report.summary.mostLateEmployee = { name: emp.name, lateDays: attendance.late };
            }
            if (attendance.present > maxPresent) {
                maxPresent = attendance.present;
                report.summary.bestAttendanceEmployee = { name: emp.name, presentDays: attendance.present };
            }
        }

        const empCount = employees.length || 1;
        report.summary.avgPresent = Math.round(totalPresent / empCount);
        report.summary.avgAbsent = Math.round(totalAbsent / empCount);
        report.summary.avgLate = Math.round(totalLate / empCount);
        report.summary.avgWorkingHours = Math.round(totalWorkingHours / empCount);

        return report;
    }

    // Leave report
    async getLeaveReport(month, year) {
        return await leaveService.getLeaveStatistics(month, year);
    }

    // Payroll report
    async getPayrollReport(month, year) {
        return await payrollService.getPayrollSummary(month, year);
    }

    // Dashboard statistics
    async getDashboardStats() {
        const employees = await employeeService.getEmployees();
        const activeEmployees = employees.filter(e => e.status === 'active');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const todayAttendance = await biometricService.getAttendance({ startDate: today, endDate: today });
        const leaveStats = await leaveService.getLeaveStatistics(month, year);

        return {
            totalEmployees: activeEmployees.length,
            presentToday: todayAttendance.filter(a => a.status === 'present').length,
            absentToday: activeEmployees.length - todayAttendance.filter(a => a.status === 'present').length,
            onLeaveToday: todayAttendance.filter(a => a.status === 'on_leave').length,
            pendingLeaves: leaveStats.pending,
            newJoinees: employees.filter(emp => {
                if (!emp.joiningDate) return false;
                const joinDate = new Date(emp.joiningDate);
                return (now - joinDate) / (1000 * 60 * 60 * 24) <= 30;
            }).length
        };
    }
}

export const reportService = new ReportService();
