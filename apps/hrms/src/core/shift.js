import { db } from '../core/database.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';

// Shift Service (Supabase-backed)
class ShiftService {
    constructor() { }

    // Initialize (seeds handled by SQL migration)
    async initializeShifts() { }

    // Get all shifts
    async getShifts() {
        const rows = await db.getAll('shifts');
        return rows.map(r => this._mapToLegacy(r));
    }

    // Get single shift
    async getShift(id) {
        const row = await db.getOne('shifts', 'id', id);
        return row ? this._mapToLegacy(row) : null;
    }

    // Add new shift
    async addShift(shiftData) {
        const shifts = await db.getAll('shifts');
        const newId = 'S' + String(shifts.length + 1).padStart(3, '0');

        const newRow = {
            id: newId,
            name: shiftData.name,
            code: shiftData.code,
            start_time: shiftData.startTime,
            end_time: shiftData.endTime,
            break_duration: shiftData.breakDuration,
            grace_time: shiftData.graceTime,
            half_day_hours: shiftData.halfDayHours,
            full_day_hours: shiftData.fullDayHours,
            is_default: shiftData.isDefault || false,
            is_off: shiftData.isOff || false,
            color: shiftData.color || '#3b82f6'
        };

        const inserted = await db.insert('shifts', newRow);
        await this.logAction('shift_created', `Shift ${shiftData.name} created`);
        return inserted ? this._mapToLegacy(inserted) : null;
    }

    // Update shift
    async updateShift(id, updates) {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.code !== undefined) dbUpdates.code = updates.code;
        if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
        if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
        if (updates.breakDuration !== undefined) dbUpdates.break_duration = updates.breakDuration;
        if (updates.graceTime !== undefined) dbUpdates.grace_time = updates.graceTime;
        if (updates.halfDayHours !== undefined) dbUpdates.half_day_hours = updates.halfDayHours;
        if (updates.fullDayHours !== undefined) dbUpdates.full_day_hours = updates.fullDayHours;
        if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
        if (updates.color !== undefined) dbUpdates.color = updates.color;

        const updated = await db.update('shifts', 'id', id, dbUpdates);
        if (updated) await this.logAction('shift_updated', `Shift ${updated.name} updated`);
        return updated ? this._mapToLegacy(updated) : null;
    }

    // Delete shift
    async deleteShift(id) {
        const result = await db.deleteRow('shifts', 'id', id);
        if (result) await this.logAction('shift_deleted', `Shift ${id} deleted`);
        return result;
    }

    // Assign Roster
    async assignRoster(assignments) {
        const session = authService.getCurrentUser();
        for (const assign of assignments) {
            await db.upsert('roster', {
                employee_id: assign.employeeId,
                date: assign.date,
                shift_id: assign.shiftId,
                assigned_by: session?.userId,
                assigned_on: new Date().toISOString()
            }, { onConflict: 'employee_id,date' });
        }
        await this.logAction('roster_updated', `Assigned shifts for ${assignments.length} entries`);
    }

    // Get employee shift for specific date
    async getEmployeeShift(employeeId, date) {
        const roster = await db.getAll('roster', { employee_id: employeeId, date });
        if (roster.length > 0) {
            const shift = await this.getShift(roster[0].shift_id);
            if (shift) return shift;
        }

        // Return default shift
        const shifts = await this.getShifts();
        return shifts.find(s => s.isDefault) || shifts[0] || {
            id: 'GS', name: 'General Shift', startTime: '10:00', endTime: '19:00',
            graceTime: 15, fullDayHours: 8, halfDayHours: 4
        };
    }

    // Get roster for date range
    async getRoster(startDate, endDate, employeeId = null) {
        const result = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        const employees = employeeId
            ? [await employeeService.getEmployee(employeeId)]
            : await employeeService.getEmployees({ status: 'active' });

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];

            for (const emp of employees) {
                if (!emp) continue;
                const shift = await this.getEmployeeShift(emp.id, dateStr);
                result.push({
                    date: dateStr,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    shift
                });
            }
        }

        return result;
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
            name: row.name,
            code: row.code,
            startTime: row.start_time,
            endTime: row.end_time,
            breakDuration: row.break_duration,
            graceTime: row.grace_time,
            halfDayHours: row.half_day_hours,
            fullDayHours: row.full_day_hours,
            isDefault: row.is_default,
            isOff: row.is_off,
            color: row.color
        };
    }
}

export const shiftService = new ShiftService();
