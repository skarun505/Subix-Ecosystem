import { shiftService } from '../core/shift.js';
import { employeeService } from '../core/employee.js';

export function renderShiftManagement() {
  const container = document.createElement('div');

  container.innerHTML = `
    <div class="page-header" style="background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(5, 5, 5, 1) 100%); padding: 3rem 2rem; border-radius: 20px; border: 1px solid rgba(204, 255, 0, 0.1); margin-bottom: 2rem; position: relative; overflow: hidden;">
      <div style="position: relative; z-index: 2;">
        <h1 class="page-title" style="font-size: 2.5rem; margin-bottom: 0.5rem;">Shift & Roster Management</h1>
        <p class="page-subtitle" style="font-size: 1.1rem; max-width: 600px; color: var(--text-muted);">
          Manage work shifts, schedule rosters, and ensure optimal workforce coverage.
        </p>
      </div>
    </div>

    <div class="card mb-6" style="padding: 0; overflow: hidden; background: var(--surface);">
       <div style="border-bottom: 1px solid var(--border); padding: 0 1rem;">
        <nav class="nav" style="display: flex; gap: 2rem;">
            <button class="nav-item active" data-tab="roster" style="padding: 1.25rem 0.5rem; border-bottom: 3px solid var(--primary-lime); color: var(--text-main); font-weight: 600; background: none; cursor: pointer;">Roster Scheduler</button>
            <button class="nav-item" data-tab="shifts" style="padding: 1.25rem 0.5rem; border-bottom: 3px solid transparent; color: var(--text-muted); font-weight: 500; background: none; cursor: pointer;">Shift Definitions</button>
        </nav>
      </div>

      <div id="shift-content" style="padding: 2rem;"></div>
    </div>
  `;

  const tabs = container.querySelectorAll('.nav-item');
  const content = container.querySelector('#shift-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.borderBottomColor = 'transparent';
        t.style.color = 'var(--text-muted)';
      });
      tab.classList.add('active');
      tab.style.borderBottomColor = 'var(--primary-lime)';
      tab.style.color = 'var(--text-main)';

      if (tab.dataset.tab === 'shifts') {
        renderShiftDefinitions(content);
      } else {
        renderRosterScheduler(content);
      }
    });
  });

  // Default view
  renderRosterScheduler(content);

  return container;
}

// ----------------------------------------------------------------------
// Shift Definitions View
// ----------------------------------------------------------------------
async function renderShiftDefinitions(container) {
  const shifts = await shiftService.getShifts();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="font-bold text-lg">Shift Definitions</h3>
        <p class="text-sm text-muted">Configure working hours and break timings</p>
      </div>
      <button class="btn btn-primary" id="add-shift-btn">
        <span style="font-size: 1.2rem; margin-right: 0.5rem; line-height: 1;">+</span> Add New Shift
      </button>
    </div>

    <div class="grid grid-3 gap-6">
      ${shifts.map(shift => `
        <div class="card hover-reveal" style="border-top: 4px solid ${shift.color}; border-radius: 12px; transition: transform 0.2s;">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="font-bold text-xl mb-1">${shift.name}</div>
              <div class="text-xs text-muted font-mono bg-bg-secondary px-2 py-1 rounded inline-block">Code: ${shift.code}</div>
            </div>
            ${shift.isDefault ? '<span class="badge badge-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Default</span>' : ''}
            ${shift.isOff ? '<span class="badge badge-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Off Day</span>' : ''}
          </div>
          
          ${!shift.isOff ? `
            <div class="flex flex-col gap-3 mb-4 p-3 bg-bg-secondary rounded-lg">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Timing
                    </span>
                    <span class="font-bold font-mono">${shift.startTime} - ${shift.endTime}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Grace
                    </span>
                    <span class="font-medium">${shift.graceTime} mins</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                        Break
                    </span>
                    <span class="font-medium">${shift.breakDuration} mins</span>
                </div>
            </div>
          ` : `
            <div class="text-sm text-muted mb-4 p-4 bg-bg-secondary rounded-lg italic text-center">
                This shift is marked as a Weekly Off or Holiday shift. No attendance required.
            </div>
          `}

          <div class="pt-4 border-t border-gray-100">
            <button class="btn btn-sm btn-secondary w-full hover:bg-bg-hover transition-colors" onclick="window.editShift('${shift.id}')">
                Edit Configuration
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelector('#add-shift-btn').addEventListener('click', () => {
    showShiftModal();
  });
}

// ----------------------------------------------------------------------
// Roster Scheduler View
// ----------------------------------------------------------------------
function renderRosterScheduler(container) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2 items-center">
        <button class="btn btn-secondary" id="prev-week">←</button>
        <span class="font-bold text-lg" id="date-range-label"></span>
        <button class="btn btn-secondary" id="next-week">→</button>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" id="bulk-assign-btn">Bulk Assign</button>
        <button class="btn btn-primary" id="save-roster-btn">Save Changes</button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="roster-table w-full">
        <thead>
          <tr id="roster-header">
            <th style="min-width: 200px; position: sticky; left: 0; z-index: 10;">Employee</th>
            <!-- Dates will be injected here -->
          </tr>
        </thead>
        <tbody id="roster-body">
          <!-- Roster rows will be injected here -->
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 2px;"></div>
        <span>General (GS)</span>
      </div>
      <div class="flex items-center gap-2">
        <div style="width: 12px; height: 12px; background: #10b981; border-radius: 2px;"></div>
        <span>Morning (MS)</span>
      </div>
      <div class="flex items-center gap-2">
        <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 2px;"></div>
        <span>Evening (ES)</span>
      </div>
      <div class="flex items-center gap-2">
        <div style="width: 12px; height: 12px; background: #94a3b8; border-radius: 2px;"></div>
        <span>Weekly Off (WO)</span>
      </div>
    </div>
  `;

  let startDate = new Date();
  // Set to start of week (Monday)
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
  startDate.setDate(diff);

  renderRosterGrid(container, startDate);

  container.querySelector('#prev-week').addEventListener('click', () => {
    startDate.setDate(startDate.getDate() - 7);
    renderRosterGrid(container, startDate);
  });

  container.querySelector('#next-week').addEventListener('click', () => {
    startDate.setDate(startDate.getDate() + 7);
    renderRosterGrid(container, startDate);
  });

  container.querySelector('#save-roster-btn').addEventListener('click', () => {
    saveRosterChanges(container);
  });

  container.querySelector('#bulk-assign-btn').addEventListener('click', () => {
    showBulkAssignModal(container);
  });
}

async function showBulkAssignModal(container) {
  const shifts = await shiftService.getShifts();

  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000; display: flex; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div class="card" style="max-width: 500px; width: 100%;">
      <h3 class="mb-4">Bulk Shift Assignment</h3>
      <form id="bulk-form">
        <div class="grid grid-2">
          <div class="form-group">
            <label>From Date</label>
            <input type="date" id="from-date" required min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label>To Date</label>
            <input type="date" id="to-date" required min="${new Date().toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="form-group">
          <label>Assign Shift</label>
          <select id="bulk-shift" required>
            <option value="">-- Select Shift --</option>
            ${shifts.map(s => `<option value="${s.id}">${s.name} (${s.startTime}-${s.endTime})</option>`).join('')}
          </select>
        </div>

        <div class="alert alert-success text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>This will assign the selected shift to <strong>ALL Active Employees</strong> for the date range.</span>
        </div>


        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Apply Assignments</button>
          <button type="button" class="btn btn-secondary" id="cancel-bulk">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#bulk-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fromDate = new Date(modal.querySelector('#from-date').value);
    const toDate = new Date(modal.querySelector('#to-date').value);
    const shiftId = modal.querySelector('#bulk-shift').value;

    const activeEmployees = await employeeService.getEmployees({ status: 'active' });
    const assignments = [];

    // Loop through dates
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Loop through all employees
      activeEmployees.forEach(emp => {
        assignments.push({
          employeeId: emp.id,
          date: dateStr,
          shiftId: shiftId
        });
      });
    }

    if (assignments.length > 0) {
      await shiftService.assignRoster(assignments);
      alert(`Successfully assigned shift to ${activeEmployees.length} employees for ${assignments.length / activeEmployees.length} days.`);

      // Refresh grid
      const startDate = new Date(); // Reset to current week or keep current view?
      // Ideally we refresh the current view.
      // But for simplicity reset to this week is fine as Roster Scheduler defaults to "now".
      // Or better, trigger the "Next/Prev" logic on parent container?
      // Simpler: Just refresh the whole page or re-render.
      const rosterContent = document.querySelector('#shift-content');
      if (rosterContent) renderRosterScheduler(roosterContent);
    }

    document.body.removeChild(modal);
  });

  modal.querySelector('#cancel-bulk').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

async function renderRosterGrid(container, startDate) {
  const employeeData = await employeeService.getEmployees({ status: 'active' });
  const shifts = await shiftService.getShifts();

  // Header
  const headerRow = container.querySelector('#roster-header');
  const dateLabel = container.querySelector('#date-range-label');

  // Clear existing dates
  while (headerRow.children.length > 1) {
    headerRow.removeChild(headerRow.lastChild);
  }

  const outputDates = [];
  const endDate = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + i);
    outputDates.push(curDate.toISOString().split('T')[0]);

    const th = document.createElement('th');
    th.className = 'text-center';
    th.innerHTML = `
      <div class="text-xs text-muted">${curDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
      <div>${curDate.getDate()}</div>
    `;
    headerRow.appendChild(th);

    if (i === 6) endDate.setDate(startDate.getDate() + 6);
  }

  dateLabel.textContent = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Body
  const tbody = container.querySelector('#roster-body');
  tbody.innerHTML = '';

  // Get existing roster data
  const rosterData = await shiftService.getRoster(
    startDate.toISOString().split('T')[0],
    outputDates[6]
  );

  const rosterMap = {};
  rosterData.forEach(r => {
    // Safety check: ensure shift object exists and has a code
    if (r.shift && r.shift.code) {
      rosterMap[`${r.employeeId}_${r.date}`] = r.shift.code;
    }
  });

  employeeData.forEach(emp => {
    const tr = document.createElement('tr');

    // Employee Info
    const tdName = document.createElement('td');
    tdName.style.position = 'sticky';
    tdName.style.left = '0';
    tdName.style.backgroundColor = 'var(--bg-primary)';
    tdName.style.zIndex = '5';
    tdName.style.borderRight = '1px solid var(--border)';
    tdName.innerHTML = `
      <div class="font-medium">${emp.name}</div>
      <div class="text-xs text-muted">${emp.employeeId}</div>
    `;
    tr.appendChild(tdName);

    // Days
    outputDates.forEach(date => {
      const td = document.createElement('td');
      td.className = 'p-1 text-center';

      const currentShiftCode = rosterMap[`${emp.id}_${date}`] || 'GS';

      // Shift Dropdown
      const select = document.createElement('select');
      select.className = 'shift-select text-sm p-1 border rounded w-full';
      select.style.fontSize = '12px';
      select.style.outline = 'none';
      select.dataset.emp = emp.id;
      select.dataset.date = date;

      shifts.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.text = s.code || s.name.substring(0, 2).toUpperCase(); // Fallback code
        option.selected = (s.code || 'GS') === currentShiftCode;
        select.appendChild(option);
      });

      // Color coding based on selection
      const updateColor = () => {
        const selectedShift = shifts.find(s => s.id === select.value);
        if (selectedShift) {
          select.style.borderLeft = `3px solid ${selectedShift.color}`;
          select.style.backgroundColor = 'var(--bg-secondary)';
          select.style.color = 'var(--text-main)';
          select.style.borderColor = 'var(--border)';

          if (selectedShift.code === 'WO' || selectedShift.isOff) {
            select.style.opacity = '0.7';
          }
        }
      };

      select.addEventListener('change', updateColor);
      updateColor();

      td.appendChild(select);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

async function saveRosterChanges(container) {
  const selects = container.querySelectorAll('.shift-select');
  const assignments = [];

  selects.forEach(select => {
    assignments.push({
      employeeId: select.dataset.emp,
      date: select.dataset.date,
      shiftId: select.value
    });
  });

  await shiftService.assignRoster(assignments);
  alert('Roster saved successfully!');
}

async function showShiftModal(shiftId = null) {
  const shift = shiftId ? await shiftService.getShift(shiftId) : null;

  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000; display: flex; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div class="card" style="max-width: 500px; width: 100%;">
      <h3 class="mb-4">${shift ? 'Edit Shift' : 'Add New Shift'}</h3>
      <form id="shift-form">
        <div class="grid grid-2">
          <div class="form-group">
            <label>Shift Name</label>
            <input type="text" id="shift-name" value="${shift?.name || ''}" required />
          </div>
          <div class="form-group">
            <label>Shift Code</label>
            <input type="text" id="shift-code" value="${shift?.code || ''}" required maxlength="3" />
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label>Start Time</label>
            <input type="time" id="start-time" value="${shift?.startTime || '09:00'}" required />
          </div>
          <div class="form-group">
            <label>End Time</label>
            <input type="time" id="end-time" value="${shift?.endTime || '18:00'}" required />
          </div>
        </div>

        <div class="grid grid-3">
          <div class="form-group">
            <label>Break (Mins)</label>
            <input type="number" id="break-dur" value="${shift?.breakDuration || 60}" />
          </div>
          <div class="form-group">
            <label>Grace (Mins)</label>
            <input type="number" id="grace-time" value="${shift?.graceTime || 15}" />
          </div>
          <div class="form-group">
            <label>Color</label>
            <input type="color" id="shift-color" value="${shift?.color || '#3b82f6'} " style="height: 40px; padding: 2px;" />
          </div>
        </div>

        <div class="form-group">
          <label class="flex items-center gap-2">
            <input type="checkbox" id="is-off" ${shift?.isOff ? 'checked' : ''} />
            <span>Is Weekly Off / Holiday</span>
          </label>
        </div>

        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Save Shift</button>
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#shift-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: modal.querySelector('#shift-name').value,
      code: modal.querySelector('#shift-code').value.toUpperCase(),
      startTime: modal.querySelector('#start-time').value,
      endTime: modal.querySelector('#end-time').value,
      breakDuration: parseInt(modal.querySelector('#break-dur').value),
      graceTime: parseInt(modal.querySelector('#grace-time').value),
      color: modal.querySelector('#shift-color').value,
      isOff: modal.querySelector('#is-off').checked
    };

    if (shift) {
      await shiftService.updateShift(shift.id, data);
    } else {
      await shiftService.addShift(data);
    }

    document.body.removeChild(modal);
    // Refresh view
    const content = document.querySelector('#shift-content');
    if (content) renderShiftDefinitions(content);
  });

  modal.querySelector('#cancel-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

window.editShift = (id) => {
  showShiftModal(id);
};
