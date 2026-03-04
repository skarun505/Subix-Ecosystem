import { payrollService } from '../core/payroll.js';
import { employeeService } from '../core/employee.js';
import { authService } from '../core/auth.js';

export function renderPayrollDashboard() {
  const container = document.createElement('div');
  container.id = 'payroll-dashboard-container';

  const loadContent = async () => {
    const currentUser = authService.getCurrentUser();
    const isHROrAdmin = currentUser && (currentUser.role === 'hr_admin' || currentUser.role === 'super_admin');
    const isEmployee = currentUser && currentUser.role === 'employee';

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Payroll Management</h1>
      <p class="page-subtitle">Transparent salary processing and payslip generation</p>
    </div>

    ${isHROrAdmin ? await renderHRView(currentMonth, currentYear) : ''}
    ${isEmployee ? await renderEmployeeView(currentUser.userId, currentMonth, currentYear) : ''}
  `;

    // Add event listeners
    if (isHROrAdmin) {
      setupHRListeners(container);
    }
  };

  loadContent();

  window.addEventListener('payroll-updated', () => {
    if (document.body.contains(container)) {
      loadContent();
    }
  });

  return container;
}

async function renderHRView(month, year) {
  const summary = await payrollService.getPayrollSummary(month, year);

  return `
    <!-- Process Payroll Section -->
    <div class="card mb-6">
      <h3 class="mb-4">Process Monthly Payroll</h3>
      <div class="grid grid-3 mb-4">
        <div class="form-group">
          <label>Month</label>
          <select id="payroll-month">
            ${getMonthOptions(month)}
          </select>
        </div>
        <div class="form-group">
          <label>Year</label>
          <select id="payroll-year">
            <option value="2024">2024</option>
            <option value="2025" selected>2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button class="btn btn-primary w-full" id="process-payroll-btn">Process Payroll</button>
        </div>
      </div>

      <div class="alert alert-success text-sm">
        ✓ <strong>Automatic Calculations:</strong> System will auto-calculate salaries based on attendance, leaves, and overtime for all active employees.
      </div>
    </div>

    <!-- Payroll Summary -->
    <div class="card mb-6">
      <h3 class="mb-4">Payroll Summary - ${getMonthName(month)} ${year}</h3>
      <div class="grid grid-4">
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value">${summary.totalEmployees}</div>
          <div class="stat-label">Total Employees</div>
        </div>
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value">₹${(summary.totalGross / 100000).toFixed(1)}L</div>
          <div class="stat-label">Gross Payroll</div>
        </div>
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value">₹${(summary.totalDeductions / 100000).toFixed(1)}L</div>
          <div class="stat-label">Total Deductions</div>
        </div>
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value">₹${(summary.totalNet / 100000).toFixed(1)}L</div>
          <div class="stat-label">Net Payroll</div>
        </div>
      </div>

      <div class="grid grid-3 mt-4 text-sm">
        <div>
          <div class="text-muted">Status Breakdown:</div>
          <div class="mt-1">
            <span class="badge badge-warning">Draft: ${summary.byStatus.draft}</span>
            <span class="badge badge-primary ml-2">Approved: ${summary.byStatus.approved}</span>
            <span class="badge badge-success ml-2">Paid: ${summary.byStatus.paid}</span>
          </div>
        </div>
        <div>
          <div class="text-muted">Overtime Paid:</div>
          <div class="font-medium">₹${summary.totalOvertimePaid.toLocaleString()}</div>
        </div>
        <div>
          <div class="text-muted">Absence Deductions:</div>
          <div class="font-medium">₹${summary.totalAbsenceDeduction.toLocaleString()}</div>
        </div>
      </div>
    </div>

    <!-- Payslips List -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h3>Payslips</h3>
        <div class="flex gap-2">
          <select id="status-filter" class="btn btn-secondary">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
      
      <div id="payslips-list"></div>
    </div>
  `;
}

async function renderEmployeeView(employeeId, month, year) {
  const payslips = await payrollService.getPayslips({ employeeId });
  const currentPayslip = payslips.find(p => p.month === month && p.year === year);

  return `
    <div class="grid grid-2 mb-6">
      <div class="form-group">
        <label>Select Month</label>
        <select id="emp-month-filter">
          ${getMonthOptions(month)}
        </select>
      </div>
      <div class="form-group">
        <label>Select Year</label>
        <select id="emp-year-filter">
          <option value="2024">2024</option>
          <option value="2025" selected>2025</option>
        </select>
      </div>
    </div>

    ${currentPayslip ? renderPayslipDetail(currentPayslip) : `
      <div class="card text-center p-8">
        <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
        <h3 class="mb-2">No Payslip Found</h3>
        <p class="text-muted">Payslip for ${getMonthName(month)} ${year} has not been processed yet.</p>
      </div>
    `}
  `;
}

function renderPayslipDetail(payslip) {
  return `
    <div class="card mb-4">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h2 class="mb-2">Payslip - ${getMonthName(payslip.month)} ${payslip.year}</h2>
          <div class="text-sm text-muted">
            Employee: ${payslip.employeeName} (${payslip.employeeCode})<br/>
            Department: ${payslip.department} | Designation: ${payslip.designation}
          </div>
        </div>
        <div class="flex gap-2">
          ${getStatusBadge(payslip.status)}
          <button class="btn btn-primary" onclick="window.printPayslip('${payslip.id}')">🖨️ Print Payslip</button>
        </div>
      </div>

      <!-- Attendance Summary -->
      <div class="mb-6">
        <h4 class="mb-3">📊 Attendance Summary</h4>
        <div class="grid grid-4 text-sm">
          <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
            <div class="text-muted">Working Days</div>
            <div class="font-bold text-lg">${payslip.attendance.workingDays}</div>
          </div>
          <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
            <div class="text-muted">Present</div>
            <div class="font-bold text-lg" style="color: var(--success);">${payslip.attendance.presentDays}</div>
          </div>
          <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
            <div class="text-muted">Paid Leaves</div>
            <div class="font-bold text-lg" style="color: var(--primary);">${payslip.attendance.paidLeaveDays}</div>
          </div>
          <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
            <div class="text-muted">Absent/Unpaid</div>
            <div class="font-bold text-lg" style="color: var(--danger);">${payslip.attendance.absentDays + payslip.attendance.unpaidLeaveDays}</div>
          </div>
        </div>
        <div class="mt-3 text-sm">
          <strong>Effective Working Days:</strong> ${payslip.attendance.effectiveWorkingDays} days | 
          <strong>Overtime:</strong> ${payslip.attendance.overtimeHours} hours | 
          <strong>Late Marks:</strong> ${payslip.attendance.lateMarks}
        </div>
      </div>

      <!-- Salary Breakdown -->
      <div class="grid grid-2 gap-6">
        <!-- Earnings -->
        <div>
          <h4 class="mb-3 flex items-center gap-2">
            <span style="color: var(--success);">💰 Earnings</span>
          </h4>
          <table class="w-full text-sm">
            <tbody>
              <tr>
                <td class="py-2">Basic Salary</td>
                <td class="text-right font-medium">₹${payslip.earnings.basic.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="py-2">House Rent Allowance (HRA)</td>
                <td class="text-right font-medium">₹${payslip.earnings.hra.toLocaleString()}</td>
              </tr>
              ${payslip.earnings.conveyance ? `
              <tr>
                <td class="py-2">Conveyance</td>
                <td class="text-right font-medium">₹${payslip.earnings.conveyance.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.earnings.medicalAllowance ? `
              <tr>
                <td class="py-2">Medical Allowance</td>
                <td class="text-right font-medium">₹${payslip.earnings.medicalAllowance.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.earnings.specialAllowance ? `
              <tr>
                <td class="py-2">Special Allowance</td>
                <td class="text-right font-medium">₹${payslip.earnings.specialAllowance.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.earnings.overtime > 0 ? `
              <tr style="background: rgba(16, 185, 129, 0.1);">
                <td class="py-2"><strong>Overtime (${payslip.attendance.overtimeHours}h)</strong></td>
                <td class="text-right font-bold" style="color: var(--success);">₹${payslip.earnings.overtime.toLocaleString()}</td>
              </tr>` : ''}
              <tr class="border-t" style="border-color: var(--border);">
                <td class="py-2"><strong>Gross Earnings</strong></td>
                <td class="text-right font-bold text-lg">₹${payslip.grossEarnings.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Deductions -->
        <div>
          <h4 class="mb-3 flex items-center gap-2">
            <span style="color: var(--danger);">➖ Deductions</span>
          </h4>
          <table class="w-full text-sm">
            <tbody>
              <tr>
                <td class="py-2">Provident Fund (PF)</td>
                <td class="text-right font-medium">₹${payslip.deductions.pf.toLocaleString()}</td>
              </tr>
              ${payslip.deductions.esi > 0 ? `
              <tr>
                <td class="py-2">ESI</td>
                <td class="text-right font-medium">₹${payslip.deductions.esi.toLocaleString()}</td>
              </tr>` : ''}
              <tr>
                <td class="py-2">Professional Tax</td>
                <td class="text-right font-medium">₹${payslip.deductions.professionalTax.toLocaleString()}</td>
              </tr>
              ${payslip.deductions.absence > 0 ? `
              <tr style="background: rgba(239, 68, 68, 0.1);">
                <td class="py-2"><strong>Absence Deduction</strong></td>
                <td class="text-right font-bold" style="color: var(--danger);">₹${payslip.deductions.absence.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.deductions.lateMark > 0 ? `
              <tr>
                <td class="py-2">Late Mark Penalty</td>
                <td class="text-right font-medium">₹${payslip.deductions.lateMark.toLocaleString()}</td>
              </tr>` : ''}
              <tr class="border-t" style="border-color: var(--border);">
                <td class="py-2"><strong>Total Deductions</strong></td>
                <td class="text-right font-bold text-lg">₹${payslip.totalDeductions.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Net Salary -->
      <div class="mt-6 p-4" style="background: var(--surface); border: 1px solid var(--primary-lime); border-radius: 8px; color: var(--text-main); box-shadow: 0 0 15px rgba(204, 255, 0, 0.1);">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-sm opacity-90">Net Salary (Take Home)</div>
            <div class="text-3xl font-bold">₹${payslip.netSalary.toLocaleString()}</div>
          </div>
          <div class="text-right text-sm opacity-90">
            ${payslip.status === 'paid' ? `Paid on: ${new Date(payslip.paidOn).toLocaleDateString()}` :
      payslip.status === 'approved' ? `Approved on: ${new Date(payslip.approvedOn).toLocaleDateString()}` :
        'Pending Processing'}
          </div>
        </div>
      </div>

      <div class="mt-4 text-xs text-muted text-center">
        Processed on: ${new Date(payslip.processedOn).toLocaleString()} | 
        This is a system-generated payslip with complete transparency.
      </div>
    </div>
  `;
}

function setupHRListeners(container) {
  // Process payroll button
  const processBtn = container.querySelector('#process-payroll-btn');
  if (processBtn) {
    processBtn.addEventListener('click', async () => {
      const month = parseInt(container.querySelector('#payroll-month').value);
      const year = parseInt(container.querySelector('#payroll-year').value);

      if (confirm(`Process payroll for ${getMonthName(month)} ${year}? This will calculate salaries for all active employees.`)) {
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';

        try {
          const results = await payrollService.processMonthlyPayroll(month, year);
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;

          alert(`Payroll processed!\n\nSuccessful: ${successful}\nFailed: ${failed}`);
          window.dispatchEvent(new Event('payroll-updated'));
        } catch (error) {
          alert('Error processing payroll: ' + error.message);
        } finally {
          processBtn.disabled = false;
          processBtn.textContent = 'Process Payroll';
        }
      }
    });
  }

  // Load payslips list
  loadPayslipsList(container);
}

async function loadPayslipsList(container) {
  const listContainer = container.querySelector('#payslips-list');
  if (!listContainer) return;

  const month = parseInt(container.querySelector('#payroll-month').value);
  const year = parseInt(container.querySelector('#payroll-year').value);
  const statusFilter = container.querySelector('#status-filter')?.value || '';

  const filters = { month, year };
  if (statusFilter) filters.status = statusFilter;

  const payslips = await payrollService.getPayslips(filters);

  if (payslips.length === 0) {
    listContainer.innerHTML = '<p class="text-muted text-center p-8">No payslips found. Click "Process Payroll" to generate.</p>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Employee</th>
        <th>Designation</th>
        <th>Days Worked</th>
        <th>Gross</th>
        <th>Deductions</th>
        <th>Net Salary</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${payslips.map(p => `
        <tr>
          <td>
            <div class="font-medium">${p.employeeName}</div>
            <div class="text-xs text-muted">${p.employeeCode}</div>
          </td>
          <td class="text-sm">${p.designation}</td>
          <td class="font-medium">${p.attendance.effectiveWorkingDays}</td>
          <td class="font-medium">₹${p.grossEarnings.toLocaleString()}</td>
          <td class="font-medium" style="color: var(--danger);">₹${p.totalDeductions.toLocaleString()}</td>
          <td class="font-bold">₹${p.netSalary.toLocaleString()}</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>
            <div class="flex gap-2">
              ${p.status === 'draft' ? `<button class="btn btn-sm btn-primary" onclick="window.approvePayslip('${p.id}')">Approve</button>` : ''}
              ${p.status === 'approved' ? `<button class="btn btn-sm btn-success" onclick="window.markAsPaid('${p.id}')">Mark Paid</button>` : ''}
              <button class="btn btn-sm btn-secondary" onclick="window.viewPayslip('${p.id}')">View</button>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  listContainer.innerHTML = '';
  listContainer.appendChild(table);

  // Status filter listener
  const statusFilterEl = container.querySelector('#status-filter');
  if (statusFilterEl) {
    statusFilterEl.addEventListener('change', () => loadPayslipsList(container));
  }
}

function getStatusBadge(status) {
  const badges = {
    draft: '<span class="badge badge-warning">Draft</span>',
    approved: '<span class="badge badge-primary">Approved</span>',
    paid: '<span class="badge badge-success">Paid</span>'
  };
  return badges[status] || status;
}

function getMonthOptions(selected) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.map((m, i) =>
    `<option value="${i + 1}" ${i + 1 === selected ? 'selected' : ''}>${m}</option>`
  ).join('');
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

// Global action handlers
window.approvePayslip = async (id) => {
  if (confirm('Approve this payslip?')) {
    const currentUser = authService.getCurrentUser();
    const result = await payrollService.approvePayslip(id, currentUser.userId);
    if (result.success) {
      alert('Payslip approved!');
      window.dispatchEvent(new Event('payroll-updated'));
    }
  }
};

window.markAsPaid = async (id) => {
  if (confirm('Mark this payslip as paid?')) {
    const result = await payrollService.markAsPaid(id);
    if (result.success) {
      alert('Payslip marked as paid!');
      window.dispatchEvent(new Event('payroll-updated'));
    }
  }
};

window.viewPayslip = (id) => {
  window.printPayslip(id);
};

window.printPayslip = (id) => {
  // Navigate to payslip document view
  window.location.hash = `payslip/${id}`;
};
