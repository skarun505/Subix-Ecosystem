import './style.css';
import { authService } from './core/auth.js';
import { initializeSeedData } from './data/seedData.js';
import { generateDemoData, isDemoDataGenerated } from './data/demoData.js';
import { renderLogin } from './modules/Login.js';
import { renderDashboard, renderDashboardContent } from './modules/Dashboard.js';
import { renderCompanySettings } from './modules/CompanySettings.js';
import { renderOrganization } from './modules/Organization.js';
import { renderHolidays } from './modules/Holidays.js';
import { renderEmployeeDirectory } from './modules/EmployeeDirectory.js';
import { renderEmployeeDetail } from './modules/EmployeeDetail.js';
import { renderBiometricConfig } from './modules/BiometricConfig.js';
import { renderAttendanceDashboard } from './modules/AttendanceDashboard.js';
import { renderLeaveDashboard } from './modules/LeaveDashboard.js';
import { renderShiftManagement } from './modules/ShiftManagement.js';
import { renderPayrollDashboard } from './modules/PayrollDashboard.js';
import { renderPayslipDocument } from './modules/PayslipDocument.js';
import { renderPayslipList } from './modules/PayslipList.js';
import { renderApprovalDashboard } from './modules/ApprovalDashboard.js';
import { renderPerformanceDashboard } from './modules/PerformanceDashboard.js';
import { renderExitDashboard } from './modules/ExitDashboard.js';
import { renderReportDashboard } from './modules/ReportDashboard.js';
import { renderDocuments } from './modules/Documents.js';
import { renderProfile } from './modules/Profile.js';
import { renderMyTeam } from './modules/MyTeam.js';
import { renderAnnouncements } from './modules/Announcements.js';
import { initializeAppShortcuts } from './core/shortcuts.js';

// Global error handler for script execution
window.onerror = function (msg, url, line, col, error) {
  document.body.innerHTML = `
    <div style="background: #000; color: #ff5555; padding: 20px; font-family: monospace; z-index: 99999; position: fixed; top: 0; left: 0; width: 100%; height: 100%;">
      <h1>CRITICAL ERROR</h1>
      <p>${msg}</p>
      <p>Line: ${line}, Col: ${col}</p>
      <pre>${error ? error.stack : ''}</pre>
      <button onclick="sessionStorage.clear(); window.location.reload();" style="padding: 10px; margin-top: 20px; background: #333; color: white; border: 1px solid #555; cursor: pointer;">RESET APP DATA</button>
    </div>
  `;
  fetch('http://localhost:9998', { method: 'POST', body: 'ONERROR: ' + msg + ' | ' + (error ? error.stack : '') });
};

const app = document.querySelector('#app');
let currentUser = null;

// Helper to update sidebar active state
function updateSidebarActive(pageId) {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const targetNav = sidebar.querySelector(`[data-page="${pageId}"]`);
    if (targetNav) targetNav.classList.add('active');
  }
}

// Render settings page with tabs for Module 2
function renderSettingsPage() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
      <p class="page-subtitle">Manage company configuration and organizational structure</p>
    </div>
    <div class="card mb-4">
      <nav class="nav" style="display: flex; gap: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 1.5rem;">
        <button class="nav-item active" data-tab="company">Company Settings</button>
        <button class="nav-item" data-tab="organization">Organization</button>
        <button class="nav-item" data-tab="holidays">Holidays</button>
        <button class="nav-item" data-tab="biometric">Biometric Device</button>
      </nav>
      <div id="tab-content"></div>
    </div>
  `;

  const tabContent = container.querySelector('#tab-content');
  const navItems = container.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      const tab = item.dataset.tab;
      tabContent.innerHTML = '';
      if (tab === 'company') tabContent.appendChild(renderCompanySettings());
      else if (tab === 'organization') tabContent.appendChild(renderOrganization());
      else if (tab === 'holidays') tabContent.appendChild(renderHolidays());
      else if (tab === 'biometric') tabContent.appendChild(renderBiometricConfig());
    });
  });

  tabContent.appendChild(renderCompanySettings());
  return container;
}

// Handle navigation
function handleNavigation(page) {
  const content = document.querySelector('#dashboard-content');
  if (!content) return;

  sessionStorage.setItem('hrms_current_page', page);
  content.innerHTML = '';

  try {
    switch (page) {
      case 'dashboard':
        content.appendChild(renderDashboardContent(currentUser, handleNavigation));
        break;
      case 'attendance':
        content.appendChild(renderAttendanceDashboard());
        break;
      case 'leaves':
        content.appendChild(renderLeaveDashboard());
        break;
      case 'shifts':
        content.appendChild(renderShiftManagement());
        break;
      case 'salary':
        content.appendChild(renderPayslipList());
        break;
      case 'documents':
        content.appendChild(renderDocuments());
        break;
      case 'profile':
        content.appendChild(renderProfile());
        break;
      case 'performance':
        content.appendChild(renderPerformanceDashboard());
        break;
      case 'exit':
        content.appendChild(renderExitDashboard());
        break;
      case 'employees':
        content.appendChild(renderEmployeeDirectory());
        break;
      case 'payroll':
        content.appendChild(renderPayrollDashboard());
        break;
      case 'reports':
        content.appendChild(renderReportDashboard());
        break;
      case 'settings':
        content.appendChild(renderSettingsPage());
        break;
      case 'company':
        content.appendChild(renderCompanySettings());
        break;
      case 'team':
        content.appendChild(renderMyTeam());
        break;
      case 'approvals':
        content.appendChild(renderApprovalDashboard());
        break;
      case 'announcements':
        content.appendChild(renderAnnouncements());
        break;
      default:
        if (page.startsWith('payslip/')) {
          const payslipId = page.substring(8);
          content.appendChild(renderPayslipDocument(payslipId));
        } else {
          content.innerHTML = `<div class="p-4">Page Not Found: ${page}</div>`;
        }
    }

    updateSidebarActive(page);

  } catch (e) {
    console.error(`Navigation error for page ${page}:`, e);
    content.innerHTML = `<div class="alert alert-danger">Error loading page: ${e.message}</div>`;
  }
}

// Handle successful login
function handleLogin(user) {
  currentUser = user;
  showDashboard();
}

// Handle logout
async function handleLogout() {
  currentUser = null;
  // ✅ authService.logout() calls supabase.signOut() + redirects to accounts.subix.in
  await authService.logout();
}

// Shpw native Login page for HRMS app
function showLogin() {
  app.innerHTML = '';
  app.appendChild(renderLogin(handleLogin));
}

// Show dashboard
function showDashboard() {
  try {
    app.innerHTML = '';
    // Use the comprehensive dashboard renderer
    const dashboard = renderDashboard(currentUser, handleLogout, handleNavigation);
    app.appendChild(dashboard);

    // Initialize keyboard shortcuts
    initializeAppShortcuts(handleNavigation, handleLogout);

  } catch (e) {
    console.error('Dashboard render error:', e);
    app.innerHTML = `<div style="padding: 2rem; color: white;">Error rendering dashboard: ${e.message}</div>`;
    fetch('http://localhost:9998', { method: 'POST', body: 'DASHBOARD_ERROR: ' + e.message + ' | ' + e.stack });
  }
}

// Main Bootstrap Function
async function bootstrap() {
  try {
    console.log('Starting HRMS bootstrap (Subix Accounts SSO)...');

    // 1. Load & verify Supabase session
    await authService.loadSession();

    if (!authService.isAuthenticated()) {
      // ✅ Not logged in — redirect to central accounts login
      console.log('No active session. Redirecting to accounts.subix.in...');
      showLogin();
      return;
    }

    // 2. Get the user from the session
    currentUser = authService.getCurrentUser();
    console.log('✅ Authenticated as:', currentUser?.name);

    // 3. Initialize app data (non-blocking)
    try {
      await initializeSeedData();
      const demoGenerated = await isDemoDataGenerated();
      if (!demoGenerated) {
        await generateDemoData();
      }
    } catch (seedError) {
      console.warn('Seed data error (non-fatal):', seedError);
    }

    // 4. Show dashboard
    showDashboard();

  } catch (error) {
    console.error('Bootstrap error:', error);
    fetch('http://localhost:9998', { method: 'POST', body: 'BOOTSTRAP_ERROR: ' + error.message + ' | ' + error.stack });
    throw error;
  }
}

// Expose logout handler globally
window.handleLogoutClick = async function () {
  await handleLogout();
};

// Start application
console.log('Executing main.js...');
bootstrap();
