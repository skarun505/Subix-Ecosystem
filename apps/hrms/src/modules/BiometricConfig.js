import { biometricService } from '../core/biometric.js';
import { employeeService } from '../core/employee.js';

export function renderBiometricConfig() {
  const container = document.createElement('div');
  container.innerHTML = '<div class="text-muted text-center py-8">Loading configuration...</div>';
  loadBiometricConfig(container);
  return container;
}

async function loadBiometricConfig(container) {
  const config = await biometricService.getDeviceConfig();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Biometric Device Integration</h1>
      <p class="page-subtitle">Configure and manage biometric attendance devices</p>
    </div>

    <div class="grid grid-2 mb-6">
      <!-- Device Configuration -->
      <div class="card">
        <h3 class="mb-4">Device Configuration</h3>
        <form id="device-config-form">
          <div class="form-group">
            <label>Enable Biometric Integration</label>
            <select id="enabled">
              <option value="true" ${config.enabled ? 'selected' : ''}>Enabled</option>
              <option value="false" ${!config.enabled ? 'selected' : ''}>Disabled</option>
            </select>
          </div>

          <div class="form-group">
            <label>Device Type</label>
            <select id="deviceType">
              <option value="zkteco" ${config.deviceType === 'zkteco' ? 'selected' : ''}>ZKTeco (Default)</option>
              <option value="essl" ${config.deviceType === 'essl' ? 'selected' : ''}>eSSL</option>
              <option value="realtime" ${config.deviceType === 'realtime' ? 'selected' : ''}>Realtime</option>
              <option value="suprema" ${config.deviceType === 'suprema' ? 'selected' : ''}>Suprema</option>
              <option value="generic" ${config.deviceType === 'generic' ? 'selected' : ''}>Generic CSV</option>
            </select>
            <small class="text-muted">Select your biometric device brand</small>
          </div>

          <div class="form-group">
            <label>Connection Type</label>
            <select id="connectionType">
              <option value="usb" ${config.connectionType === 'usb' ? 'selected' : ''}>USB Connection</option>
              <option value="network" ${config.connectionType === 'network' ? 'selected' : ''}>Network (TCP/IP)</option>
              <option value="cloud" ${config.connectionType === 'cloud' ? 'selected' : ''}>Cloud API</option>
            </select>
          </div>

          <div id="network-config" style="display: ${config.connectionType === 'network' ? 'block' : 'none'};">
            <div class="form-group">
              <label>Device IP Address</label>
              <input type="text" id="deviceIP" value="${config.deviceIP || ''}" placeholder="192.168.1.100" />
            </div>

            <div class="form-group">
              <label>Device Port</label>
              <input type="number" id="devicePort" value="${config.devicePort || 4370}" />
            </div>
          </div>

          <div class="form-group">
            <label>Auto Sync Interval (seconds)</label>
            <input type="number" id="syncInterval" value="${config.syncInterval || 60}" min="30" max="3600" />
            <small class="text-muted">How often to fetch data from device</small>
          </div>

          <div class="form-group">
            <label>Auto Sync</label>
            <select id="autoSync">
              <option value="true" ${config.autoSync ? 'selected' : ''}>Enabled</option>
              <option value="false" ${!config.autoSync ? 'selected' : ''}>Disabled</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary">Save Configuration</button>
        </form>

        ${config.lastSyncTime ? `
          <div class="mt-4 p-3" style="background: var(--bg-secondary); border-radius: 6px;">
            <div class="text-xs text-muted">Last Sync:</div>
            <div class="font-medium">${new Date(config.lastSyncTime).toLocaleString()}</div>
          </div>
        ` : ''}
      </div>

      <!-- Import Data -->
      <div class="card">
        <h3 class="mb-4">Import Attendance Data</h3>
        
        <div class="alert alert-success mb-4">
          <strong>✓ Biometric Integration Active</strong><br/>
          Your device logs will be automatically parsed and processed.
        </div>

        <div class="mb-4">
          <h4 class="mb-2">Method 1: Paste Device Logs</h4>
          <p class="text-sm text-muted mb-3">Copy logs from device software and paste below</p>
          <textarea id="log-data" rows="8" placeholder="Paste your biometric device logs here...
Example (ZKTeco):
E001,2024-12-30 09:15:00,0,Device1
E001,2024-12-30 18:30:00,1,Device1"></textarea>
          <button class="btn btn-primary mt-2 w-full" id="import-logs-btn">Import & Process Logs</button>
        </div>

        <div class="mb-4">
          <h4 class="mb-2">Method 2: Upload CSV File</h4>
          <input type="file" id="file-upload" accept=".csv,.txt" class="w-full" />
          <button class="btn btn-secondary mt-2 w-full" id="upload-btn">Upload File</button>
        </div>

        <div class="mb-4">
          <h4 class="mb-2">Method 3: Generate Test Data</h4>
          <p class="text-sm text-muted mb-3">Auto-generate sample attendance for testing</p>
          <button class="btn btn-secondary w-full" id="generate-sample-btn">Generate Sample Data (7 Days)</button>
        </div>

        <div id="import-result" class="mt-4" style="display: none;"></div>
      </div>
    </div>

    <!-- Supported Formats -->
    <div class="card">
      <h3 class="mb-4">Supported Device Formats</h3>
      <div class="grid grid-2">
        <div>
          <h4 class="mb-2">ZKTeco Format</h4>
          <pre class="text-xs p-3" style="background: var(--bg-secondary); border-radius: 4px; overflow-x: auto;">EmployeeID,DateTime,Status,DeviceID
E001,2024-12-30 09:15:00,0,Device1
E001,2024-12-30 18:30:00,1,Device1

Status: 0=In, 1=Out</pre>
        </div>

        <div>
          <h4 class="mb-2">eSSL Format</h4>
          <pre class="text-xs p-3" style="background: var(--bg-secondary); border-radius: 4px; overflow-x: auto;">ID    DateTime            Type
E001  2024-12-30 09:15:00 IN
E001  2024-12-30 18:30:00 OUT</pre>
        </div>

        <div>
          <h4 class="mb-2">Generic CSV</h4>
          <pre class="text-xs p-3" style="background: var(--bg-secondary); border-radius: 4px; overflow-x: auto;">EmployeeID,Date,Time,Type
E001,2024-12-30,09:15:00,IN
E001,2024-12-30,18:30:00,OUT</pre>
        </div>

        <div>
          <h4 class="mb-2">Realtime Format</h4>
          <pre class="text-xs p-3" style="background: var(--bg-secondary); border-radius: 4px; overflow-x: auto;">Same as ZKTeco format
Supports Check-in/out
Break-in/out tracking</pre>
        </div>
      </div>
    </div>
  `;

  // Show/hide network config based on connection type
  const connectionSelect = container.querySelector('#connectionType');
  const networkConfig = container.querySelector('#network-config');

  connectionSelect.addEventListener('change', () => {
    networkConfig.style.display = connectionSelect.value === 'network' ? 'block' : 'none';
  });

  // Handle config form submit
  const configForm = container.querySelector('#device-config-form');
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newConfig = {
      enabled: container.querySelector('#enabled').value === 'true',
      deviceType: container.querySelector('#deviceType').value,
      connectionType: container.querySelector('#connectionType').value,
      deviceIP: container.querySelector('#deviceIP').value,
      devicePort: parseInt(container.querySelector('#devicePort').value),
      syncInterval: parseInt(container.querySelector('#syncInterval').value),
      autoSync: container.querySelector('#autoSync').value === 'true'
    };

    await biometricService.updateDeviceConfig(newConfig);
    alert('Device configuration saved successfully!');
  });

  // Handle import logs
  const importBtn = container.querySelector('#import-logs-btn');
  importBtn.addEventListener('click', async () => {
    const logData = container.querySelector('#log-data').value.trim();

    if (!logData) {
      alert('Please paste device logs first');
      return;
    }

    importBtn.disabled = true;
    importBtn.textContent = 'Processing...';

    try {
      const result = await biometricService.importBiometricLogs(logData);
      showImportResult(container, result);
      container.querySelector('#log-data').value = '';
    } catch (error) {
      showImportResult(container, { success: false, message: error.message });
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = 'Import & Process Logs';
    }
  });

  // Handle file upload
  const uploadBtn = container.querySelector('#upload-btn');
  uploadBtn.addEventListener('click', () => {
    const fileInput = container.querySelector('#file-upload');
    const file = fileInput.files[0];

    if (!file) {
      alert('Please select a file first');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Processing...';

      try {
        const result = await biometricService.importBiometricLogs(content);
        showImportResult(container, result);
        fileInput.value = '';
      } catch (error) {
        showImportResult(container, { success: false, message: error.message });
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload File';
      }
    };

    reader.readAsText(file);
  });

  // Generate sample data
  const generateBtn = container.querySelector('#generate-sample-btn');
  generateBtn.addEventListener('click', async () => {
    const employees = await employeeService.getEmployees({ status: 'active' });
    const employeeIds = employees.map(e => e.employeeId).slice(0, 5);

    if (employeeIds.length === 0) {
      alert('No active employees found. Please add employees first.');
      return;
    }

    const sampleData = await biometricService.generateSampleData(employeeIds, 7);

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      const result = await biometricService.importBiometricLogs(sampleData);
      showImportResult(container, result);
    } catch (error) {
      showImportResult(container, { success: false, message: error.message });
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Sample Data (7 Days)';
    }
  });
}

function showImportResult(container, result) {
  const resultDiv = container.querySelector('#import-result');

  if (result.success) {
    resultDiv.innerHTML = `
      <div class="alert alert-success">
        <strong>✓ Import Successful!</strong><br/>
        Imported: <strong>${result.imported}</strong> attendance records<br/>
        Total logs: ${result.total}<br/>
        ${result.errors ? `<br/><strong>Errors:</strong><br/>${result.errors.join('<br/>')}` : ''}
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div class="alert alert-error">
        <strong>❌ Import Failed</strong><br/>
        ${result.message || 'Unknown error'}
      </div>
    `;
  }

  resultDiv.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    resultDiv.style.display = 'none';
  }, 5000);
}
