import { companyService } from '../core/company.js';

export function renderCompanySettings() {
  const container = document.createElement('div');
  container.innerHTML = '<div class="text-muted text-center py-8">Loading settings...</div>';
  loadCompanySettings(container);
  return container;
}

async function loadCompanySettings(container) {
  const company = await companyService.getCompany();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Company Settings</h1>
      <p class="page-subtitle">Manage company configuration and basic details</p>
    </div>

    <div class="grid grid-2 mb-6">
      <!-- Company Details Card -->
      <div class="card">
        <h3 class="mb-4">Company Information</h3>
        <form id="company-form">
          <div class="form-group">
            <label>Company Name</label>
            <input type="text" id="companyName" value="${company?.name || ''}" required />
          </div>

          <div class="form-group">
            <label>Company Code</label>
            <input type="text" id="companyCode" value="${company?.code || ''}" disabled />
          </div>

          <div class="form-group">
            <label>Industry</label>
            <select id="industry">
              <option value="Technology" ${company?.industry === 'Technology' ? 'selected' : ''}>Technology</option>
              <option value="Manufacturing" ${company?.industry === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
              <option value="Retail" ${company?.industry === 'Retail' ? 'selected' : ''}>Retail</option>
              <option value="Healthcare" ${company?.industry === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
              <option value="Finance" ${company?.industry === 'Finance' ? 'selected' : ''}>Finance</option>
              <option value="Education" ${company?.industry === 'Education' ? 'selected' : ''}>Education</option>
            </select>
          </div>

          <div class="form-group">
            <label>Address</label>
            <textarea id="address" rows="3">${company?.address || ''}</textarea>
          </div>

          <button type="submit" class="btn btn-primary">Save Company Details</button>
        </form>
      </div>

      <!-- Working Configuration Card -->
      <div class="card">
        <h3 class="mb-4">Working Configuration</h3>
        <form id="config-form">
          <div class="form-group">
            <label>Time Zone</label>
            <select id="timezone">
              <option value="IST" ${company?.timezone === 'IST' ? 'selected' : ''}>IST (GMT+5:30)</option>
              <option value="EST" ${company?.timezone === 'EST' ? 'selected' : ''}>EST (GMT-5:00)</option>
              <option value="PST" ${company?.timezone === 'PST' ? 'selected' : ''}>PST (GMT-8:00)</option>
              <option value="GMT" ${company?.timezone === 'GMT' ? 'selected' : ''}>GMT (GMT+0:00)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Working Days</label>
            <select id="workingDays">
              <option value="Monday to Friday" ${company?.workingDays === 'Monday to Friday' ? 'selected' : ''}>Monday to Friday</option>
              <option value="Monday to Saturday" ${company?.workingDays === 'Monday to Saturday' ? 'selected' : ''}>Monday to Saturday</option>
            </select>
          </div>

          <div class="form-group">
            <label>Work Start Time</label>
            <input type="time" id="workStartTime" value="${company?.settings?.workStartTime || '09:00'}" />
          </div>

          <div class="form-group">
            <label>Work End Time</label>
            <input type="time" id="workEndTime" value="${company?.settings?.workEndTime || '18:00'}" />
          </div>

          <div class="form-group">
            <label>Payroll Cycle</label>
            <select id="payrollCycle">
              <option value="1st to 30th" ${company?.payrollCycle === '1st to 30th' ? 'selected' : ''}>1st to 30th of month</option>
              <option value="25th to 24th" ${company?.payrollCycle === '25th to 24th' ? 'selected' : ''}>25th to 24th of month</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary">Save Configuration</button>
        </form>
      </div>
    </div>

    <div id="success-message" class="alert alert-success" style="display: none;">
      Settings saved successfully!
    </div>
  `;

  // Handle company form submission
  const companyForm = container.querySelector('#company-form');
  companyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: container.querySelector('#companyName').value,
      industry: container.querySelector('#industry').value,
      address: container.querySelector('#address').value
    };

    await companyService.updateCompany(data);
    showSuccessMessage(container);
  });

  // Handle config form submission
  const configForm = container.querySelector('#config-form');
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      timezone: container.querySelector('#timezone').value,
      workingDays: container.querySelector('#workingDays').value,
      payrollCycle: container.querySelector('#payrollCycle').value,
      settings: {
        workStartTime: container.querySelector('#workStartTime').value,
        workEndTime: container.querySelector('#workEndTime').value
      }
    };

    await companyService.updateCompany(data);
    showSuccessMessage(container);
  });
}

function showSuccessMessage(container) {
  const msg = container.querySelector('#success-message');
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}
