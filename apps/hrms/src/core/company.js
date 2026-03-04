import { db } from '../core/database.js';
import { authService } from '../core/auth.js';

// Company Management Service (Supabase-backed)
class CompanyService {
    constructor() { }

    // Initialize defaults (seeds are handled by SQL migration)
    async initializeDefaults() {
        // No-op: seed data is in the SQL migration
    }

    // Company CRUD
    async getCompany() {
        return await db.getOne('company', 'id', 'COMP001');
    }

    async updateCompany(data) {
        const company = await this.getCompany();
        const updates = { ...data, updated_at: new Date().toISOString() };
        if (company) {
            const updated = await db.update('company', 'id', company.id, updates);
            await this.logAction('company_updated', 'Company details updated');
            return updated;
        }
        return null;
    }

    // Department CRUD
    async getDepartments() {
        return await db.getAll('departments');
    }

    async getDepartment(id) {
        return await db.getOne('departments', 'id', id);
    }

    async addDepartment(name, headId = null) {
        const departments = await this.getDepartments();
        const newDept = {
            id: 'DEPT' + String(departments.length + 1).padStart(3, '0'),
            name,
            head_id: headId,
            status: 'active'
        };
        const inserted = await db.insert('departments', newDept);
        await this.logAction('department_created', `Department ${name} created`);
        return inserted;
    }

    async updateDepartment(id, data) {
        const updates = { ...data, updated_at: new Date().toISOString() };
        const updated = await db.update('departments', 'id', id, updates);
        if (updated) {
            await this.logAction('department_updated', `Department ${id} updated`);
        }
        return updated;
    }

    async deleteDepartment(id) {
        const result = await db.deleteRow('departments', 'id', id);
        await this.logAction('department_deleted', `Department ${id} deleted`);
        return result;
    }

    // Designation CRUD
    async getDesignations() {
        return await db.getAll('designations');
    }

    async getDesignationsByDepartment(departmentId) {
        return await db.getAll('designations', { department_id: departmentId });
    }

    async addDesignation(name, level, departmentId) {
        const designations = await this.getDesignations();
        const newDes = {
            id: 'DES' + String(designations.length + 1).padStart(3, '0'),
            name,
            level,
            department_id: departmentId,
            status: 'active'
        };
        const inserted = await db.insert('designations', newDes);
        await this.logAction('designation_created', `Designation ${name} created`);
        return inserted;
    }

    async updateDesignation(id, data) {
        const updated = await db.update('designations', 'id', id, data);
        if (updated) {
            await this.logAction('designation_updated', `Designation ${id} updated`);
        }
        return updated;
    }

    async deleteDesignation(id) {
        const result = await db.deleteRow('designations', 'id', id);
        await this.logAction('designation_deleted', `Designation ${id} deleted`);
        return result;
    }

    // Holidays CRUD
    async getHolidays(year = new Date().getFullYear()) {
        return await db.getAll('holidays', { year });
    }

    async addHoliday(name, date, type = 'public') {
        const year = new Date(date).getFullYear();
        const holidays = await db.getAll('holidays');
        const newHoliday = {
            id: 'HOL' + String(holidays.length + 1).padStart(3, '0'),
            name,
            date,
            type,
            year
        };
        const inserted = await db.insert('holidays', newHoliday);
        await this.logAction('holiday_created', `Holiday ${name} added`);
        return inserted;
    }

    async deleteHoliday(id) {
        const result = await db.deleteRow('holidays', 'id', id);
        await this.logAction('holiday_deleted', `Holiday ${id} deleted`);
        return result;
    }

    // Audit logging
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }
}

export const companyService = new CompanyService();
