import { employeeService } from '../core/employee.js';
import { authService } from '../core/auth.js';

export function renderEmployeeDetail(employeeId) {
  const container = document.createElement('div');
  container.id = 'employee-detail-container';

  const loadContent = async () => {
    const employee = await employeeService.getEmployee(employeeId);
    const currentUser = authService.getCurrentUser();
    const isHROrAdmin = currentUser && (currentUser.role === 'hr_admin' || currentUser.role === 'super_admin');
    const isSelf = currentUser && currentUser.userId === employeeId;

    if (!employee) {
      container.innerHTML = renderNotFound().innerHTML;
      return;
    }

    container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">${employee.name}</h1>
        <p class="page-subtitle">${employee.employeeId} | ${employee.designation || 'Not assigned'}</p>
      </div>
      <div class="flex gap-2">
        ${isHROrAdmin && employee.status === 'draft' ? `
          <button class="btn btn-primary" id="activate-btn">Activate Employee</button>
        ` : ''}
        ${isHROrAdmin ? `
          <button class="btn btn-secondary" id="edit-btn">Edit</button>
        ` : ''}
        <button class="btn btn-secondary" onclick="history.back()">Back</button>
      </div>
    </div>

    <!-- Status Alert -->
    ${employee.status !== 'active' ? `
      <div class="alert ${employee.status === 'draft' ? 'alert-warning' : 'alert-danger'} mb-4">
        ${employee.status === 'draft' ? '⚠️ Employee is in DRAFT status. Assign salary and leave policy to activate.' : ''}
        ${employee.status === 'exited' ? '❌ Employee has exited the organization.' : ''}
        ${employee.status === 'notice_period' ? '⏳ Employee is serving notice period.' : ''}
      </div>
    ` : ''}

    <div class="grid grid-3 mb-6">
      <!-- Personal Information -->
      <div class="card">
        <h3 class="mb-4">Personal Information</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${renderField('Email', employee.email)}
          ${renderField('Mobile', employee.mobile || 'Not provided')}
          ${renderField('Date of Birth', employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN') : 'Not provided')}
          ${renderField('Blood Group', employee.bloodGroup || 'Not provided')}
          ${renderField('Address', employee.address || 'Not provided')}
        </div>
      </div>

      <!-- Employment Details -->
      <div class="card">
        <h3 class="mb-4">Employment Details</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${renderField('Department', employee.department || 'Not assigned')}
          ${renderField('Designation', employee.designation || 'Not assigned')}
          ${renderField('Role', formatRole(employee.role))}
          ${renderField('Reporting Manager', employee.manager || 'Not assigned')}
          ${renderField('Joining Date', employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-IN') : '-')}
          ${renderField('Status', getStatusBadge(employee.status), true)}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h3 class="mb-4">Quick Actions</h3>
        ${isHROrAdmin ? `
          <div class="flex flex-col gap-2">
            <button class="btn btn-secondary w-full" id="assign-salary-btn" ${employee.salaryStructure ? 'disabled' : ''}>
              ${employee.salaryStructure ? '✓ Salary Assigned' : 'Assign Salary Structure'}
            </button>
            <button class="btn btn-secondary w-full" id="assign-leave-btn" ${employee.leavePolicy ? 'disabled' : ''}>
              ${employee.leavePolicy ? '✓ Leave Policy Assigned' : 'Assign Leave Policy'}
            </button>
            ${employee.status === 'active' ? `
              <button class="btn btn-secondary w-full" id="change-status-btn">Change Status</button>
            ` : ''}
            <button class="btn btn-secondary w-full" onclick="window.print()">Print Profile</button>
          </div>
        ` : `
          <p class="text-muted text-sm">Contact HR for any changes to your profile.</p>
        `}
        
        ${!employee.passwordSetup && isSelf ? `
          <div class="alert alert-warning mt-4">
            <strong>First Time Login</strong><br/>
            Your temporary password: <code>${employee.tempPassword || 'Contact HR'}</code><br/>
            Please change it after first login.
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Salary Structure -->
    ${employee.salaryStructure ? `
      <div class="card mb-6">
        <h3 class="mb-4">Salary Structure (Monthly)</h3>
        <div class="grid grid-2">
          <div>
            <h4 class="mb-3" style="color: var(--success);">💰 Earnings</h4>
            ${renderSalaryItem('Basic Salary', employee.salaryStructure.basic)}
            ${renderSalaryItem('HRA', employee.salaryStructure.hra)}
            ${renderSalaryItem('Conveyance', employee.salaryStructure.conveyance)}
            ${renderSalaryItem('Special Allowance', employee.salaryStructure.specialAllowance)}
            <div class="mt-3 pt-3" style="border-top: 2px solid var(--border);">
              ${renderSalaryItem('Gross Salary', employee.salaryStructure.gross, true)}
            </div>
          </div>
          <div>
            <h4 class="mb-3" style="color: var(--danger);">➖ Deductions</h4>
            ${renderSalaryItem('PF (12%)', employee.salaryStructure.pf)}
            ${renderSalaryItem('ESI', employee.salaryStructure.esi)}
            ${renderSalaryItem('Professional Tax', employee.salaryStructure.pt)}
            ${renderSalaryItem('TDS', employee.salaryStructure.tds)}
            <div class="mt-3 pt-3" style="border-top: 2px solid var(--border);">
              ${renderSalaryItem('Net Salary', employee.salaryStructure.netSalary, true, 'primary')}
            </div>
          </div>
        </div>
      </div>
    ` : `
      <div class="card mb-6 text-center p-8">
        <p class="text-muted">Salary structure not assigned yet</p>
        ${isHROrAdmin ? '<button class="btn btn-primary mt-4" id="assign-salary-btn-2">Assign Now</button>' : ''}
      </div>
    `}

    <!-- Leave Balance -->
    ${employee.leavePolicy ? `
      <div class="card">
        <h3 class="mb-4">Leave Balance</h3>
        <div class="grid grid-3">
          ${renderLeaveCard('Casual Leave (CL)', employee.leavePolicy.cl)}
          ${renderLeaveCard('Privilege Leave (PL)', employee.leavePolicy.pl)}
          ${renderLeaveCard('Sick Leave (SL)', employee.leavePolicy.sl)}
        </div>
        <p class="text-muted text-sm mt-4">
          ${employee.leavePolicy.carryForward ? `✓ Carry Forward: Up to ${employee.leavePolicy.maxCarryForward} days` : '❌ No carry forward allowed'}
        </p>
      </div>
    ` : `
      <div class="card text-center p-8">
        <p class="text-muted">Leave policy not assigned yet</p>
        ${isHROrAdmin ? '<button class="btn btn-primary mt-4" id="assign-leave-btn-2">Assign Now</button>' : ''}
      </div>
    `}
  `;

    // Event handlers for HR actions
    if (isHROrAdmin) {
      setupHRActions(container, employee);
    }
  };

  loadContent();

  window.addEventListener('employee-updated', () => {
    if (document.body.contains(container)) {
      loadContent();
    }
  });

  return container;
}

function renderField(label, value, isHTML = false) {
  return `
    <div>
      <div class="text-xs text-muted mb-1">${label}</div>
      <div class="font-medium">${isHTML ? value : escapeHtml(value)}</div>
    </div>
  `;
}

function renderSalaryItem(label, amount, isBold = false, color = null) {
  return `
    <div class="flex justify-between items-center mb-2">
      <span class="text-sm ${isBold ? 'font-bold' : ''}">${label}</span>
      <span class="font-medium ${isBold ? 'font-bold text-lg' : ''}" style="${color ? `color: var(--${color})` : ''}">₹${amount.toLocaleString()}</span>
    </div>
  `;
}

function renderLeaveCard(title, leave) {
  const percentage = (leave.remaining / leave.total) * 100;
  return `
    <div>
      <div class="flex justify-between mb-2">
        <span class="font-medium">${title}</span>
        <span class="font-bold">${leave.remaining} / ${leave.total}</span>
      </div>
      <div class="progress">
        <div class="progress-bar" style="width: ${percentage}%; background: var(--${percentage > 50 ? 'success' : percentage > 20 ? 'warning' : 'danger'});"></div>
      </div>
      <div class="text-xs text-muted mt-1">Used: ${leave.used} days</div>
    </div>
  `;
}

function getStatusBadge(status) {
  const badges = {
    draft: '<span class="badge badge-warning">Draft</span>',
    active: '<span class="badge badge-success">Active</span>',
    notice_period: '<span class="badge badge-warning">Notice Period</span>',
    exited: '<span class="badge badge-danger">Exited</span>'
  };
  return badges[status] || status;
}

function formatRole(role) {
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function setupHRActions(container, employee) {
  // Assign salary button
  const assignSalaryBtns = container.querySelectorAll('#assign-salary-btn, #assign-salary-btn-2');
  assignSalaryBtns.forEach(btn => {
    btn?.addEventListener('click', () => showAssignSalaryModal(employee));
  });

  // Assign leave button
  const assignLeaveBtns = container.querySelectorAll('#assign-leave-btn, #assign-leave-btn-2');
  assignLeaveBtns.forEach(btn => {
    btn?.addEventListener('click', () => showAssignLeaveModal(employee));
  });

  // Activate button
  const activateBtn = container.querySelector('#activate-btn');
  activateBtn?.addEventListener('click', async () => {
    if (!employee.salaryStructure || !employee.leavePolicy) {
      alert('Please assign salary structure and leave policy before activating.');
      return;
    }

    if (confirm(`Activate ${employee.name}?\n\nThis will:\n- Set status to Active\n- Enable system access\n- Start leave accrual`)) {
      try {
        await employeeService.updateStatus(employee.id, 'active', new Date().toISOString().split('T')[0], 'Activated by HR');
        alert('Employee activated successfully!');
        window.dispatchEvent(new Event('employee-updated'));
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  });
}

async function showAssignSalaryModal(employee) {
  const templates = await employeeService.getSalaryTemplates();
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000; display: flex; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div class="card" style="max-width: 500px; width: 100%;">
      <h3 class="mb-4">Assign Salary Structure</h3>
      <form id="salary-form">
        <div class="form-group">
          <label>Monthly CTC (Gross Salary)</label>
          <input type="number" id="ctc-input" value="${employee.monthlyCTC || 35000}" required />
        </div>
        
        <div class="form-group">
          <label>Salary Template</label>
          <select id="template-select" required>
            ${templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>
        
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Assign</button>
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#salary-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ctc = parseInt(modal.querySelector('#ctc-input').value);
    const templateId = modal.querySelector('#template-select').value;

    await employeeService.assignSalaryStructure(employee.id, ctc, templateId);
    document.body.removeChild(modal);
    alert('Salary structure assigned successfully!');
    window.dispatchEvent(new Event('employee-updated'));
  });

  modal.querySelector('#cancel-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

async function showAssignLeaveModal(employee) {
  const templates = await employeeService.getLeaveTemplates();
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000; display: flex; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div class="card" style="max-width: 500px; width: 100%;">
      <h3 class="mb-4">Assign Leave Policy</h3>
      <form id="leave-form">
        <div class="form-group">
          <label>Leave Policy Template</label>
          <select id="template-select" required>
            ${templates.map(t => `
              <option value="${t.id}">
                ${t.name} (CL: ${t.cl}, PL: ${t.pl}, SL: ${t.sl})
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Assign</button>
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#leave-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const templateId = modal.querySelector('#template-select').value;

    await employeeService.assignLeavePolicy(employee.id, templateId);
    document.body.removeChild(modal);
    alert('Leave policy assigned successfully!');
    window.dispatchEvent(new Event('employee-updated'));
  });

  modal.querySelector('#cancel-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

function renderNotFound() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="card text-center p-8">
      <h3 class="mb-2">Employee Not Found</h3>
      <p class="text-muted mb-4">The requested employee record could not be found.</p>
      <button class="btn btn-primary" onclick="history.back()">Go Back</button>
    </div>
  `;
  return container;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
