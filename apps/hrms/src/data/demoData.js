import { supabase } from '../core/supabase.js';
import { db } from '../core/database.js';

// Comprehensive Demo Data Generator (Supabase-backed)
// Creates realistic data for all HRMS modules in Supabase tables

export async function generateDemoData() {
    console.log('🚀 Generating comprehensive demo data in Supabase...');

    try {
        await generateAdditionalEmployees();
        await generateAttendanceData();
        await generateLeaveData();
        await generatePayrollData();
        await generatePerformanceData();
        await generateExitData();

        await db.setState('demoDataGenerated', true);
        console.log('✅ Demo data generation complete!');
    } catch (error) {
        console.error('❌ Error generating demo data:', error);
    }
}

// Generate additional employees
async function generateAdditionalEmployees() {
    const additionalEmployees = [
        { id: 'U005', employee_id: 'M002', email: 'michael.scott@company.com', password: 'manager123', name: 'Michael Scott', role: 'manager', department: 'Sales & Marketing', designation: 'Sales Manager', company_code: 'COMP001', status: 'active', joining_date: '2022-03-15', mobile: '+91 9876543214', salary: { basic: 60000, hra: 24000, special: 16000 }, monthly_ctc: 100000 },
        { id: 'U006', employee_id: 'E002', email: 'priya.sharma@company.com', password: 'password123', name: 'Priya Sharma', role: 'employee', department: 'Engineering', designation: 'Software Developer', manager: 'Sarah Connor', company_code: 'COMP001', status: 'active', joining_date: '2023-06-01', mobile: '+91 9876543215', salary: { basic: 35000, hra: 14000, special: 11000 }, monthly_ctc: 60000 },
        { id: 'U007', employee_id: 'E003', email: 'amit.kumar@company.com', password: 'password123', name: 'Amit Kumar', role: 'employee', department: 'Engineering', designation: 'Junior Developer', manager: 'Sarah Connor', company_code: 'COMP001', status: 'active', joining_date: '2024-01-15', mobile: '+91 9876543216', salary: { basic: 25000, hra: 10000, special: 8000 }, monthly_ctc: 43000 },
        { id: 'U008', employee_id: 'E004', email: 'neha.patel@company.com', password: 'password123', name: 'Neha Patel', role: 'employee', department: 'Human Resources', designation: 'HR Executive', manager: 'Maria Garcia', company_code: 'COMP001', status: 'active', joining_date: '2023-09-01', mobile: '+91 9876543217', salary: { basic: 28000, hra: 11200, special: 8800 }, monthly_ctc: 48000 },
        { id: 'U009', employee_id: 'E005', email: 'rajesh.verma@company.com', password: 'password123', name: 'Rajesh Verma', role: 'employee', department: 'Sales & Marketing', designation: 'Sales Executive', manager: 'Michael Scott', company_code: 'COMP001', status: 'active', joining_date: '2023-04-10', mobile: '+91 9876543218', salary: { basic: 30000, hra: 12000, special: 10000 }, monthly_ctc: 52000 },
        { id: 'U010', employee_id: 'E006', email: 'anita.singh@company.com', password: 'password123', name: 'Anita Singh', role: 'employee', department: 'Sales & Marketing', designation: 'Senior Sales Executive', manager: 'Michael Scott', company_code: 'COMP001', status: 'active', joining_date: '2022-11-01', mobile: '+91 9876543219', salary: { basic: 38000, hra: 15200, special: 11800 }, monthly_ctc: 65000 },
        { id: 'U011', employee_id: 'E007', email: 'vikram.rao@company.com', password: 'password123', name: 'Vikram Rao', role: 'employee', department: 'Engineering', designation: 'QA Engineer', manager: 'Sarah Connor', company_code: 'COMP001', status: 'active', joining_date: '2023-03-20', mobile: '+91 9876543220', salary: { basic: 32000, hra: 12800, special: 10200 }, monthly_ctc: 55000 },
        { id: 'U012', employee_id: 'E008', email: 'kavitha.nair@company.com', password: 'password123', name: 'Kavitha Nair', role: 'employee', department: 'Engineering', designation: 'DevOps Engineer', manager: 'Sarah Connor', company_code: 'COMP001', status: 'active', joining_date: '2022-08-15', mobile: '+91 9876543221', salary: { basic: 42000, hra: 16800, special: 13200 }, monthly_ctc: 72000 },
        { id: 'U013', employee_id: 'E009', email: 'suresh.menon@company.com', password: 'password123', name: 'Suresh Menon', role: 'employee', department: 'Engineering', designation: 'Tech Lead', manager: 'Sarah Connor', company_code: 'COMP001', status: 'active', joining_date: '2021-12-01', mobile: '+91 9876543222', salary: { basic: 55000, hra: 22000, special: 18000 }, monthly_ctc: 95000 },
        { id: 'U014', employee_id: 'E010', email: 'deepa.reddy@company.com', password: 'password123', name: 'Deepa Reddy', role: 'employee', department: 'Human Resources', designation: 'Recruitment Specialist', manager: 'Maria Garcia', company_code: 'COMP001', status: 'active', joining_date: '2023-07-01', mobile: '+91 9876543223', salary: { basic: 30000, hra: 12000, special: 9000 }, monthly_ctc: 51000 }
    ];

    for (const emp of additionalEmployees) {
        const { error } = await supabase.from('users').upsert(emp, { onConflict: 'id' });
        if (error) console.warn(`User ${emp.id}:`, error.message);
    }
    console.log(`✓ Upserted ${additionalEmployees.length} additional employees`);
}

// Generate 30 days of attendance data
async function generateAttendanceData() {
    const { data: users } = await supabase.from('users').select('id, employee_id, name').eq('status', 'active');
    if (!users) return;

    const records = [];
    const today = new Date();

    for (const user of users) {
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            const dateStr = date.toISOString().split('T')[0];
            const rand = Math.random();
            let status, inTime, outTime, workingHours, isLate;

            if (rand < 0.85) {
                status = 'present';
                const checkInMin = 45 + Math.floor(Math.random() * 30);
                inTime = `09:${String(checkInMin).padStart(2, '0')}`;
                const checkOutHour = 17 + Math.floor(Math.random() * 2);
                const checkOutMin = 30 + Math.floor(Math.random() * 30);
                outTime = `${checkOutHour}:${String(checkOutMin).padStart(2, '0')}`;
                workingHours = ((checkOutHour * 60 + checkOutMin) - (9 * 60 + checkInMin)) / 60;
                isLate = checkInMin > 15;
            } else if (rand < 0.95) {
                status = 'present';
                isLate = true;
                const checkInHour = 10 + Math.floor(Math.random() * 1);
                const checkInMin = Math.floor(Math.random() * 30);
                inTime = `${checkInHour}:${String(checkInMin).padStart(2, '0')}`;
                const checkOutHour = 18 + Math.floor(Math.random() * 1);
                const checkOutMin = Math.floor(Math.random() * 60);
                outTime = `${checkOutHour}:${String(checkOutMin).padStart(2, '0')}`;
                workingHours = ((checkOutHour * 60 + checkOutMin) - (checkInHour * 60 + checkInMin)) / 60;
            } else {
                status = 'absent';
                inTime = null;
                outTime = null;
                workingHours = 0;
                isLate = false;
            }

            records.push({
                employee_id: user.id,
                employee_name: user.name,
                date: dateStr,
                in_time: inTime,
                out_time: outTime,
                break_logs: [],
                status,
                working_hours: Math.round(workingHours * 100) / 100,
                is_late: isLate,
                is_early_checkout: false,
                overtime_hours: Math.max(0, Math.round((workingHours - 8) * 100) / 100),
                source: 'generated',
                shift_id: 'GS',
                shift_name: 'General Shift'
            });
        }
    }

    // Upsert in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('attendance').upsert(batch, { onConflict: 'employee_id,date' });
        if (error) console.warn('Attendance batch error:', error.message);
    }
    console.log(`✓ Generated ${records.length} attendance records`);
}

// Generate Leave Data
async function generateLeaveData() {
    const { data: users } = await supabase.from('users').select('id, name');
    if (!users) return;
    const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unknown';

    const leaveRequests = [
        { id: 'LR0001', employee_id: 'U001', employee_name: getUserName('U001'), leave_type: 'CL', start_date: '2024-12-20', end_date: '2024-12-21', days: 2, is_half_day: false, status: 'approved', reason: 'Personal work', applied_on: new Date(Date.now() - 7 * 864e5).toISOString(), approved_by: 'Sarah Connor', approved_on: new Date().toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0002', employee_id: 'U006', employee_name: getUserName('U006'), leave_type: 'SL', start_date: '2024-12-18', end_date: '2024-12-18', days: 1, is_half_day: false, status: 'approved', reason: 'Not feeling well', applied_on: new Date(Date.now() - 5 * 864e5).toISOString(), approved_by: 'Sarah Connor', approved_on: new Date().toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0003', employee_id: 'U007', employee_name: getUserName('U007'), leave_type: 'PL', start_date: '2025-01-06', end_date: '2025-01-10', days: 5, is_half_day: false, status: 'pending', reason: 'Family vacation', applied_on: new Date(Date.now() - 2 * 864e5).toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0004', employee_id: 'U008', employee_name: getUserName('U008'), leave_type: 'CL', start_date: '2025-01-02', end_date: '2025-01-03', days: 2, is_half_day: false, status: 'pending', reason: 'Festival celebration', applied_on: new Date(Date.now() - 1 * 864e5).toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0005', employee_id: 'U009', employee_name: getUserName('U009'), leave_type: 'SL', start_date: '2024-12-15', end_date: '2024-12-16', days: 2, is_half_day: false, status: 'approved', reason: 'Medical checkup', applied_on: new Date(Date.now() - 10 * 864e5).toISOString(), approved_by: 'Sarah Connor', approved_on: new Date().toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0006', employee_id: 'U010', employee_name: getUserName('U010'), leave_type: 'CL', start_date: '2024-12-25', end_date: '2024-12-25', days: 1, is_half_day: false, status: 'rejected', reason: 'Short notice', applied_on: new Date(Date.now() - 3 * 864e5).toISOString(), approved_by: 'Maria Garcia', approved_on: new Date().toISOString(), rejection_reason: 'Critical project deadline', salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0007', employee_id: 'U011', employee_name: getUserName('U011'), leave_type: 'PL', start_date: '2025-01-15', end_date: '2025-01-20', days: 6, is_half_day: false, status: 'pending', reason: 'Hometown visit', applied_on: new Date(Date.now() - 1 * 864e5).toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } },
        { id: 'LR0008', employee_id: 'U012', employee_name: getUserName('U012'), leave_type: 'CL', start_date: '2024-12-28', end_date: '2024-12-28', days: 1, is_half_day: false, status: 'approved', reason: 'Personal errand', applied_on: new Date(Date.now() - 4 * 864e5).toISOString(), approved_by: 'Sarah Connor', approved_on: new Date().toISOString(), salary_impact: { unpaidDays: 0, deduction: 0 } }
    ];

    for (const lr of leaveRequests) {
        const { error } = await supabase.from('leave_requests').upsert(lr, { onConflict: 'id' });
        if (error) console.warn(`Leave request ${lr.id}:`, error.message);
    }
    console.log(`✓ Generated ${leaveRequests.length} leave requests`);
}

// Generate Payroll Data
async function generatePayrollData() {
    const { data: users } = await supabase.from('users').select('*');
    if (!users) return;

    const payslips = [];

    const months2025 = [
        { num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }, { num: 5 },
        { num: 6 }, { num: 7 }, { num: 8 }, { num: 9 }
    ];

    for (const user of users) {
        const salary = user.salary || { basic: 25000, hra: 10000, special: 8000 };
        const grossPay = (salary.basic || 25000) + (salary.hra || 10000) + (salary.special || 8000);
        const epf = Math.round((salary.basic || 25000) * 0.12);
        const pt = 200;
        const tds = grossPay > 50000 ? Math.round(grossPay * 0.05) : 0;
        const totalDeductions = epf + pt + tds;
        const netPay = grossPay - totalDeductions;

        for (const m of months2025) {
            payslips.push({
                id: `PAY${user.id}_${m.num}_2025`,
                employee_id: user.id,
                employee_name: user.name,
                employee_code: user.employee_id,
                month: m.num,
                year: 2025,
                designation: user.designation,
                department: user.department,
                attendance: { workingDays: 26, presentDays: 24, absentDays: 2, paidLeaveDays: 1, unpaidLeaveDays: 1 },
                earnings: { basic: salary.basic || 25000, hra: salary.hra || 10000, specialAllowance: salary.special || 8000 },
                gross_earnings: grossPay,
                deductions: { pf: epf, professionalTax: pt, tds },
                total_deductions: totalDeductions,
                net_salary: netPay,
                status: 'paid',
                processed_on: `2025-${String(m.num).padStart(2, '0')}-25T00:00:00Z`,
                paid_on: `2025-${String(m.num).padStart(2, '0')}-28T00:00:00Z`
            });
        }
    }

    // Upsert in batches
    const batchSize = 50;
    for (let i = 0; i < payslips.length; i += batchSize) {
        const batch = payslips.slice(i, i + batchSize);
        const { error } = await supabase.from('payslips').upsert(batch, { onConflict: 'id' });
        if (error) console.warn('Payslip batch error:', error.message);
    }
    console.log(`✓ Generated ${payslips.length} payslips`);
}

// Generate Performance Data
async function generatePerformanceData() {
    const { data: users } = await supabase.from('users').select('id, employee_id, name').eq('role', 'employee');
    if (!users) return;

    const goalTemplates = [
        { title: 'Complete Project Milestone', category: 'Professional', weight: 30 },
        { title: 'Improve Code Quality', category: 'Professional', weight: 20 },
        { title: 'Team Collaboration', category: 'Professional', weight: 15 },
        { title: 'Technical Skills Development', category: 'Learning', weight: 20 },
        { title: 'Client Satisfaction', category: 'Professional', weight: 15 }
    ];

    const goals = [];
    users.forEach(user => {
        goalTemplates.forEach((template, index) => {
            const progress = Math.floor(Math.random() * 100);
            goals.push({
                id: `GOAL${user.id}_${index}`,
                employee_id: user.id,
                title: template.title,
                description: `Goal for ${template.title.toLowerCase()} in Q4 2024`,
                category: template.category,
                target_date: '2024-12-31',
                weight: template.weight,
                progress,
                status: progress < 30 ? 'pending' : progress < 100 ? 'in_progress' : 'completed'
            });
        });
    });

    // Upsert goals
    const batchSize = 50;
    for (let i = 0; i < goals.length; i += batchSize) {
        const batch = goals.slice(i, i + batchSize);
        const { error } = await supabase.from('goals').upsert(batch, { onConflict: 'id' });
        if (error) console.warn('Goals batch error:', error.message);
    }
    console.log(`✓ Generated ${goals.length} goals`);
}

// Generate Exit Data
async function generateExitData() {
    const exits = [
        {
            id: 'EXIT001', employee_id: 'U007', employee_name: 'Amit Kumar',
            resignation_date: '2024-12-15T10:00:00Z', requested_lwd: '2025-01-15',
            reason: 'Resignation - Better Opportunity', personal_email: 'amit.kumar@gmail.com',
            status: 'pending_approval',
            clearance: {
                it: { department: 'IT', items: [{ name: 'Laptop/Assets Returned', cleared: false }, { name: 'Email Access Revoked', cleared: false }], completed: false },
                admin: { department: 'Admin', items: [{ name: 'ID Card Returned', cleared: false }], completed: false },
                finance: { department: 'Finance', items: [{ name: 'No Pending Loans', cleared: false }], completed: false }
            },
            comments: 'Looking forward to new opportunities'
        }
    ];

    for (const exit of exits) {
        const { error } = await supabase.from('employee_exits').upsert(exit, { onConflict: 'id' });
        if (error) console.warn(`Exit ${exit.id}:`, error.message);
    }
    console.log(`✓ Generated ${exits.length} exit records`);
}

// Check if demo data already exists
export async function isDemoDataGenerated() {
    const state = await db.getState('demoDataGenerated');
    return state === true;
}

// Force regenerate demo data
export async function regenerateDemoData() {
    await db.setState('demoDataGenerated', null);
    await generateDemoData();
}
