import { authService } from '../core/auth.js';
import { renderNotificationBell } from './NotificationBell.js';
import { toast } from '../core/toast.js';
import { employeeService } from '../core/employee.js';
import { announcementService } from '../core/announcements.js';

export function renderDashboard(user, onLogout, onNavigate) {
  const container = document.createElement('div');
  container.className = 'dashboard-layout';

  // Sidebar
  const sidebar = createSidebar(user, onLogout, onNavigate);
  container.appendChild(sidebar);

  // Main content
  const content = document.createElement('main');
  content.className = 'main-content';

  // Top Bar
  const topBar = document.createElement('header');
  topBar.style.display = 'flex';
  topBar.style.justifyContent = 'flex-end';
  topBar.style.padding = '1rem 2rem';
  topBar.style.background = 'white';
  topBar.style.borderBottom = '1px solid var(--border)';
  topBar.appendChild(renderNotificationBell());

  content.appendChild(topBar);

  const innerContent = document.createElement('div');
  innerContent.id = 'dashboard-content';
  innerContent.style.padding = '2rem';
  innerContent.appendChild(renderDashboardContent(user, onNavigate));

  content.appendChild(innerContent);

  container.appendChild(content);

  return container;
}

function createSidebar(user, onLogout, onNavigate) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  // Menu items based on role
  const menuItems = getMenuByRole(user.role);

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <div class="logo" style="font-size: 1.75rem; color: var(--primary-lime); font-family: 'Space Grotesk', sans-serif; letter-spacing: -1px; font-weight: 700;">Subix</div>
      </div>
      <div class="text-sm text-muted">${user.name}</div>
      <div class="text-xs text-muted" style="color: var(--primary-lime);">${user.role.replace('_', ' ').toUpperCase()}</div>
    </div>

    <nav class="sidebar-nav" id="sidebar-nav">
      ${menuItems.map(item => `
        <a href="#" class="nav-item ${item.id === 'dashboard' ? 'active' : ''}" data-page="${item.id}">
          ${item.label}
        </a>
      `).join('')}
    </nav>

    <div id="logout-section" style="margin-top: auto; padding: 1rem 0; border-top: 1px solid var(--border); flex-shrink: 0; background: var(--surface);">
      <button class="btn btn-secondary w-full" id="logout-btn" style="margin-bottom: 1rem; display: block !important; visibility: visible !important;">
        LOGOUT
      </button>
      <div style="text-align: center;">
        <p class="text-xs text-muted">developed by <a href="https://www.subix.io/" target="_blank" style="color: var(--primary-lime); text-decoration: none;">Subix Team</a></p>
      </div>
    </div>
  `;

  // Navigation handler
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all
      sidebar.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

      // Add active to clicked
      item.classList.add('active');

      // Navigate
      onNavigate(item.dataset.page);
    });
  });

  // Logout button handler
  const logoutBtn = sidebar.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      onLogout();
    });
  }

  return sidebar;
}

function getMenuByRole(role) {
  const menus = {
    employee: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'employees', label: 'Directory' },
      { id: 'attendance', label: 'Attendance' },
      { id: 'leaves', label: 'Leaves' },
      { id: 'salary', label: 'Salary' },
      { id: 'documents', label: 'Documents' },
      { id: 'performance', label: 'Performance' },
      { id: 'exit', label: 'Resignation' },
      { id: 'profile', label: 'Profile' }
    ],
    manager: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'employees', label: 'Directory' },
      { id: 'team', label: 'My Team' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'attendance', label: 'Attendance' },
      { id: 'leaves', label: 'Leaves' },
      { id: 'performance', label: 'Performance' },
      { id: 'exit', label: 'Exit Approvals' },
      { id: 'profile', label: 'Profile' }
    ],
    hr_admin: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'employees', label: 'Employees' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'attendance', label: 'Attendance' },
      { id: 'leaves', label: 'Leaves' },
      { id: 'shifts', label: 'Shifts & Roster' },
      { id: 'performance', label: 'Performance' },
      { id: 'exit', label: 'Exit & FnF' },
      { id: 'payroll', label: 'Payroll' },
      { id: 'reports', label: 'Reports & Analytics' }
    ],
    super_admin: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'company', label: 'Company' },
      { id: 'employees', label: 'Employees' },
      { id: 'approvals', label: 'Approvals' },
      { id: 'shifts', label: 'Shifts & Roster' },
      { id: 'payroll', label: 'Payroll' },
      { id: 'performance', label: 'Performance' },
      { id: 'exit', label: 'Exit & FnF' },
      { id: 'reports', label: 'Reports & Analytics' },
      { id: 'settings', label: 'Settings' }
    ]
  };

  return menus[role] || menus.employee;
}

export function renderDashboardContent(user, onNavigate) {
  const content = document.createElement('div');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  content.innerHTML = `
    <!-- Hero Section -->
    <div style="
      background: linear-gradient(135deg, rgba(204, 255, 0, 0.15) 0%, rgba(5, 5, 5, 1) 100%);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(204, 255, 0, 0.1);
    ">
      <div style="position: relative; z-index: 2;">
        <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 700;">${greeting}, ${user.name.split(' ')[0]}!</h1>
        <p style="color: var(--text-muted); font-size: 1.1rem; max-width: 600px;">
          Here's what's happening today. You have <span style="color: var(--primary-lime); font-weight: 600;">2 pending approvals</span> and <span style="color: var(--accent-cyan); font-weight: 600;">1 upcoming event</span>.
        </p>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button class="btn btn-primary" data-action="attendance" style="padding: 0.75rem 1.5rem;">
            Record Attendance
          </button>
          <button class="btn btn-secondary" data-action="leave" style="padding: 0.75rem 1.5rem;">
            Apply Leave
          </button>
        </div>
      </div>
      
      <!-- Decorative Elements -->
      <div style="
        position: absolute; 
        right: -50px; 
        top: -50px; 
        width: 300px; 
        height: 300px; 
        background: radial-gradient(circle, rgba(204, 255, 0, 0.1) 0%, transparent 70%); 
        border-radius: 50%;
        filter: blur(40px);
      "></div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-4 mb-6">
      <div class="card stat-card" style="position: relative; overflow: hidden; border: 1px solid var(--border);">
        <div style="position: relative; z-index: 1;">
          <div class="stat-label text-left mb-2">Attendance</div>
          <div class="stat-value text-left" style="font-size: 2rem;">96%</div>
          <div class="text-xs text-muted text-left mt-1">
            <span style="color: var(--success);">↑ 2%</span> vs last month
          </div>
        </div>
      </div>

      <div class="card stat-card" style="position: relative; overflow: hidden; border: 1px solid var(--border);">
        <div style="position: relative; z-index: 1;">
          <div class="stat-label text-left mb-2">Leave Balance</div>
          <div class="stat-value text-left" style="font-size: 2rem;">14</div>
          <div class="text-xs text-muted text-left mt-1">Days Available</div>
        </div>
      </div>

      <div class="card stat-card" style="position: relative; overflow: hidden; border: 1px solid var(--border);">
        <div style="position: relative; z-index: 1;">
          <div class="stat-label text-left mb-2">Upcoming Salary</div>
          <div class="stat-value text-left" style="font-size: 2rem;">₹45k</div>
          <div class="text-xs text-muted text-left mt-1">Expected: Jan 31</div>
        </div>
      </div>

      <div class="card stat-card" style="position: relative; overflow: hidden; border: 1px solid var(--border);">
        <div style="position: relative; z-index: 1;">
          <div class="stat-label text-left mb-2">Projects</div>
          <div class="stat-value text-left" style="font-size: 2rem;">3</div>
          <div class="text-xs text-muted text-left mt-1">Active Tasks</div>
        </div>
      </div>
    </div>

    <!-- Main Content Layout (2 Columns) -->
    <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
      
      <!-- Left Column -->
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        
        <!-- Recent Activity -->
        <div class="card">
          <div class="flex justify-between items-center mb-6">
            <h3 class="card-title" style="font-size: 1.25rem;">Recent Activity</h3>
            <button class="btn btn-sm btn-text">View All</button>
          </div>
          <div class="activity-timeline">
            ${getRecentActivityHTML()}
          </div>
        </div>

        <!-- Directory Preview -->
        <div class="card">
          <div class="flex justify-between items-center mb-6">
            <h3 class="card-title" style="font-size: 1.25rem;">My Team</h3>
            <button class="btn btn-sm btn-text" data-action="directory">View All</button>
          </div>
          <div class="employee-grid-preview" id="employee-directory-preview">
            <div class="text-muted text-center py-4">Loading...</div>
          </div>
        </div>

      </div>

      <!-- Right Column -->
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        
        <!-- Announcements Widget -->
        <div class="card" style="background: linear-gradient(180deg, var(--surface) 0%, rgba(204, 255, 0, 0.02) 100%);">
          <div class="flex justify-between items-center mb-4">
             <h3 class="card-title" style="font-size: 1.1rem;">Announcements</h3>
             <button class="btn btn-icon btn-sm" data-action="announcements">➔</button>
          </div>
          <div id="announcements-preview">
            <div class="text-muted text-center py-4 text-sm">Loading...</div>
          </div>
        </div>

        <!-- Birthdays Widget -->
        <div class="card">
          <h3 class="card-title mb-4" style="font-size: 1.1rem;">Birthdays</h3>
          <div id="birthdays-list">
            <div class="text-muted text-center py-4 text-sm">Loading...</div>
          </div>
        </div>

        <!-- Work Anniversaries Widget -->
        <div class="card">
          <h3 class="card-title mb-4" style="font-size: 1.1rem;">Work Anniversaries</h3>
          <div id="anniversaries-list">
            <div class="text-muted text-center py-4 text-sm">Loading...</div>
          </div>
        </div>

      </div>
    
    </div>
  `;

  // Add event listeners (re-attaching safely)
  setTimeout(() => {
    // Directory button
    const dirBtn = content.querySelector('[data-action="directory"]');
    if (dirBtn) {
      dirBtn.addEventListener('click', () => {
        onNavigate('employees');
      });
    }

    // View Employee Buttons
    content.querySelectorAll('.view-employee-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const employeeId = e.currentTarget.dataset.id;
        const employee = await employeeService.getEmployee(employeeId);
        if (employee) {
          showEmployeeModal(employee);
        }
      });
    });

    // Load async data
    loadDashboardAsyncData(content);

    // Announcements button
    const annBtn = content.querySelector('[data-action="announcements"]');
    if (annBtn) {
      annBtn.addEventListener('click', () => {
        onNavigate('announcements');
      });
    }

    // Quick Actions
    const actionButtons = content.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const sidebar = document.querySelector('.sidebar');

        if (sidebar) {
          sidebar.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
          const pageName = action === 'leave' ? 'leaves' : action === 'payslip' ? 'salary' : action;
          const targetNav = sidebar.querySelector(`[data-page="${pageName}"]`);
          if (targetNav) targetNav.classList.add('active');
        }

        if (action === 'attendance') {
          onNavigate('attendance');
          toast.info('Opening Attendance Module...');
        } else if (action === 'leave') {
          onNavigate('leaves');
          toast.info('Opening Leave Management...');
        } else if (action === 'payslip') {
          onNavigate('salary');
          toast.info('Opening Salary & Payslips...');
        }
      });
    });
  }, 0);

  return content;
}

function showEmployeeModal(employee) {
  // Check if modal already exists
  let modal = document.getElementById('employee-modal');
  if (modal) {
    modal.remove();
  }

  modal = document.createElement('div');
  modal.id = 'employee-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';
  modal.style.backdropFilter = 'blur(5px)';

  modal.innerHTML = `
    <div class="card" style="width: 400px; max-width: 90%; position: relative; padding: 0; overflow: hidden; animation: slideIn 0.3s ease-out;">
      <button id="close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; z-index: 10;">✕</button>
      
      <!-- Header / Cover -->
      <div style="height: 120px; background: linear-gradient(135deg, var(--primary-lime), var(--accent-cyan)); position: relative;">
        <div style="position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%);">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--surface); border: 4px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--text-main); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            ${employee.name.charAt(0)}
          </div>
        </div>
      </div>

      <div style="padding: 3rem 1.5rem 1.5rem; text-align: center;">
        <h2 style="margin-bottom: 0.25rem;">${employee.name}</h2>
        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 1rem;">${employee.designation} • ${employee.department}</p>
        
        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem;">
          <span class="badge badge-success">Active</span>
          <span class="badge badge-primary">${employee.role || 'Employee'}</span>
        </div>

        <div style="text-align: left; display: grid; gap: 1rem; background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.2rem;">📧</span>
            <div>
              <div class="text-xs text-muted">Email</div>
              <div style="font-weight: 500;">${employee.email}</div>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.2rem;">📞</span>
            <div>
              <div class="text-xs text-muted">Phone</div>
              <div style="font-weight: 500;">${employee.mobile || '+91 98765 43210'}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.2rem;">🆔</span>
            <div>
              <div class="text-xs text-muted">Employee ID</div>
              <div style="font-weight: 500;">${employee.employeeId || 'EMP001'}</div>
            </div>
          </div>
        </div>

         <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
          <button class="btn btn-primary w-full" onclick="window.location.href='mailto:${employee.email}'">Email</button>
          <button class="btn btn-secondary w-full" onclick="alert('Calling feature coming soon!')">Call</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handler
  modal.querySelector('#close-modal').addEventListener('click', () => {
    modal.remove();
  });

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Add animation keyframe if not exists
  if (!document.querySelector('#modal-animation')) {
    const style = document.createElement('style');
    style.id = 'modal-animation';
    style.innerHTML = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
}

function getRecentActivityHTML() {
  const activities = [
    { icon: '✅', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', title: 'Marked Attendance', time: 'Today, 09:30 AM', desc: 'Punched in from Web Dashboard' },
    { icon: '📅', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', title: 'Leave Request', time: 'Yesterday, 4:00 PM', desc: 'Sick Leave request submitted' },
    { icon: '💰', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', title: 'Salary Credited', time: 'Dec 31, 2025', desc: 'Salary for December 2025' },
    { icon: '🚀', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', title: 'Project Update', time: 'Dec 28, 2025', desc: 'Completed Q4 Goals' }
  ];

  return activities.map((item, index) => `
    <div class="timeline-item" style="display: flex; gap: 1rem; position: relative; padding-bottom: 2rem;">
      ${index !== activities.length - 1 ? '<div style="position: absolute; left: 1.25rem; top: 2.5rem; bottom: 0; width: 2px; background: var(--border);"></div>' : ''}
      <div class="timeline-icon" style="min-width: 2.5rem; height: 2.5rem; border-radius: 50%; background: ${item.bg}; color: ${item.color}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 1;">
        ${item.icon}
      </div>
      <div class="timeline-content" style="flex: 1; padding-top: 0.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">${item.title}</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted); padding-top: 0.25rem;">${item.time}</span>
        </div>
        <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: var(--text-muted);">${item.desc}</p>
      </div>
    </div>
  `).join('');
}

async function loadDashboardAsyncData(content) {
  try {
    // Load employees
    const employees = await employeeService.getEmployees({ status: 'active' });
    const empPreview = content.querySelector('#employee-directory-preview');
    if (empPreview) {
      if (employees.length === 0) {
        empPreview.innerHTML = '<div class="text-muted text-center py-4">No active employees found</div>';
      } else {
        empPreview.innerHTML = `<div style="display: grid; gap: 1rem;">${employees.slice(0, 5).map(emp => `
          <div class="employee-row" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-hover); border-radius: 12px; transition: transform 0.2s;">
            <div class="avatar" style="width: 3rem; height: 3rem; background: var(--primary-gradient); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; border: 2px solid var(--surface);">
              ${emp.name.charAt(0)}${emp.name.split(' ')[1] ? emp.name.split(' ')[1].charAt(0) : ''}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 1rem;">${emp.name}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${emp.designation || 'Employee'}</div>
            </div>
            <button class="btn btn-sm view-employee-btn" data-id="${emp.id}" style="background: transparent; color: var(--primary-lime); border: 1px solid var(--primary-lime); font-size: 0.8rem; padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 600;">View</button>
          </div>
        `).join('')}</div>`;

        // Re-attach view employee listeners
        empPreview.querySelectorAll('.view-employee-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const employeeId = e.currentTarget.dataset.id;
            const employee = await employeeService.getEmployee(employeeId);
            if (employee) showEmployeeModal(employee);
          });
        });
      }
    }

    // Load announcements
    const anns = await announcementService.getAnnouncements({ active: true });
    const annPreview = content.querySelector('#announcements-preview');
    if (annPreview) {
      if (!anns || anns.length === 0) {
        annPreview.innerHTML = '<div class="text-muted text-center py-4 text-sm">No announcements</div>';
      } else {
        annPreview.innerHTML = anns.slice(0, 3).map(a => `
          <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
            <div class="font-bold text-sm mb-1">${a.title}</div>
            <div class="text-xs text-muted flex justify-between">
              <span>${a.category}</span>
              <span>${new Date(a.publishDate).toLocaleDateString()}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Load birthdays
    const birthdays = await announcementService.getBirthdays(7);
    const bdayList = content.querySelector('#birthdays-list');
    if (bdayList) {
      if (!birthdays || birthdays.length === 0) {
        bdayList.innerHTML = '<div class="text-muted text-center py-4 text-sm">No upcoming birthdays</div>';
      } else {
        bdayList.innerHTML = birthdays.slice(0, 3).map(b => `
          <div class="flex items-center gap-3 mb-3 last:mb-0 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div style="font-size: 1.5rem;">${b.isToday ? '🎂' : '🎈'}</div>
            <div>
              <div class="font-medium text-sm">${b.name}</div>
              <div class="text-xs text-muted">${b.isToday ? 'Today' : `In ${b.daysUntil} days`}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // Load anniversaries
    const anniversaries = await announcementService.getAnniversaries(7);
    const annList = content.querySelector('#anniversaries-list');
    if (annList) {
      if (!anniversaries || anniversaries.length === 0) {
        annList.innerHTML = '<div class="text-muted text-center py-4 text-sm">No upcoming anniversaries</div>';
      } else {
        annList.innerHTML = anniversaries.slice(0, 3).map(a => `
          <div class="flex items-center gap-3 mb-3 last:mb-0 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div style="font-size: 1.5rem;">${a.isToday ? '🎊' : '🏅'}</div>
            <div>
              <div class="font-medium text-sm">${a.name}</div>
              <div class="text-xs text-muted">${a.years} Year${a.years > 1 ? 's' : ''} • ${a.isToday ? 'Today' : `In ${a.daysUntil} days`}</div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading dashboard async data:', error);
  }
}


