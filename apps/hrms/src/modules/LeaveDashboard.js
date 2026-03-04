import { leaveService } from '../core/leave.js';
import { employeeService } from '../core/employee.js';
import { authService } from '../core/auth.js';

export function renderLeaveDashboard() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();
  const isEmployee = currentUser && currentUser.role === 'employee';
  const isManager = currentUser && currentUser.role === 'manager';
  const isHROrAdmin = currentUser && (currentUser.role === 'hr_admin' || currentUser.role === 'super_admin');

  const employeeId = isEmployee ? currentUser.userId : null;

  container.id = 'leave-dashboard-container';
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Leave Management</h1>
      <p class="page-subtitle">Apply for leaves and track your balance with complete transparency</p>
    </div>

    <div id="leave-balance-section">
      <div class="text-muted text-center py-4">Loading leave balance...</div>
    </div>

    ${isEmployee ? `
      <div class="card mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3>Apply for Leave</h3>
          <button class="btn btn-primary" id="apply-leave-btn">+ New Leave Request</button>
        </div>
        
        <div class="alert alert-success">
          <strong>✓ Complete Transparency</strong><br/>
          You'll see exact leave deduction and any salary impact before applying
        </div>
      </div>
    ` : ''}

    ${isManager || isHROrAdmin ? `
      <div class="card mb-6">
        <h3 class="mb-4">Pending Approvals</h3>
        <div id="pending-approvals"></div>
      </div>
    ` : ''}

    <!-- Leave History -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h3>Leave History</h3>
        ${isHROrAdmin ? `
          <div class="flex gap-2">
            <select id="employee-filter" class="btn btn-secondary">
              <option value="">All Employees</option>
              <!-- Loaded dynamically -->
            </select>
            <select id="status-filter" class="btn btn-secondary">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        ` : ''}
      </div>
      
      <div id="leave-history"></div>
    </div>
  `;

  // Function to refresh all data
  const refreshData = async () => {
    if (isManager || isHROrAdmin) {
      await loadPendingApprovals(container, currentUser.userId);
    }

    const filters = {
      employeeId: isEmployee ? currentUser.userId : null,
      ...(isHROrAdmin ? {
        employeeId: container.querySelector('#employee-filter')?.value || null,
        status: container.querySelector('#status-filter')?.value || null
      } : {})
    };
    await loadLeaveHistory(container, filters);

    // Refresh balance if employee
    if (isEmployee) {
      const newBalance = await leaveService.getLeaveBalance(currentUser.userId);
      const balanceContainer = container.querySelector('#leave-balance-section');
      if (newBalance && balanceContainer) {
        balanceContainer.innerHTML = renderLeaveBalance(newBalance);
      }
    }
  };

  // Initial Load
  refreshData();

  // Listen for updates
  const updateHandler = () => {
    if (document.body.contains(container)) {
      refreshData();
    }
  };
  window.addEventListener('leave-updated', updateHandler);

  // Apply leave button
  const applyBtn = container.querySelector('#apply-leave-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => showApplyLeaveModal(currentUser.userId));
  }

  // Filters for HR/Admin
  if (isHROrAdmin) {
    loadEmployeeFilterOptions(container);
    const empFilter = container.querySelector('#employee-filter');
    const statusFilter = container.querySelector('#status-filter');

    [empFilter, statusFilter].forEach(filter => {
      filter?.addEventListener('change', refreshData);
    });
  }

  return container;
}

function renderLeaveBalance(balance) {
  const leaveTypes = ['cl', 'pl', 'sl'];
  const labels = { cl: 'Casual Leave (CL)', pl: 'Privilege Leave (PL)', sl: 'Sick Leave (SL)' };

  return `
    <div class="card mb-6">
      <h3 class="mb-4">📊 Your Leave Balance (Complete Transparency)</h3>
      
      <div class="grid grid-3 mb-4">
        ${leaveTypes.map(type => {
    const leave = balance[type];
    if (!leave) return '';

    const percentage = (leave.remaining / leave.total) * 100;
    const color = percentage > 50 ? 'success' : percentage > 20 ? 'warning' : 'danger';

    return `
            <div class="card" style="background: var(--bg-secondary);">
              <div class="flex justify-between mb-2">
                <span class="font-semibold">${labels[type]}</span>
                <span class="font-bold text-lg">${leave.remaining} / ${leave.total}</span>
              </div>
              
              <div class="progress mb-2">
                <div class="progress-bar" style="width: ${percentage}%; background: var(--${color});"></div>
              </div>
              
              <div class="grid grid-2 text-xs text-muted gap-2">
                <div>
                  <div>Total: ${leave.total} days</div>
                  <div style="color: var(--success);">Available: ${leave.remaining} days</div>
                </div>
                <div>
                  <div style="color: var(--danger);">Used: ${leave.used} days</div>
                  <div>Balance: ${leave.remaining} days</div>
                </div>
              </div>
            </div>
          `;
  }).join('')}
      </div>

      ${balance.carryForward ? `
        <div class="alert" style="background: rgba(204, 255, 0, 0.1); color: var(--primary-lime); border: 1px solid var(--primary-lime);">
          <strong>✓ Carry Forward Allowed</strong><br/>
          You can carry forward up to ${balance.maxCarryForward} unused days to next year
        </div>
      ` : `
        <div class="alert alert-warning">
          <strong>⚠️ No Carry Forward</strong><br/>
          Unused leaves will lapse at year-end. Plan accordingly!
        </div>
      `}
    </div>
  `;
}

async function showApplyLeaveModal(employeeId) {
  const balance = await leaveService.getLeaveBalance(employeeId);
  const employee = await employeeService.getEmployee(employeeId);

  if (!balance) {
    alert('Leave policy not assigned. Contact HR.');
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000; display: flex; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div class="card" style="max-width: 600px; width: 100%;">
      <h3 class="mb-4">Apply for Leave</h3>
      
      <form id="leave-form">
        <div class="form-group">
          <label>Leave Type *</label>
          <select id="leave-type" required>
            <option value="">-- Select Leave Type --</option>
            ${balance.cl.remaining > 0 ? `<option value="CL">Casual Leave (CL) - ${balance.cl.remaining} days available</option>` : ''}
            ${balance.pl.remaining > 0 ? `<option value="PL">Privilege Leave (PL) - ${balance.pl.remaining} days available</option>` : ''}
            ${balance.sl.remaining > 0 ? `<option value="SL">Sick Leave (SL) - ${balance.sl.remaining} days available</option>` : ''}
          </select>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label>Start Date *</label>
            <input type="date" id="start-date" required min="${new Date().toISOString().split('T')[0]}" />
          </div>

          <div class="form-group">
            <label>End Date *</label>
            <input type="date" id="end-date" required min="${new Date().toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="half-day" style="width: auto;" />
            <span>Half Day Leave</span>
          </label>
        </div>

        <div class="form-group">
          <label>Reason *</label>
          <textarea id="reason" rows="3" required placeholder="Enter reason for leave..."></textarea>
        </div>

        <!-- Live Impact Preview -->
        <div id="impact-preview" class="alert" style="display: none; background: var(--bg-secondary); border: 2px solid var(--border);"></div>

        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" id="submit-btn" style="position: relative;">
            Submit Request
          </button>
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector('#leave-form');
  const leaveTypeSelect = modal.querySelector('#leave-type');
  const startDateInput = modal.querySelector('#start-date');
  const endDateInput = modal.querySelector('#end-date');
  const halfDayCheck = modal.querySelector('#half-day');
  const impactPreview = modal.querySelector('#impact-preview');
  const submitBtn = modal.querySelector('#submit-btn');

  // Live preview of impact
  const updatePreview = async () => {
    const leaveType = leaveTypeSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const isHalfDay = halfDayCheck.checked;

    if (leaveType && startDate && endDate) {
      const days = isHalfDay ? 0.5 : leaveService.calculateLeaveDays(startDate, endDate);
      const impact = await leaveService.calculateSalaryImpact(employee, leaveType, days);

      impactPreview.style.display = 'block';
      impactPreview.innerHTML = `
        <div class="font-semibold mb-2">📋 Leave Impact Preview:</div>
        <div class="grid grid-2 text-sm">
          <div>
            <div><strong>Days Requested:</strong> ${days} days</div>
            <div><strong>Leave Type:</strong> ${leaveType}</div>
          </div>
          <div>
            <div><strong>Salary Impact:</strong></div>
            <div style="color: ${impact.unpaidDays > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${impact.message}
            </div>
          </div>
        </div>
        ${impact.unpaidDays === 0 ? `
          <div class="mt-2" style="color: var(--success);">
            ✓ Your leave balance will cover this request. No salary deduction.
          </div>
        ` : `
          <div class="mt-2" style="color: var(--danger);">
            ⚠️ Warning: This exceeds your available leave balance!
          </div>
        `}
      `;
    } else {
      impactPreview.style.display = 'none';
    }
  };

  leaveTypeSelect.addEventListener('change', updatePreview);
  startDateInput.addEventListener('change', updatePreview);
  endDateInput.addEventListener('change', updatePreview);
  halfDayCheck.addEventListener('change', updatePreview);

  // Disable end date when half day is selected
  halfDayCheck.addEventListener('change', () => {
    if (halfDayCheck.checked) {
      endDateInput.value = startDateInput.value;
      endDateInput.disabled = true;
    } else {
      endDateInput.disabled = false;
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    const leaveData = {
      employeeId,
      leaveType: leaveTypeSelect.value,
      startDate: startDateInput.value,
      endDate: halfDayCheck.checked ? startDateInput.value : endDateInput.value,
      reason: modal.querySelector('#reason').value,
      isHalfDay: halfDayCheck.checked
    };

    const result = await leaveService.applyLeave(leaveData);

    if (result.success) {
      document.body.removeChild(modal);
      alert(`Leave request submitted successfully!\n\nRequest ID: ${result.request.id}\nDays: ${result.request.days}\nStatus: Pending Approval`);
      window.dispatchEvent(new Event('leave-updated'));
    } else {
      alert('Error: ' + result.message);
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit Request';
    }
  });

  modal.querySelector('#cancel-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

async function loadPendingApprovals(container, approverId) {
  const approvalContainer = container.querySelector('#pending-approvals');
  if (!approvalContainer) return;

  const pendingRequests = await leaveService.getLeaveRequests({
    status: 'pending',
    approverId
  });

  if (pendingRequests.length === 0) {
    approvalContainer.innerHTML = '<p class="text-muted text-center p-4">No pending approvals</p>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Employee</th>
        <th>Leave Type</th>
        <th>Dates</th>
        <th>Days</th>
        <th>Reason</th>
        <th>Applied On</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${pendingRequests.map(req => `
        <tr>
          <td class="font-medium">${req.employeeName}</td>
          <td><span class="badge badge-primary">${req.leaveType}</span></td>
          <td class="text-sm">${formatDate(req.startDate)} to ${formatDate(req.endDate)}</td>
          <td class="font-medium">${req.days} days</td>
          <td class="text-sm">${req.reason}</td>
          <td class="text-sm">${formatDateTime(req.appliedOn)}</td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem; background: var(--success); color: white;" onclick="window.approveLeave('${req.id}')">Approve</button>
              <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem; background: var(--danger); color: white;" onclick="window.rejectLeave('${req.id}')">Reject</button>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  approvalContainer.innerHTML = '';
  approvalContainer.appendChild(table);
}

async function loadLeaveHistory(container, filters) {
  const historyContainer = container.querySelector('#leave-history');
  if (!historyContainer) return;

  const requests = await leaveService.getLeaveRequests(filters);

  if (requests.length === 0) {
    historyContainer.innerHTML = '<p class="text-muted text-center p-8">No leave requests found</p>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Request ID</th>
        <th>Employee</th>
        <th>Leave Type</th>
        <th>Duration</th>
        <th>Days</th>
        <th>Status</th>
        <th>Applied On</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${requests.map(req => {
    const canCancel = req.status === 'pending' || req.status === 'approved';
    return `
          <tr>
            <td class="font-medium">${req.id}</td>
            <td>${req.employeeName}</td>
            <td><span class="badge badge-primary">${req.leaveType}</span></td>
            <td class="text-sm">${formatDate(req.startDate)} - ${formatDate(req.endDate)}</td>
            <td class="font-medium">${req.days}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td class="text-sm">${formatDateTime(req.appliedOn)}</td>
            <td>
              ${canCancel ? `<button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem;" onclick="window.cancelLeave('${req.id}')">Cancel</button>` : '-'}
            </td>
          </tr>
        `;
  }).join('')}
    </tbody>
  `;

  historyContainer.innerHTML = '';
  historyContainer.appendChild(table);
}

function getStatusBadge(status) {
  const badges = {
    pending: '<span class="badge badge-warning">Pending</span>',
    approved: '<span class="badge badge-success">Approved</span>',
    rejected: '<span class="badge badge-danger">Rejected</span>',
    cancelled: '<span class="badge">Cancelled</span>'
  };
  return badges[status] || status;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

async function getEmployeeOptions() {
  const employees = await employeeService.getEmployees({ status: 'active' });
  return employees.map(e => `<option value="${e.id}">${e.name} (${e.employeeId})</option>`).join('');
}

async function loadEmployeeFilterOptions(container) {
  const empFilter = container.querySelector('#employee-filter');
  if (empFilter) {
    empFilter.innerHTML = '<option value="">All Employees</option>' + await getEmployeeOptions();
  }
}

// Global action handlers
window.approveLeave = async (requestId) => {
  if (confirm('Approve this leave request?')) {
    const currentUser = authService.getCurrentUser();
    const result = await leaveService.approveLeave(requestId, currentUser.userId);
    if (result.success) {
      alert('Leave approved successfully!');
      window.dispatchEvent(new Event('leave-updated'));
    } else {
      alert('Error: ' + result.message);
    }
  }
};

window.rejectLeave = async (requestId) => {
  const reason = prompt('Enter rejection reason:');
  if (reason) {
    const currentUser = authService.getCurrentUser();
    const result = await leaveService.rejectLeave(requestId, currentUser.userId, reason);
    if (result.success) {
      alert('Leave rejected');
      window.dispatchEvent(new Event('leave-updated'));
    } else {
      alert('Error: ' + result.message);
    }
  }
};

window.cancelLeave = async (requestId) => {
  if (confirm('Cancel this leave request?')) {
    const currentUser = authService.getCurrentUser();
    const result = await leaveService.cancelLeave(requestId, currentUser.userId);
    if (result.success) {
      alert('Leave request cancelled');
      window.dispatchEvent(new Event('leave-updated'));
    } else {
      alert('Error: ' + result.message);
    }
  }
};
