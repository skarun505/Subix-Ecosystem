import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';

export function renderDocuments() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();

  container.innerHTML = '<div class="text-muted text-center py-8">Loading documents...</div>';
  loadDocumentsData(container, currentUser);
  return container;
}

async function loadDocumentsData(container, currentUser) {
  // Get employee data
  const employee = await employeeService.getEmployee(currentUser.userId) || {};

  // Sample documents for the employee
  const documents = [
    { id: 'DOC001', name: 'Offer Letter', type: 'Employment', issuedDate: employee.joiningDate || '2023-01-15', status: 'available' },
    { id: 'DOC002', name: 'Appointment Letter', type: 'Employment', issuedDate: employee.joiningDate || '2023-01-15', status: 'available' },
    { id: 'DOC003', name: 'Employee ID Card', type: 'Identification', issuedDate: employee.joiningDate || '2023-01-15', status: 'available' },
    { id: 'DOC004', name: 'NDA (Non-Disclosure Agreement)', type: 'Legal', issuedDate: employee.joiningDate || '2023-01-15', status: 'available' },
    { id: 'DOC005', name: 'Company Policy Handbook', type: 'Policy', issuedDate: '2024-01-01', status: 'available' },
    { id: 'DOC006', name: 'Form 16 (2023-24)', type: 'Tax', issuedDate: '2024-06-15', status: 'available' },
    { id: 'DOC007', name: 'PF Statement (2024)', type: 'Financial', issuedDate: '2024-12-01', status: 'available' },
    { id: 'DOC008', name: 'Experience Certificate', type: 'Employment', issuedDate: null, status: 'pending' }
  ];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">My Documents</h1>
      <p class="page-subtitle">Access and download your employment documents</p>
    </div>

    <div class="grid grid-4 mb-6">
      <div class="card stat-card">
        <div class="stat-value">${documents.filter(d => d.status === 'available').length}</div>
        <div class="stat-label">Available</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">${documents.filter(d => d.status === 'pending').length}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">${documents.filter(d => d.type === 'Employment').length}</div>
        <div class="stat-label">Employment</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">${documents.filter(d => d.type === 'Tax' || d.type === 'Financial').length}</div>
        <div class="stat-label">Financial/Tax</div>
      </div>
    </div>

    <div class="card mb-4">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3>All Documents</h3>
        <div class="flex gap-2">
          <select id="doc-filter" class="btn btn-secondary">
            <option value="">All Types</option>
            <option value="Employment">Employment</option>
            <option value="Tax">Tax</option>
            <option value="Financial">Financial</option>
            <option value="Legal">Legal</option>
            <option value="Policy">Policy</option>
          </select>
        </div>
      </div>

      <div class="grid grid-2" id="documents-grid">
        ${documents.map(doc => `
          <div class="document-card" style="border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; ${doc.status === 'pending' ? 'opacity: 0.6;' : ''}">
            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.5rem;">${doc.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              <span class="badge badge-${doc.type === 'Employment' ? 'primary' : doc.type === 'Tax' ? 'warning' : 'secondary'}" style="font-size: 0.65rem;">${doc.type}</span>
              ${doc.issuedDate ? ` • Issued: ${new Date(doc.issuedDate).toLocaleDateString()}` : ''}
            </div>
            <div>
              ${doc.status === 'available'
      ? `<button class="btn btn-sm btn-primary" onclick="window.downloadDocument('${doc.id}', '${doc.name}')">Download</button>
               <button class="btn btn-sm btn-secondary" onclick="window.viewDocument('${doc.id}', '${doc.name}')">View</button>`
      : `<span class="text-muted text-sm">Available upon request</span>`
    }
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <h3 class="mb-4">Request Document</h3>
      <p class="text-muted text-sm mb-4">Need a document that's not listed here? Submit a request to HR.</p>
      <div class="grid grid-3">
        <div class="form-group">
          <label>Document Type</label>
          <select id="request-doc-type">
            <option value="">Select document type</option>
            <option value="bonafide">Bonafide Certificate</option>
            <option value="salary">Salary Certificate</option>
            <option value="experience">Experience Letter</option>
            <option value="relieving">Relieving Letter</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Purpose/Reason</label>
          <input type="text" id="request-purpose" placeholder="e.g., Bank loan, Visa application">
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button class="btn btn-primary w-full" onclick="window.submitDocRequest()">Submit Request</button>
        </div>
      </div>
    </div>
  `;

  return container;
}

// Global handlers
window.downloadDocument = function (docId, docName) {
  // Simulate download
  alert(`✅ Downloading "${docName}"...\n\nIn a real system, this would download the actual PDF document.`);
};

window.viewDocument = function (docId, docName) {
  // Show a modal with document preview
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;';

  modal.innerHTML = `
      <div style="background: white; max-width: 700px; width: 90%; max-height: 80vh; overflow: auto; border-radius: 12px; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border); padding-bottom: 1rem;">
          <h2 style="margin: 0;">${docName}</h2>
          <button onclick="this.closest('.modal-backdrop').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✕</button>
        </div>
        
        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 3rem; text-align: center; color: #64748b;">
          <div style="width: 60px; height: 60px; background: #e2e8f0; border-radius: 8px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #64748b;">PDF</div>
          <h3 style="color: #334155; margin-bottom: 0.5rem;">${docName}</h3>
          <p style="margin-bottom: 1.5rem; font-size: 0.9rem;">Document preview would appear here in a PDF viewer.</p>
          <p style="font-size: 0.75rem; color: #94a3b8;">Document ID: ${docId}</p>
        </div>
        
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="window.downloadDocument('${docId}', '${docName}')">Download PDF</button>
          <button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Close</button>
        </div>
      </div>
    `;

  document.body.appendChild(modal);
};

window.submitDocRequest = function () {
  const docType = document.querySelector('#request-doc-type').value;
  const purpose = document.querySelector('#request-purpose').value;

  if (!docType) {
    alert('Please select a document type');
    return;
  }

  alert(`✅ Document Request Submitted!\n\nType: ${docType}\nPurpose: ${purpose || 'Not specified'}\n\nHR will process your request within 2-3 working days.`);

  // Clear form
  document.querySelector('#request-doc-type').value = '';
  document.querySelector('#request-purpose').value = '';
};
