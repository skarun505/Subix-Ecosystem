import { db } from '../core/database.js';
import { authService } from '../core/auth.js';

// Employee Management Service (Supabase-backed)
class EmployeeService {
    constructor() { }

    // Initialize leave policy templates (seeds if empty)
    async initializeLeaveTemplates() {
        const count = await db.count('leave_templates');
        if (count === 0) {
            await db.insert('leave_templates', { id: 'LT001', name: 'Standard Policy', cl: 12, pl: 18, sl: 10, carry_forward: true, max_carry_forward: 5 });
            await db.insert('leave_templates', { id: 'LT002', name: 'Manager Policy', cl: 15, pl: 20, sl: 10, carry_forward: true, max_carry_forward: 8 });
            await db.insert('leave_templates', { id: 'LT003', name: 'Probation Policy', cl: 6, pl: 0, sl: 5, carry_forward: false, max_carry_forward: 0 });
        }
    }

    // Initialize salary templates (seeds if empty)
    async initializeSalaryTemplates() {
        const count = await db.count('salary_templates');
        if (count === 0) {
            await db.insert('salary_templates', { id: 'ST001', name: 'Junior Level', basic_percentage: 40, hra_percentage: 50, special_allowance: 10, pf_applicable: true, esi_applicable: false, pt_applicable: true });
            await db.insert('salary_templates', { id: 'ST002', name: 'Mid Level', basic_percentage: 45, hra_percentage: 45, special_allowance: 10, pf_applicable: true, esi_applicable: false, pt_applicable: true });
            await db.insert('salary_templates', { id: 'ST003', name: 'Senior Level', basic_percentage: 50, hra_percentage: 40, special_allowance: 10, pf_applicable: true, esi_applicable: false, pt_applicable: true });
        }
    }

    // Get all employees
    async getEmployees(filters = {}) {
        const dbFilters = {};
        if (filters.status) dbFilters.status = filters.status;
        if (filters.department) dbFilters.department = filters.department;
        if (filters.role) dbFilters.role = filters.role;

        const users = await db.getAll('users', dbFilters);

        // Map snake_case DB columns to camelCase for backward compatibility
        return users.map(u => this._mapToLegacy(u));
    }

    // Get single employee
    async getEmployee(id) {
        const user = await db.getOne('users', 'id', id);
        return user ? this._mapToLegacy(user) : null;
    }

    // Add new employee
    async addEmployee(employeeData) {
        const users = await db.getAll('users');
        const empCount = users.filter(u => u.employee_id?.startsWith('E')).length;
        const newEmployeeId = 'E' + String(empCount + 1).padStart(3, '0');
        const newUserId = 'U' + String(users.length + 1).padStart(3, '0');

        const tempPassword = this.generateTempPassword();
        const session = authService.getCurrentUser();

        const newRow = {
            id: newUserId,
            employee_id: newEmployeeId,
            email: employeeData.email,
            name: employeeData.name,
            mobile: employeeData.mobile || '',
            role: employeeData.role || 'employee',
            department: employeeData.department,
            designation: employeeData.designation,
            manager: employeeData.manager || null,
            company_code: employeeData.companyCode || 'COMP001',
            status: 'draft',
            joining_date: employeeData.joiningDate,
            date_of_birth: employeeData.dateOfBirth || null,
            address: employeeData.address || '',
            emergency_contact: employeeData.emergencyContact || '',
            blood_group: employeeData.bloodGroup || '',
            temp_password: tempPassword,
            password_setup: false,
            salary_structure: null,
            monthly_ctc: employeeData.monthlyCTC || 0,
            leave_policy: null,
            created_by: session?.userId || 'system'
        };

        const inserted = await db.insert('users', newRow);
        if (!inserted) return null;

        await this.logAction('employee_created', `Employee ${employeeData.name} created with ID ${newEmployeeId}`);

        return this._mapToLegacy(inserted);
    }

    // Update employee
    async updateEmployee(id, updates) {
        // Convert camelCase updates to snake_case for DB
        const dbUpdates = this._mapToDb(updates);
        dbUpdates.updated_at = new Date().toISOString();
        dbUpdates.updated_by = authService.getCurrentUser()?.userId || 'system';

        const updated = await db.update('users', 'id', id, dbUpdates);
        if (!updated) return null;

        await this.logAction('employee_updated', `Employee ${id} updated`);
        return this._mapToLegacy(updated);
    }

    // Assign salary structure
    async assignSalaryStructure(employeeId, monthlyCTC, templateId) {
        const template = await this.getSalaryTemplate(templateId);
        if (!template) return null;

        const salaryStructure = this.calculateSalaryBreakdown(monthlyCTC, template);
        return await this.updateEmployee(employeeId, {
            monthlyCTC,
            salaryStructure
        });
    }

    // Calculate salary breakdown
    calculateSalaryBreakdown(grossSalary, template) {
        const basicPct = template.basicPercentage || template.basic_percentage;
        const hraPct = template.hraPercentage || template.hra_percentage;
        const pfApplicable = template.pfApplicable ?? template.pf_applicable;
        const esiApplicable = template.esiApplicable ?? template.esi_applicable;
        const ptApplicable = template.ptApplicable ?? template.pt_applicable;

        const basic = Math.round((grossSalary * basicPct) / 100);
        const hra = Math.round((grossSalary * hraPct) / 100);
        const special = grossSalary - basic - hra;

        const pf = pfApplicable ? Math.round(basic * 0.12) : 0;
        const esi = esiApplicable && grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
        const pt = ptApplicable ? 200 : 0;

        return {
            gross: grossSalary,
            basic,
            hra,
            conveyance: 1600,
            specialAllowance: special - 1600,
            pf,
            esi,
            pt,
            tds: 0,
            netSalary: grossSalary - (pf + esi + pt)
        };
    }

    // Assign leave policy
    async assignLeavePolicy(employeeId, templateId) {
        const template = await this.getLeaveTemplate(templateId);
        if (!template) return null;

        const leavePolicy = {
            templateId,
            cl: { total: template.cl, used: 0, remaining: template.cl },
            pl: { total: template.pl, used: 0, remaining: template.pl },
            sl: { total: template.sl, used: 0, remaining: template.sl },
            carryForward: template.carry_forward ?? template.carryForward,
            maxCarryForward: template.max_carry_forward ?? template.maxCarryForward,
            assignedDate: new Date().toISOString()
        };

        return await this.updateEmployee(employeeId, { leavePolicy });
    }

    // Update employee status
    async updateStatus(employeeId, newStatus, effectiveDate, remarks = '') {
        const employee = await this.getEmployee(employeeId);
        if (!employee) return null;

        const validTransitions = {
            draft: ['active', 'exited'],
            active: ['notice_period', 'exited'],
            notice_period: ['active', 'exited'],
            exited: []
        };

        if (!validTransitions[employee.status]?.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${employee.status} to ${newStatus}`);
        }

        if (newStatus === 'active' && employee.status === 'draft') {
            if (!employee.salaryStructure) throw new Error('Cannot activate: Salary structure not assigned');
            if (!employee.leavePolicy) throw new Error('Cannot activate: Leave policy not assigned');
        }

        const updates = {
            status: newStatus,
            statusHistory: [
                ...(employee.statusHistory || []),
                {
                    from: employee.status,
                    to: newStatus,
                    date: effectiveDate,
                    remarks,
                    changedBy: authService.getCurrentUser()?.userId
                }
            ]
        };

        if (newStatus === 'active') {
            updates.activationDate = effectiveDate;
            if (!employee.password) {
                updates.password = employee.tempPassword;
            }
        } else if (newStatus === 'exited') {
            updates.exitDate = effectiveDate;
        }

        await this.logAction('status_changed', `Employee ${employeeId} status changed to ${newStatus}`);
        return await this.updateEmployee(employeeId, updates);
    }

    // Get leave templates
    async getLeaveTemplates() {
        return await db.getAll('leave_templates');
    }

    async getLeaveTemplate(id) {
        return await db.getOne('leave_templates', 'id', id);
    }

    // Get salary templates
    async getSalaryTemplates() {
        return await db.getAll('salary_templates');
    }

    async getSalaryTemplate(id) {
        return await db.getOne('salary_templates', 'id', id);
    }

    // Generate temporary password
    generateTempPassword() {
        return 'Temp' + Math.random().toString(36).substr(2, 6) + '!';
    }

    // Search employees
    async searchEmployees(query) {
        const employees = await this.getEmployees();
        const lowerQuery = query.toLowerCase();
        return employees.filter(emp =>
            emp.name?.toLowerCase().includes(lowerQuery) ||
            emp.employeeId?.toLowerCase().includes(lowerQuery) ||
            emp.email?.toLowerCase().includes(lowerQuery) ||
            emp.department?.toLowerCase().includes(lowerQuery)
        );
    }

    // Log actions
    async logAction(action, details) {
        const session = authService.getCurrentUser();
        if (session) {
            await authService.logAudit(action, session.userId, details);
        }
    }

    // ---- Internal mapping helpers ----
    // Convert DB snake_case row to camelCase (legacy format)
    _mapToLegacy(row) {
        if (!row) return null;
        return {
            id: row.id,
            employeeId: row.employee_id,
            email: row.email,
            password: row.password,
            tempPassword: row.temp_password,
            passwordSetup: row.password_setup,
            name: row.name,
            mobile: row.mobile,
            role: row.role,
            department: row.department,
            designation: row.designation,
            manager: row.manager,
            managerId: row.manager_id,
            companyCode: row.company_code,
            status: row.status,
            joiningDate: row.joining_date,
            dateOfBirth: row.date_of_birth,
            address: row.address,
            emergencyContact: row.emergency_contact,
            bloodGroup: row.blood_group,
            gender: row.gender,
            salary: row.salary,
            salaryStructure: row.salary_structure,
            monthlyCTC: row.monthly_ctc,
            leavePolicy: row.leave_policy,
            noticePeriod: row.notice_period,
            activationDate: row.activation_date,
            exitDate: row.exit_date,
            statusHistory: row.status_history,
            createdAt: row.created_at,
            createdBy: row.created_by,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by
        };
    }

    // Convert camelCase updates to snake_case for DB
    _mapToDb(updates) {
        const map = {
            employeeId: 'employee_id',
            tempPassword: 'temp_password',
            passwordSetup: 'password_setup',
            companyCode: 'company_code',
            joiningDate: 'joining_date',
            dateOfBirth: 'date_of_birth',
            emergencyContact: 'emergency_contact',
            bloodGroup: 'blood_group',
            salaryStructure: 'salary_structure',
            monthlyCTC: 'monthly_ctc',
            leavePolicy: 'leave_policy',
            noticePeriod: 'notice_period',
            activationDate: 'activation_date',
            exitDate: 'exit_date',
            statusHistory: 'status_history',
            managerId: 'manager_id',
            createdBy: 'created_by',
            updatedBy: 'updated_by'
        };

        const result = {};
        Object.entries(updates).forEach(([key, value]) => {
            const dbKey = map[key] || key;
            result[dbKey] = value;
        });
        return result;
    }
}

export const employeeService = new EmployeeService();
