import { approvalService } from '../core/approval.js';
import { authService } from '../core/auth.js';

export function renderApprovalDashboard() {
  const container = document.createElement('div');
  container.id = 'approval-dashboard-container';
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    container.innerHTML = '<div class="alert alert-error">Please login first</div>';
    return container;
  }

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Approvals Hub</h1>
      <p class="page-subtitle">Manage pending requests and workflows</p>
    </div>

    <!-- Stats Overview -->
    <div id="approval-stats" class="grid grid-4 mb-6">
      <div class="card stat-card" style="background: var(--bg-secondary);">
        <div class="stat-value">—</div>
        <div class="stat-label">Loading...</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-3" style="grid-template-columns: 2fr 1fr;">
      
      <!-- Left Column: Pending Approvals -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h3>Pending Requests</h3>
          <div class="flex gap-2">
            <div class="btn-group" style="display: flex; background: var(--bg-secondary); border-radius: 6px; padding: 2px;">
              <button class="btn btn-sm filter-btn active" data-filter="all" style="background: white; border: none;">All</button>
              <button class="btn btn-sm filter-btn" data-filter="leave" style="background: transparent; border: none;">Leaves</button>
              <button class="btn btn-sm filter-btn" data-filter="attendance_correction" style="background: transparent; border: none;">Attendance</button>
            </div>
            <button class="btn btn-sm btn-secondary" id="refresh-approvals">↻ Refresh</button>
          </div>
        </div>
        <div id="bulk-actions" class="mb-4 p-2 bg-gray-50 rounded flex justify-between items-center" style="display: none; background: var(--bg-secondary); border: 1px dashed var(--border);">
            <span class="text-xs font-medium"><span id="selected-count">0</span> items selected</span>
            <div class="flex gap-2">
                <button class="btn btn-sm btn-success" id="bulk-approve-btn">Approve Selected</button>
                <button class="btn btn-sm btn-secondary" id="clear-selection-btn">Clear</button>
            </div>
        </div>
        <div id="pending-list" class="approval-list">
          <div class="text-center p-4 text-muted">Loading approvals...</div>
        </div>
      </div>

      <!-- Right Column: History -->
      <div>
        <div class="card mb-4" style="background: var(--bg-secondary);">
          <h3 class="mb-3">Quick Actions</h3>
          <button class="btn btn-primary w-full mb-2" id="delegate-btn">Delegate Approvals</button>
          <button class="btn btn-secondary w-full" id="toggle-bulk-btn">Toggle Bulk Mode</button>
        </div>

        <div class="card">
          <h3 class="mb-3">Recent History</h3>
          <div id="approval-history" class="text-sm">
            <p class="text-muted text-center">Loading history...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // ===== Approval Data Loaders =====

  async function loadApprovalStats() {
    try {
      const approvals = await approvalService.getPendingApprovals(currentUser.userId);
      const statContainer = container.querySelector('#approval-stats');

      const leaveCount = approvals.filter(a => a.type === 'leave').length;
      const attendanceCount = approvals.filter(a => a.type === 'attendance_correction').length;

      statContainer.innerHTML = `
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value">${approvals.length}</div>
          <div class="stat-label">Pending Total</div>
        </div>
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value" style="color: var(--danger);">${approvals.filter(a => a.type === 'leave' && a.data && a.data.days >= 3).length}</div>
          <div class="stat-label">Extended Leaves (3+ days)</div>
        </div>
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value" style="color: var(--primary);">${leaveCount}</div>
          <div class="stat-label">Leave Requests</div>
        </div>
        <div class="card stat-card" style="background: var(--bg-secondary);">
          <div class="stat-value" style="color: var(--warning);">${attendanceCount}</div>
          <div class="stat-label">Attendance Corrections</div>
        </div>
      `;
    } catch (err) {
      console.error('Error loading approval stats:', err);
    }
  }

  async function loadPendingApprovals(filterType = 'all') {
    try {
      let approvals = await approvalService.getPendingApprovals(currentUser.userId);
      const listContainer = container.querySelector('#pending-list');

      if (filterType !== 'all') {
        approvals = approvals.filter(a => a.type === filterType);
      }

      if (approvals.length === 0) {
        listContainer.innerHTML = `
          <div class="text-center p-4 text-muted" style="padding: 2rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">✓</div>
            <p>No ${filterType === 'all' ? '' : formatType(filterType) + ' '}pending approvals. You're all caught up!</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = approvals.map(approval => {
        const data = approval.data || {};
        return `
          <div class="card mb-3 approval-card" data-id="${approval.id}" data-type="${approval.type}" style="border-left: 4px solid ${getTypeColor(approval.type)}; position: relative;">
            <div class="bulk-checkbox" style="display: none; position: absolute; left: -30px; top: 50%; transform: translateY(-50%);">
              <input type="checkbox" class="approval-select" value="${approval.id}" data-type="${approval.type}">
            </div>
            <div class="flex justify-between items-start">
              <div style="flex: 1;">
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge ${getTypeBadgeClass(approval.type)}">${formatType(approval.type)}</span>
                  ${data.days >= 3 ? '<span class="badge badge-danger">Extended</span>' : ''}
                  <span class="text-xs text-muted">${approval.requestedOn ? new Date(approval.requestedOn).toLocaleDateString() : ''}</span>
                </div>
                <h4 class="mb-1">${approval.requestedBy || 'Employee'}</h4>
                <div class="text-sm text-muted mb-2">${approval.title || approval.description || ''}</div>
                
                <div class="p-3 rounded text-sm mb-3" style="background: var(--bg-secondary); border-radius: 8px;">
                  ${renderDetails(approval)}
                </div>
              </div>
              <div class="flex flex-col gap-2 action-buttons" style="margin-left: 1rem;">
                <button class="btn btn-sm btn-success approve-btn" data-id="${approval.id}" data-type="${approval.type}">Approve</button>
                <button class="btn btn-sm btn-danger reject-btn" data-id="${approval.id}" data-type="${approval.type}">Reject</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Attach approve/reject listeners
      listContainer.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn.dataset.id, btn.dataset.type, 'approve'));
      });
      listContainer.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => handleApproval(btn.dataset.id, btn.dataset.type, 'reject'));
      });

      // Attach checkbox change listeners
      listContainer.querySelectorAll('.approval-select').forEach(cb => {
        cb.addEventListener('change', updateSelectionCount);
      });

    } catch (err) {
      console.error('Error loading pending approvals:', err);
      const listContainer = container.querySelector('#pending-list');
      listContainer.innerHTML = `<div class="alert alert-error">Error loading approvals: ${err.message}</div>`;
    }
  }

  async function loadApprovalHistory() {
    try {
      const history = await approvalService.getApprovalHistory(currentUser.userId, 5);
      const historyContainer = container.querySelector('#approval-history');

      if (history.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted text-center">No recent history</p>';
        return;
      }

      historyContainer.innerHTML = history.map(item => `
        <div class="mb-3 pb-3 flex justify-between items-center" style="border-bottom: 1px solid var(--border);">
          <div>
            <div class="font-medium">${item.requestedBy || item.description?.split(' - ')[0] || 'Employee'}</div>
            <div class="text-xs text-muted">${item.description || item.title || ''}</div>
          </div>
          <div class="text-right">
            <span class="badge ${item.status === 'approved' ? 'badge-success' : 'badge-danger'} text-xs">${item.status}</span>
            <div class="text-xs text-muted mt-1">${item.processedOn ? new Date(item.processedOn).toLocaleDateString() : ''}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error loading approval history:', err);
    }
  }

  // ===== Action Handlers =====

  async function handleApproval(id, type, action) {
    if (action === 'approve') {
      const comments = prompt('Add comments (optional):') || '';
      try {
        const result = await approvalService.approve(id, type, currentUser.userId, comments);
        if (result.success) {
          alert('Request Approved ✅');
          await refreshDashboard();
        } else {
          alert('Error: ' + (result.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Error approving: ' + err.message);
      }
    } else {
      const reason = prompt('Reason for rejection (required):');
      if (!reason) return;
      try {
        const result = await approvalService.reject(id, type, currentUser.userId, reason);
        if (result.success) {
          alert('Request Rejected ❌');
          await refreshDashboard();
        } else {
          alert('Error: ' + (result.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Error rejecting: ' + err.message);
      }
    }
  }

  function updateSelectionCount() {
    const selected = container.querySelectorAll('.approval-select:checked').length;
    const countEl = container.querySelector('#selected-count');
    if (countEl) countEl.textContent = selected;
  }

  function clearSelection() {
    container.querySelectorAll('.approval-select').forEach(c => c.checked = false);
    updateSelectionCount();
  }

  function toggleBulkMode() {
    const list = container.querySelector('#pending-list');
    const checkboxes = container.querySelectorAll('.bulk-checkbox');
    const actions = container.querySelector('#bulk-actions');
    const actionBtns = container.querySelectorAll('.action-buttons');

    if (list.style.paddingLeft === '40px') {
      list.style.paddingLeft = '0';
      checkboxes.forEach(c => c.style.display = 'none');
      actions.style.display = 'none';
      actionBtns.forEach(b => b.style.opacity = '1');
    } else {
      list.style.paddingLeft = '40px';
      list.style.transition = 'padding 0.3s';
      checkboxes.forEach(c => {
        c.style.display = 'block';
        c.style.animation = 'slideIn 0.3s';
      });
      actions.style.display = 'flex';
      actionBtns.forEach(b => b.style.opacity = '0.3');
    }
  }

  async function handleBulkApprove() {
    const selected = container.querySelectorAll('.approval-select:checked');
    if (selected.length === 0) return;

    if (confirm(`Are you sure you want to approve ${selected.length} requests?`)) {
      let successCount = 0;
      for (const cb of selected) {
        try {
          const res = await approvalService.approve(cb.value, cb.dataset.type, currentUser.userId, 'Bulk Approved');
          if (res.success) successCount++;
        } catch (err) {
          console.error(`Error approving ${cb.value}:`, err);
        }
      }
      alert(`Successfully approved ${successCount} of ${selected.length} requests!`);
      clearSelection();
      await refreshDashboard();
    }
  }

  // ===== Refresh =====

  async function refreshDashboard() {
    if (!document.body.contains(container)) return;
    await loadApprovalStats();
    await loadPendingApprovals();
    await loadApprovalHistory();
  }

  // ===== Event Listeners =====

  // Initialize after DOM attachment
  setTimeout(refreshDashboard, 0);

  container.querySelector('#refresh-approvals').addEventListener('click', refreshDashboard);

  // Filters
  const filterBtns = container.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
      });
      btn.classList.add('active');
      btn.style.background = 'white';
      loadPendingApprovals(btn.dataset.filter);
    });
  });

  // Quick action buttons
  container.querySelector('#delegate-btn').addEventListener('click', () => {
    alert('Feature coming soon: Delegate Approvals');
  });
  container.querySelector('#toggle-bulk-btn').addEventListener('click', toggleBulkMode);
  container.querySelector('#bulk-approve-btn').addEventListener('click', handleBulkApprove);
  container.querySelector('#clear-selection-btn').addEventListener('click', clearSelection);

  // Listen for external approval updates
  const handleUpdate = () => refreshDashboard();
  window.addEventListener('approval-updated', handleUpdate);

  return container;
}

// ===== Helper Functions =====

function renderDetails(approval) {
  const data = approval.data || {};

  if (approval.type === 'leave') {
    const salaryImpact = data.salaryImpact || data.salary_impact || {};
    return `
      <div><strong>Type:</strong> ${data.leaveType || data.leave_type || 'Leave'}</div>
      <div><strong>Dates:</strong> ${data.startDate || data.start_date || '—'} to ${data.endDate || data.end_date || '—'} (${data.days || '?'} days)</div>
      <div><strong>Reason:</strong> ${data.reason || 'Not specified'}</div>
      ${salaryImpact.unpaidDays > 0 ? `<div style="color: var(--danger); margin-top: 0.25rem;">⚠️ Salary Impact: ${salaryImpact.unpaidDays} days loss of pay</div>` : ''}
    `;
  } else if (approval.type === 'attendance_correction') {
    return `
      <div><strong>Date:</strong> ${data.date || '—'}</div>
      <div class="grid grid-2 gap-2 mt-1">
        <div>Current: ${data.currentInTime || data.current_in_time || '--'} - ${data.currentOutTime || data.current_out_time || '--'}</div>
        <div>Requested: <strong>${data.requestedInTime || data.requested_in_time || '--'} - ${data.requestedOutTime || data.requested_out_time || '--'}</strong></div>
      </div>
      <div class="mt-1"><strong>Reason:</strong> ${data.reason || 'Not specified'}</div>
    `;
  }
  return `<div>${approval.description || ''}</div>`;
}

function getTypeColor(type) {
  switch (type) {
    case 'leave': return '#3b82f6';
    case 'attendance_correction': return '#f59e0b';
    default: return '#6b7280';
  }
}

function getTypeBadgeClass(type) {
  return type === 'leave' ? 'badge-primary' : 'badge-warning';
}

function formatType(type) {
  return type === 'attendance_correction' ? 'Attendance' : 'Leave';
}
