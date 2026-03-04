import { companyService } from '../core/company.js';

export function renderHolidays() {
  const container = document.createElement('div');
  container.id = 'holidays-container';
  const currentYear = new Date().getFullYear();

  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Holiday Calendar</h1>
        <p class="page-subtitle">Manage company holidays and working days</p>
      </div>
      <button class="btn btn-primary" id="add-holiday-btn">+ Add Holiday</button>
    </div>

    <div class="card mb-4">
      <div class="flex justify-between items-center mb-4">
        <h3>Holidays for ${currentYear}</h3>
        <select id="year-select" class="btn btn-secondary">
          <option value="2024">2024</option>
          <option value="2025" selected>2025</option>
          <option value="2026">2026</option>
        </select>
      </div>
      
      <div id="holidays-list"></div>
    </div>

    <!-- Add Holiday Modal -->
    <div id="holiday-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000;">
      <div class="card" style="max-width: 500px; margin: 2rem auto;">
        <h3 class="mb-4">Add Holiday</h3>
        <form id="holiday-form">
          <div class="form-group">
            <label>Holiday Name</label>
            <input type="text" id="holiday-name" required />
          </div>

          <div class="form-group">
            <label>Date</label>
            <input type="date" id="holiday-date" required />
          </div>

          <div class="form-group">
            <label>Type</label>
            <select id="holiday-type">
              <option value="public">Public Holiday</option>
              <option value="optional">Optional Holiday</option>
              <option value="restricted">Restricted Holiday</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary">Add Holiday</button>
            <button type="button" class="btn btn-secondary" id="cancel-holiday">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Render holidays list
  renderHolidaysList(container, currentYear);

  // Refresh handler
  const refreshHolidays = () => {
    if (!document.body.contains(container)) return;
    const yearSelect = container.querySelector('#year-select');
    if (yearSelect) {
      renderHolidaysList(container, parseInt(yearSelect.value));
    }
  };
  window.addEventListener('holiday-updated', refreshHolidays);

  // Year filter handler
  const yearSelect = container.querySelector('#year-select');
  yearSelect.addEventListener('change', (e) => {
    renderHolidaysList(container, parseInt(e.target.value));
  });

  // Modal handlers
  const modal = container.querySelector('#holiday-modal');
  const addBtn = container.querySelector('#add-holiday-btn');
  const cancelBtn = container.querySelector('#cancel-holiday');
  const form = container.querySelector('#holiday-form');

  addBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    form.reset();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#holiday-name').value;
    const date = container.querySelector('#holiday-date').value;
    const type = container.querySelector('#holiday-type').value;

    await companyService.addHoliday(name, date, type);
    modal.style.display = 'none';
    form.reset();

    window.dispatchEvent(new Event('holiday-updated'));
  });

  return container;
}

async function renderHolidaysList(container, year) {
  const holidays = await companyService.getHolidays(year);
  const listContainer = container.querySelector('#holidays-list');

  if (holidays.length === 0) {
    listContainer.innerHTML = '<p class="text-muted text-center p-4">No holidays configured for this year</p>';
    return;
  }

  // Sort by date
  holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Day</th>
        <th>Holiday Name</th>
        <th>Type</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${holidays.map(holiday => {
    const date = new Date(holiday.date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return `
          <tr>
            <td class="font-medium">${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
            <td>${dayNames[date.getDay()]}</td>
            <td>${holiday.name}</td>
            <td><span class="badge badge-${holiday.type === 'public' ? 'success' : 'warning'}">${holiday.type}</span></td>
            <td>
              <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem; color: var(--danger);" onclick="if(confirm('Delete ${holiday.name}?')) { window.deleteHoliday('${holiday.id}') }">Delete</button>
            </td>
          </tr>
        `;
  }).join('')}
    </tbody>
  `;

  listContainer.innerHTML = '';
  listContainer.appendChild(table);

  // Add summary
  const summary = document.createElement('div');
  summary.className = 'mt-4 p-3';
  summary.style.background = 'var(--bg-secondary)';
  summary.style.borderRadius = '6px';
  summary.innerHTML = `
    <div class="flex justify-between text-sm">
      <span class="font-medium">Total Holidays:</span>
      <span class="font-bold">${holidays.length} days</span>
    </div>
  `;
  listContainer.appendChild(summary);
}

// Global delete function
window.deleteHoliday = async (id) => {
  await companyService.deleteHoliday(id);
  window.dispatchEvent(new Event('holiday-updated'));
};
