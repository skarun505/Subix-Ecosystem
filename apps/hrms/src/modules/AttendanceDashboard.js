import { biometricService } from '../core/biometric.js';
import { employeeService } from '../core/employee.js';
import { authService } from '../core/auth.js';
import { approvalService } from '../core/approval.js';
import { toast } from '../core/toast.js';

export function renderAttendanceDashboard() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();
  const isHROrAdmin = currentUser && (currentUser.role === 'hr_admin' || currentUser.role === 'super_admin');

  // Get current month/year
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Attendance Management</h1>
      <p class="page-subtitle">View and manage attendance records</p>
    </div>

    <!-- Manual Attendance Controls (For Current User) -->
    <div class="card mb-6" id="attendance-controls">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="mb-1">Mark Attendance</h3>
          <p class="text-sm text-muted" id="current-time-display">Loading time...</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary" id="btn-check-in">Login</button>
          <button class="btn btn-warning" id="btn-break-start" disabled>Start Break</button>
          <button class="btn btn-secondary" id="btn-break-end" disabled>End Break</button>
          <button class="btn btn-danger" id="btn-check-out" disabled>Logout</button>
        </div>
      </div>
    </div>

    <!-- Month Summary Stats -->
    <div class="grid grid-4 mb-6" id="summary-stats">
      <div class="card stat-card">
        <div class="stat-value" id="present-days">0</div>
        <div class="stat-label">Present Days</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" id="total-hours">0</div>
        <div class="stat-label">Working Hours</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" id="late-marks">0</div>
        <div class="stat-label">Late Marks</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" id="overtime-hours">0</div>
        <div class="stat-label">Overtime Hours</div>
      </div>
    </div>

   ${isHROrAdmin ? `
      <!-- Filters for HR/Admin -->
      <div class="card mb-6">
        <h3 class="mb-4">Filters</h3>
        <div class="grid grid-4">
          <div class="form-group">
            <label>Employee</label>
            <select id="employee-filter">
              <option value="">All Employees</option>
              <!-- Options loaded dynamically -->
            </select>
          </div>
          <div class="form-group">
            <label>Month</label>
            <select id="month-filter">
              ${getMonthOptions(currentMonth)}
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <select id="year-filter">
              <option value="2024">2024</option>
              <option value="2025" selected>2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="status-filter">
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary mt-2" id="apply-filters-btn">Apply Filters</button>
      </div>
    ` : ''}

    <!-- Attendance Records -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h3>Attendance Records</h3>
        <div class="flex gap-2">
          <button class="btn btn-secondary" id="export-btn">Export to CSV</button>
          ${isHROrAdmin ? `
            <button class="btn btn-secondary" onclick="window.location.hash='shifts'">Manage Shifts</button>
            <button class="btn btn-primary" id="import-bio-btn">Sync Biometric</button>
          ` : ''}
        </div>
      </div>
      
      <div id="attendance-list"></div>
    </div>
  `;

  // Initial data load
  const employeeId = isHROrAdmin ? null : currentUser.userId;
  loadAttendanceData(container, employeeId, currentMonth, currentYear);

  // Load employee filter options for HR/Admin
  if (isHROrAdmin) {
    loadEmployeeFilterOptions(container);
  }

  // Filter handlers for HR/Admin
  if (isHROrAdmin) {
    const applyBtn = container.querySelector('#apply-filters-btn');
    applyBtn.addEventListener('click', () => {
      const empId = container.querySelector('#employee-filter').value || null;
      const month = parseInt(container.querySelector('#month-filter').value);
      const year = parseInt(container.querySelector('#year-filter').value);
      loadAttendanceData(container, empId, month, year);
    });
  }

  // Export handler
  const exportBtn = container.querySelector('#export-btn');
  exportBtn.addEventListener('click', () => {
    exportAttendanceCSV(container);
  });

  // Import handler (HR/Admin)
  if (isHROrAdmin) {
    const importBtn = container.querySelector('#import-bio-btn');
    importBtn.addEventListener('click', () => {
      showImportBiometricModal(container);
    });
  }

  // Update clock
  setInterval(() => {
    const timeDisplay = container.querySelector('#current-time-display');
    if (timeDisplay) {
      const now = new Date();
      timeDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }, 1000);

  // Initial Control State
  updateAttendanceControls(container, currentUser.userId);

  // Button Handlers
  container.querySelector('#btn-check-in').addEventListener('click', () => handleAttendanceAction(container, currentUser.userId, 'check-in'));
  container.querySelector('#btn-check-out').addEventListener('click', () => handleAttendanceAction(container, currentUser.userId, 'check-out'));
  container.querySelector('#btn-break-start').addEventListener('click', () => handleAttendanceAction(container, currentUser.userId, 'break-start'));
  container.querySelector('#btn-break-end').addEventListener('click', () => handleAttendanceAction(container, currentUser.userId, 'break-end'));

  return container;
}

async function handleAttendanceAction(container, userId, type) {
  const result = await biometricService.markAttendance(userId, type);
  if (result.success) {
    toast.success(`Action ${type} successful!`);
    await updateAttendanceControls(container, userId);
    const now = new Date();
    await loadAttendanceData(container, userId, now.getMonth() + 1, now.getFullYear());
  } else {
    toast.error(result.message);
  }
}

async function updateAttendanceControls(container, userId) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const records = await biometricService.getAttendance({ employeeId: userId, startDate: dateStr, endDate: dateStr });
  const todayRecord = records.find(r => r.date === dateStr);

  const btnCheckIn = container.querySelector('#btn-check-in');
  const btnCheckOut = container.querySelector('#btn-check-out');
  const btnBreakStart = container.querySelector('#btn-break-start');
  const btnBreakEnd = container.querySelector('#btn-break-end');

  // Reset all
  btnCheckIn.disabled = false;
  btnCheckOut.disabled = true;
  btnBreakStart.disabled = true;
  btnBreakEnd.disabled = true;

  if (todayRecord) {
    if (todayRecord.inTime) {
      btnCheckIn.disabled = true;
      btnCheckOut.disabled = false;
      btnBreakStart.disabled = false;

      // Check if on break
      const lastBreak = todayRecord.breakLogs[todayRecord.breakLogs.length - 1];
      if (lastBreak && !lastBreak.end) {
        // On Break
        btnBreakStart.disabled = true;
        btnBreakEnd.disabled = false;
        btnCheckOut.disabled = true; // Cannot checkout while on break usually
      }

      if (todayRecord.outTime) {
        // Punched out
        btnCheckOut.disabled = true;
        btnBreakStart.disabled = true;
        btnBreakEnd.disabled = true;
      }
    }
  }
}

async function loadAttendanceData(container, employeeId, month, year) {
  let summary;
  if (employeeId) {
    summary = await biometricService.getAttendanceSummary(employeeId, month, year);
  } else {
    const employees = await employeeService.getEmployees({ status: 'active' });
    summary = {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      totalWorkingHours: 0,
      overtimeHours: 0
    };

    for (const emp of employees) {
      const empSummary = await biometricService.getAttendanceSummary(emp.id, month, year);
      summary.totalDays += empSummary.totalDays;
      summary.present += empSummary.present;
      summary.absent += empSummary.absent;
      summary.late += empSummary.late;
      summary.totalWorkingHours += empSummary.totalWorkingHours;
      summary.overtimeHours += empSummary.overtimeHours;
    }
  }

  container.querySelector('#present-days').textContent = summary.present;
  container.querySelector('#total-hours').textContent = Math.round(summary.totalWorkingHours);
  container.querySelector('#late-marks').textContent = summary.late;
  container.querySelector('#overtime-hours').textContent = Math.round(summary.overtimeHours);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const endDateStr = endDate.toISOString().split('T')[0];

  const filters = {
    startDate,
    endDate: endDateStr
  };

  if (employeeId) {
    filters.employeeId = employeeId;
  }

  const records = await biometricService.getAttendance(filters);
  renderAttendanceTable(container, records);
}

function renderAttendanceTable(container, records) {
  const listContainer = container.querySelector('#attendance-list');

  if (records.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center p-8">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
        <h3 class="mb-2">No Attendance Records</h3>
        <p class="text-muted">Import biometric data to see attendance records here</p>
      </div>
    `;
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Day</th>
        <th>Employee</th>
        <th>Login Time</th>
        <th>Break Duration</th>
        <th>Logout Time</th>
        <th>Working Hours</th>
        <th>Status</th>
        <th>Remarks</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${records.map(record => `
        <tr>
          <td class="font-medium">${new Date(record.date).toLocaleDateString()}</td>
          <td>${new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
          <td>${record.employeeName}</td>
          <td>${record.inTime || '-'}</td>
          <td>${record.breakDuration ? record.breakDuration + ' mins' : '-'}</td>
          <td>${record.outTime || '-'}</td>
          <td class="font-medium">${record.workingHours ? record.workingHours.toFixed(2) + 'h' : '-'}</td>
          <td>${getStatusBadge(record)}</td>
          <td class="text-xs">
            ${record.isLate ? '<span class="badge badge-warning">Late</span> ' : ''}
            ${record.isEarlyCheckout ? '<span class="badge badge-warning">Early</span> ' : ''}
            ${record.overtimeHours > 0 ? `<span class="badge badge-success">OT: ${record.overtimeHours.toFixed(1)}h</span>` : ''}
            ${record.source === 'biometric' ? '<span class="badge badge-primary">Biometric</span>' : ''}
          </td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="window.requestCorrection('${record.employeeId}', '${record.date}')">Correct</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  listContainer.innerHTML = '';
  listContainer.appendChild(table);
}

function getStatusBadge(record) {
  if (record.status === 'present') {
    if (record.workingHours >= 4) {
      return '<span class="badge badge-success">Present</span>';
    } else {
      return '<span class="badge badge-warning">Half Day</span>';
    }
  } else if (record.status === 'absent') {
    return '<span class="badge badge-danger">Absent</span>';
  } else {
    return '<span class="badge">Unknown</span>';
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })} (${days[date.getDay()]})`;
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

function getMonthOptions(selectedMonth) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.map((month, index) =>
    `<option value="${index + 1}" ${index + 1 === selectedMonth ? 'selected' : ''}>${month}</option>`
  ).join('');
}

function exportAttendanceCSV(container) {
  const table = container.querySelector('table');
  if (!table) {
    alert('No data to export');
    return;
  }

  let csv = [];
  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th');
    const rowData = Array.from(cols).map(col => {
      // Clean HTML tags and quotes
      const text = col.textContent.trim().replace(/"/g, '""');
      return `"${text}"`;
    });
    csv.push(rowData.join(','));
  });

  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

window.requestCorrection = async (employeeId, date) => {
  const requestedInTime = prompt(`Enter requested Check-In time for ${date} (HH:MM):`);
  if (!requestedInTime) return;

  const requestedOutTime = prompt(`Enter requested Check-Out time for ${date} (HH:MM):`);
  if (!requestedOutTime) return;

  const reason = prompt('Reason for correction:');
  if (!reason) return;

  const result = await approvalService.submitAttendanceCorrection(employeeId, date, requestedInTime, requestedOutTime, reason);
  if (result.success) {
    alert('Correction request submitted for approval! ✅');
  } else {
    alert('Error: ' + result.message);
  }
};

function showImportBiometricModal(container) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000; display: flex; align-items: center; justify-content: center;';

  const today = new Date().toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="card" style="max-width: 500px; width: 100%;">
      <div class="flex justify-between items-center mb-4">
        <h3 style="margin: 0;">Sync Biometric Data</h3>
        <button class="btn-text" id="close-modal">✕</button>
      </div>
      
      <div class="alert alert-warning text-sm mb-4">
        This will simulate checking for new logs from the configured biometric device (IP: 192.168.1.201).
        Logs will be matched against assigned shifts.
      </div>

      <div class="form-group">
        <label>Sync Range (Days)</label>
        <select id="sync-days" class="w-full p-2 border rounded">
          <option value="1">Last 24 Hours</option>
          <option value="3">Last 3 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      <div class="flex gap-2 mt-4">
        <button class="btn btn-primary w-full" id="start-sync-btn">Start Sync</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.querySelector('#start-sync-btn').addEventListener('click', async () => {
    const btn = modal.querySelector('#start-sync-btn');
    btn.disabled = true;
    btn.textContent = 'Syncing...';

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));

    const days = parseInt(modal.querySelector('#sync-days').value);
    const employees = await employeeService.getEmployees({ status: 'active' });
    const empIds = employees.map(e => e.employeeId);

    const logs = await biometricService.generateSampleData(empIds, days);
    const result = await biometricService.parseLogData(logs);

    document.body.removeChild(modal);

    if (result.success) {
      toast.success(`Successfully synced ${result.scanned} logs. ${result.processed} processed.`);
      // Refresh current view
      const now = new Date();
      loadAttendanceData(container, null, now.getMonth() + 1, now.getFullYear());
    } else {
      toast.error('Sync failed: ' + result.message);
    }
  });
}
