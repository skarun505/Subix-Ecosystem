import { companyService } from '../core/company.js';
import { employeeService } from '../core/employee.js';

export function renderOrganization() {
  const container = document.createElement('div');
  container.id = 'organization-container';

  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Organization Structure</h1>
        <p class="page-subtitle">Manage departments, designations, and hierarchy</p>
      </div>
      <button class="btn btn-primary" id="add-dept-btn">+ Add Department</button>
    </div>

    <!-- Departments Section -->
    <div class="card mb-6">
      <h3 class="mb-4">Departments</h3>
      <div id="departments-list"></div>
    </div>

    <!-- Designations Section -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h3>Designations</h3>
        <button class="btn btn-primary" id="add-designation-btn">+ Add Designation</button>
      </div>
      <div id="designations-list"></div>
    </div>

    <!-- Add Department Modal -->
    <div id="dept-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000;">
      <div class="card" style="max-width: 500px; margin: 2rem auto;">
        <h3 class="mb-4">Add Department</h3>
        <form id="dept-form">
          <div class="form-group">
            <label>Department Name</label>
            <input type="text" id="dept-name" required />
          </div>

          <div class="form-group">
            <label>Department Head (Optional)</label>
            <select id="dept-head">
              <option value="">-- Select Head --</option>
              <!-- Options loaded dynamically -->
            </select>
          </div>

          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" id="cancel-dept">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Designation Modal -->
    <div id="designation-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); padding: 2rem; overflow-y: auto; z-index: 1000;">
      <div class="card" style="max-width: 500px; margin: 2rem auto;">
        <h3 class="mb-4">Add Designation</h3>
        <form id="designation-form">
          <div class="form-group">
            <label>Designation Name</label>
            <input type="text" id="designation-name" required />
          </div>

          <div class="form-group">
            <label>Department</label>
            <select id="designation-dept" required>
              <option value="">-- Select Department --</option>
              <!-- Options loaded dynamically -->
            </select>
          </div>

          <div class="form-group">
            <label>Level</label>
            <select id="designation-level" required>
              <option value="1">Level 1 - Junior</option>
              <option value="2">Level 2 - Mid</option>
              <option value="3">Level 3 - Senior</option>
              <option value="4">Level 4 - Lead/Manager</option>
              <option value="5">Level 5 - Director</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" id="cancel-designation">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Render initial lists
  renderDepartmentsList(container);
  renderDesignationsList(container);

  // Refresh handler
  const refreshOrganization = () => {
    if (!document.body.contains(container)) return;
    renderDepartmentsList(container);
    renderDesignationsList(container);
  };
  window.addEventListener('organization-updated', refreshOrganization);

  // Department modal handlers
  const deptModal = container.querySelector('#dept-modal');
  const addDeptBtn = container.querySelector('#add-dept-btn');
  const cancelDeptBtn = container.querySelector('#cancel-dept');
  const deptForm = container.querySelector('#dept-form');

  addDeptBtn.addEventListener('click', async () => {
    const headSelect = container.querySelector('#dept-head');
    headSelect.innerHTML = '<option value="">-- Select Head --</option>' + await getUserOptions();
    deptModal.style.display = 'block';
  });

  cancelDeptBtn.addEventListener('click', () => {
    deptModal.style.display = 'none';
    deptForm.reset();
  });

  deptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#dept-name').value;
    const headId = container.querySelector('#dept-head').value || null;

    await companyService.addDepartment(name, headId);
    deptModal.style.display = 'none';
    deptForm.reset();

    window.dispatchEvent(new Event('organization-updated'));
  });

  // Designation modal handlers
  const designationModal = container.querySelector('#designation-modal');
  const addDesignationBtn = container.querySelector('#add-designation-btn');
  const cancelDesignationBtn = container.querySelector('#cancel-designation');
  const designationForm = container.querySelector('#designation-form');

  addDesignationBtn.addEventListener('click', async () => {
    // Refresh department options
    const deptSelect = designationModal.querySelector('#designation-dept');
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' + await getDepartmentOptions();
    designationModal.style.display = 'block';
  });

  cancelDesignationBtn.addEventListener('click', () => {
    designationModal.style.display = 'none';
    designationForm.reset();
  });

  designationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#designation-name').value;
    const level = parseInt(container.querySelector('#designation-level').value);
    const departmentId = container.querySelector('#designation-dept').value;

    await companyService.addDesignation(name, level, departmentId);
    designationModal.style.display = 'none';
    designationForm.reset();

    window.dispatchEvent(new Event('organization-updated'));
  });

  return container;
}

async function renderDepartmentsList(container) {
  const departments = await companyService.getDepartments();
  const listContainer = container.querySelector('#departments-list');

  if (departments.length === 0) {
    listContainer.innerHTML = '<p class="text-muted">No departments added yet</p>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Department Name</th>
        <th>Department ID</th>
        <th>Status</th>
        <th>Created Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${departments.map(dept => `
        <tr>
          <td class="font-medium">${dept.name}</td>
          <td>${dept.id}</td>
          <td><span class="badge badge-success">${dept.status}</span></td>
          <td>${new Date(dept.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem;" onclick="alert('Edit: ${dept.id}')">Edit</button>
            <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem; color: var(--danger);" onclick="if(confirm('Delete ${dept.name}?')) { window.deleteDepartment('${dept.id}') }">Delete</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  listContainer.innerHTML = '';
  listContainer.appendChild(table);
}

async function renderDesignationsList(container) {
  const designations = await companyService.getDesignations();
  const departments = await companyService.getDepartments();
  const listContainer = container.querySelector('#designations-list');

  if (designations.length === 0) {
    listContainer.innerHTML = '<p class="text-muted">No designations added yet</p>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Designation</th>
        <th>Department</th>
        <th>Level</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${designations.map(des => {
    const dept = departments.find(d => d.id === des.departmentId);
    return `
          <tr>
            <td class="font-medium">${des.name}</td>
            <td>${dept?.name || 'N/A'}</td>
            <td>Level ${des.level}</td>
            <td><span class="badge badge-success">${des.status}</span></td>
            <td>
              <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem;" onclick="alert('Edit: ${des.id}')">Edit</button>
              <button class="btn btn-secondary text-sm" style="padding: 0.25rem 0.75rem; color: var(--danger);" onclick="if(confirm('Delete ${des.name}?')) { window.deleteDesignation('${des.id}') }">Delete</button>
            </td>
          </tr>
        `;
  }).join('')}
    </tbody>
  `;

  listContainer.innerHTML = '';
  listContainer.appendChild(table);
}

async function getUserOptions() {
  const users = await employeeService.getEmployees();
  return users.map(u => `<option value="${u.id}">${u.name} (${u.employeeId})</option>`).join('');
}

async function getDepartmentOptions() {
  const departments = await companyService.getDepartments();
  return departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

// Global delete functions
window.deleteDepartment = async (id) => {
  await companyService.deleteDepartment(id);
  window.dispatchEvent(new Event('organization-updated'));
};

window.deleteDesignation = async (id) => {
  await companyService.deleteDesignation(id);
  window.dispatchEvent(new Event('organization-updated'));
};
