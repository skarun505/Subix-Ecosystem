import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { shiftService } from '../core/shift.js';
import { supabase } from '../core/supabase.js';

// Biometric Device Integration Service (Supabase-backed)
class BiometricService {
    constructor() { }

    // Initialize (seeds handled by SQL migration)
    async initializeDeviceConfig() { }

    // Parse raw log data from device/file
    async parseLogData(rawData) {
        const logs = rawData.split('\n');
        let processed = 0;
        let scanned = 0;

        for (const line of logs) {
            if (!line.trim()) continue;
            scanned++;

            const parts = line.split(',');
            if (parts.length >= 3) {
                const log = {
                    employeeId: parts[0].trim(),
                    timestamp: parts[1].trim(),
                    status: parseInt(parts[2].trim()),
                    deviceId: parts[3] ? parts[3].trim() : 'unknown'
                };

                await this.processAttendanceLog(log);
                processed++;
            }
        }

        return { success: true, scanned, processed };
    }

    // Process single attendance log
    async processAttendanceLog(log) {
        const employees = await employeeService.getEmployees();
        const employee = employees.find(e => e.employeeId === log.employeeId);

        if (!employee) return { success: false, message: 'Employee not found' };

        const timestamp = new Date(log.timestamp);
        if (isNaN(timestamp.getTime())) return { success: false, message: 'Invalid timestamp' };

        const date = timestamp.toISOString().split('T')[0];
        const time = timestamp.toTimeString().split(' ')[0].substring(0, 5);

        const shift = await shiftService.getEmployeeShift(employee.id, date);

        // Get or create attendance record
        let record = await this._getAttendanceRecord(employee.id, date);

        if (!record) {
            record = {
                employee_id: employee.id,
                employee_name: employee.name,
                date,
                in_time: null,
                out_time: null,
                break_logs: [],
                status: 'absent',
                working_hours: 0,
                is_late: false,
                is_early_checkout: false,
                overtime_hours: 0,
                source: 'biometric',
                device_id: log.deviceId,
                shift_id: shift?.id || null,
                shift_name: shift?.name || null
            };
        }

        if (log.status === 0) { // Check-in
            if (!record.in_time) {
                record.in_time = time;
                record.status = 'present';

                if (shift && shift.startTime) {
                    const [workHour, workMin] = shift.startTime.split(':').map(Number);
                    const graceMinutes = shift.graceTime || 15;
                    const gracePeriod = new Date(timestamp);
                    gracePeriod.setHours(workHour, workMin + graceMinutes, 0);
                    record.is_late = timestamp > gracePeriod;
                }
            }
        } else if (log.status === 1) { // Check-out
            record.out_time = time;

            if (record.in_time) {
                const workingHours = this.calculateWorkingHours(record.in_time, time, record.break_logs);
                record.working_hours = workingHours;

                const shiftDuration = shift?.fullDayHours || 9;
                if (workingHours > shiftDuration) {
                    record.overtime_hours = workingHours - shiftDuration;
                }

                if (shift && shift.endTime) {
                    const [endHour, endMin] = shift.endTime.split(':').map(Number);
                    const expectedEnd = new Date(timestamp);
                    expectedEnd.setHours(endHour, endMin, 0);
                    record.is_early_checkout = timestamp < expectedEnd;
                }
            }
        }

        // Upsert
        await db.upsert('attendance', record, { onConflict: 'employee_id,date' });
        return { success: true, record };
    }

    // Manual Attendance Marking
    async markAttendance(userId, type) {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].substring(0, 5);

        let employeeName = 'Unknown';
        try {
            const emp = await employeeService.getEmployee(userId);
            if (emp) employeeName = emp.name;
        } catch (e) {
            console.warn('Could not fetch employee details', e);
        }

        let record = await this._getAttendanceRecord(userId, date);
        if (!record) {
            record = {
                employee_id: userId,
                employee_name: employeeName,
                date,
                in_time: null,
                out_time: null,
                break_logs: [],
                status: 'absent',
                working_hours: 0,
                is_late: false,
                is_early_checkout: false,
                overtime_hours: 0,
                source: 'web',
                break_duration: 0,
                shift_id: null
            };
        }

        if (type === 'check-in') {
            if (record.in_time) return { success: false, message: 'Already clocked in' };
            record.in_time = time;
            record.status = 'present';
        } else if (type === 'check-out') {
            if (!record.in_time) return { success: false, message: 'Not clocked in' };
            record.out_time = time;
            record.working_hours = this.calculateWorkingHours(record.in_time, time, record.break_logs);
        } else if (type === 'break-start') {
            const lastBreak = record.break_logs[record.break_logs.length - 1];
            if (lastBreak && !lastBreak.end) return { success: false, message: 'Already on break' };
            record.break_logs.push({ start: time, end: null });
        } else if (type === 'break-end') {
            const lastBreak = record.break_logs[record.break_logs.length - 1];
            if (!lastBreak || lastBreak.end) return { success: false, message: 'Not on break' };
            lastBreak.end = time;

            const [sH, sM] = lastBreak.start.split(':').map(Number);
            const [eH, eM] = time.split(':').map(Number);
            const duration = (eH * 60 + eM) - (sH * 60 + sM);
            record.break_duration = (record.break_duration || 0) + duration;
        }

        await db.upsert('attendance', record, { onConflict: 'employee_id,date' });
        return { success: true, record: this._mapToLegacy(record) };
    }

    // Calculate working hours
    calculateWorkingHours(inTime, outTime, breakLogs = []) {
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);

        let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);

        for (const breakLog of breakLogs) {
            if (breakLog.start && breakLog.end) {
                const [bsH, bsM] = breakLog.start.split(':').map(Number);
                const [beH, beM] = breakLog.end.split(':').map(Number);
                totalMinutes -= ((beH * 60 + beM) - (bsH * 60 + bsM));
            }
        }

        return Math.round((totalMinutes / 60) * 100) / 100;
    }

    // Get attendance records
    async getAttendance(filters = {}) {
        let query = supabase.from('attendance').select('*');

        if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
        if (filters.status) query = query.eq('status', filters.status);

        query = query.order('date', { ascending: false });

        const { data, error } = await query;
        if (error) { console.error('getAttendance error:', error); return []; }

        return (data || []).map(r => this._mapToLegacy(r));
    }

    // Get attendance summary
    async getAttendanceSummary(employeeId, month = null, year = null) {
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

        const records = await this.getAttendance({
            employeeId,
            startDate,
            endDate
        });

        const summary = {
            totalDays: records.length,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            late: records.filter(r => r.isLate).length,
            halfDay: records.filter(r => r.workingHours > 0 && r.workingHours < 4).length,
            totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
            overtimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
            averageWorkingHours: 0
        };

        if (summary.present > 0) {
            summary.averageWorkingHours = Math.round((summary.totalWorkingHours / summary.present) * 100) / 100;
        }

        return summary;
    }

    // Generate sample biometric data
    async generateSampleData(employeeIds, days = 7) {
        const data = [];
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            if (date.getDay() === 0 || date.getDay() === 6) continue;

            for (const empId of employeeIds) {
                const dateStr = date.toISOString().split('T')[0];
                const shift = await shiftService.getEmployeeShift(empId, dateStr);

                if (!shift || shift.isOff) continue;

                const [sH, sM] = (shift.startTime || '10:00').split(':').map(Number);
                const [eH, eM] = (shift.endTime || '19:00').split(':').map(Number);

                const inVariation = Math.floor(Math.random() * 45) - 15;
                const inTimeDate = new Date(date);
                inTimeDate.setHours(sH, sM + inVariation, 0);
                const inTime = inTimeDate.toTimeString().split(' ')[0];

                const outVariation = Math.floor(Math.random() * 60) - 15;
                const outTimeDate = new Date(date);
                outTimeDate.setHours(eH, eM + outVariation, 0);
                const outTime = outTimeDate.toTimeString().split(' ')[0];

                data.push(`${empId},${dateStr}T${inTime},0,Device1`);
                data.push(`${empId},${dateStr}T${outTime},1,Device1`);
            }
        }

        return data.join('\n');
    }

    // Internal helper
    async _getAttendanceRecord(employeeId, date) {
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', date)
            .maybeSingle();
        return data;
    }

    // Map DB row to legacy format
    _mapToLegacy(r) {
        if (!r) return null;
        return {
            employeeId: r.employee_id,
            employeeName: r.employee_name,
            date: r.date,
            inTime: r.in_time,
            outTime: r.out_time,
            breakLogs: r.break_logs || [],
            status: r.status,
            workingHours: r.working_hours,
            isLate: r.is_late,
            isEarlyCheckout: r.is_early_checkout,
            overtimeHours: r.overtime_hours,
            source: r.source,
            deviceId: r.device_id,
            shiftId: r.shift_id,
            shiftName: r.shift_name,
            breakDuration: r.break_duration,
            corrected: r.corrected,
            correctionId: r.correction_id
        };
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }
}

export const biometricService = new BiometricService();
