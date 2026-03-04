import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';
import { leaveService } from '../core/leave.js';

export function renderProfile() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();

  // Show loading first, then load async data
  container.innerHTML = '<div class="text-muted text-center py-8">Loading profile...</div>';

  loadProfileData(container, currentUser);
  return container;
}

async function loadProfileData(container, currentUser) {
  // Get employee data
  const employee = await employeeService.getEmployee(currentUser.userId) || {};

  // Get leave balance
  const leaveBalance = await leaveService.getLeaveBalance(currentUser.userId);
  const userLeave = leaveBalance || {
    casual: { total: 12, used: 3, balance: 9 },
    sick: { total: 10, used: 2, balance: 8 },
    privilege: { total: 15, used: 5, balance: 10 }
  };

  // Calculate experience
  const joiningDate = new Date(employee.joiningDate || '2023-01-15');
  const today = new Date();
  const experienceMonths = Math.floor((today - joiningDate) / (1000 * 60 * 60 * 24 * 30));
  const experienceYears = Math.floor(experienceMonths / 12);
  const remainingMonths = experienceMonths % 12;

  // Render HTML
  container.innerHTML = `
    <!-- Cover Section -->
    <div style="position: relative; margin-bottom: 5rem;">
      <div style="
        height: 240px; 
        background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(5, 5, 5, 1) 100%);
        border-radius: 20px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border);
      ">
        <div style="
          position: absolute; 
          inset: 0; 
          background-image: radial-gradient(circle at 10% 20%, rgba(204, 255, 0, 0.05) 0%, transparent 20%);
        "></div>
        <!-- Edit Cover Button (Mock) -->
        <button class="btn btn-secondary btn-sm" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.1);">
          <i class="fas fa-camera"></i> Change Cover
        </button>
      </div>
      
      <!-- Profile Header Info Overlay -->
      <div style="position: absolute; bottom: -60px; left: 40px; display: flex; align-items: end; gap: 2rem;">
        <!-- Avatar -->
        <div style="
          width: 160px; 
          height: 160px; 
          border-radius: 50%; 
          background: var(--surface); 
          border: 4px solid var(--bg-ultra-dark); 
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: var(--primary-lime);
          text-shadow: 0 0 20px rgba(204, 255, 0, 0.3);
          position: relative;
          z-index: 2;
        ">
          ${employee.name ? employee.name.charAt(0).toUpperCase() : 'U'}
          <div style="
            position: absolute; 
            bottom: 10px; 
            right: 10px; 
            width: 24px; 
            height: 24px; 
            background: var(--success); 
            border: 4px solid var(--surface); 
            border-radius: 50%;
          "></div>
        </div>
        
        <!-- Name & Desig -->
        <div style="padding-bottom: 20px; z-index: 1;">
          <h1 style="margin: 0; font-size: 2.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${employee.name || 'User Profile'}</h1>
          <p class="text-muted" style="font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
            ${employee.designation || 'Designation'} 
            <span style="opacity: 0.5;">•</span> 
            <span style="color: var(--primary-lime);">${employee.department || 'Department'}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid" style="grid-template-columns: 320px 1fr; gap: 2rem; align-items: start;">
      
      <!-- Left Sidebar -->
      <div class="flex-col gap-4">
        
        <!-- Status Card -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">At a Glance</h3>
          
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="text-muted">Status</span>
              <span class="badge badge-success">Active</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="text-muted">Employee ID</span>
              <span style="font-family: monospace; font-size: 1.1rem; color: var(--text-main);">${employee.employeeId || currentUser.userId}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="text-muted">Location</span>
              <span style="text-align: right;">${employee.location || 'Bangalore'}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="text-muted">Manager</span>
              <span style="text-align: right;">${employee.manager || 'Sarah Connor'}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
               <span class="text-muted">Tenure</span>
              <span style="text-align: right;">${experienceYears}Y ${remainingMonths}M</span>
            </div>
          </div>

          <button class="btn btn-secondary w-full mt-4" onclick="window.editProfile()">
            Edit Profile
          </button>
        </div>

        <!-- Leave Summary Mini -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1rem; margin-bottom: 1rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Leave Balance</h3>
          
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span class="text-xs text-muted">Casual</span>
              <span class="text-xs font-bold">${userLeave.casual?.balance || 0} left</span>
            </div>
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
              <div style="height: 100%; width: ${((userLeave.casual?.balance || 0) / (userLeave.casual?.total || 1)) * 100}%; background: var(--primary-lime); border-radius: 2px;"></div>
            </div>
          </div>

          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span class="text-xs text-muted">Sick</span>
              <span class="text-xs font-bold">${userLeave.sick?.balance || 0} left</span>
            </div>
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
              <div style="height: 100%; width: ${((userLeave.sick?.balance || 0) / (userLeave.sick?.total || 1)) * 100}%; background: var(--warning); border-radius: 2px;"></div>
            </div>
          </div>
          
           <div style="margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span class="text-xs text-muted">Privilege</span>
              <span class="text-xs font-bold">${userLeave.privilege?.balance || 0} left</span>
            </div>
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
              <div style="height: 100%; width: ${((userLeave.privilege?.balance || 0) / (userLeave.privilege?.total || 1)) * 100}%; background: var(--accent-cyan); border-radius: 2px;"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Content Tabs -->
      <div class="card" style="min-height: 500px; padding: 0; overflow: hidden;">
        <!-- Tabs Header -->
        <div class="tabs-header" style="
          display: flex; 
          border-bottom: 1px solid var(--border); 
          background: rgba(0,0,0,0.2);
          padding: 0 1rem;
        ">
          <button class="tab-btn active" data-tab="personal" style="
            padding: 1.25rem 1.5rem;
            background: none;
            border: none;
            color: var(--text-muted);
            font-weight: 500;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-heading);
          ">Personal</button>
          
          <button class="tab-btn" data-tab="employment" style="
            padding: 1.25rem 1.5rem;
            background: none;
            border: none;
            color: var(--text-muted);
            font-weight: 500;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-heading);
          ">Employment</button>
          
          <button class="tab-btn" data-tab="financial" style="
            padding: 1.25rem 1.5rem;
            background: none;
            border: none;
            color: var(--text-muted);
            font-weight: 500;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
             font-family: var(--font-heading);
          ">Financial</button>

          <button class="tab-btn" data-tab="documents" style="
            padding: 1.25rem 1.5rem;
            background: none;
            border: none;
            color: var(--text-muted);
            font-weight: 500;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
             font-family: var(--font-heading);
          ">Documents</button>
        </div>

        <!-- Tab Content Area -->
        <div id="tab-content-area" style="padding: 2rem;">
          <!-- Content injected via JS -->
        </div>

        <!-- Inline Styles for Active Tab (since we can't easily rely on external CSS for this dynamic part) -->
        <style>
          .tab-btn.active {
            color: var(--primary-lime) !important;
            border-bottom-color: var(--primary-lime) !important;
          }
          .tab-btn:hover {
            color: var(--text-main);
            background: rgba(255,255,255,0.02);
          }
           @media (max-width: 900px) {
            .grid { grid-template-columns: 1fr !important; }
            .profile-header-info { text-align: center; left: 0; right: 0; bottom: -80px; align-items: center; justify-content: center; flex-direction: column; }
          }
        </style>
      </div>

    </div>
  `;

  // Content Builders
  const buildAttributeRow = (label, value, icon = '') => `
    <div style="
      padding: 1rem; 
      background: var(--bg-secondary); 
      border-radius: 8px; 
      border: 1px solid transparent; 
      transition: border-color 0.2s;
      position: relative;
    " onmouseover="this.style.borderColor='var(--border)'" onmouseout="this.style.borderColor='transparent'">
      <div class="text-sm text-muted" style="margin-bottom: 0.25rem;">${label}</div>
      <div style="font-weight: 600; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
        ${icon ? `<span style="opacity: 0.5;">${icon}</span>` : ''} ${value}
      </div>
    </div>
  `;

  const tabsContent = {
    personal: `
      <div class="grid grid-2 gap-4">
        ${buildAttributeRow('Full Name', employee.name || 'Not provided')}
        ${buildAttributeRow('Email Address', employee.email || currentUser.email || 'Not provided')}
        ${buildAttributeRow('Mobile Number', employee.mobile || '+91 98765 43210')}
        ${buildAttributeRow('Date of Birth', employee.dob || 'January 15, 1995')}
        ${buildAttributeRow('Gender', employee.gender || 'Male')}
        ${buildAttributeRow('Blood Group', employee.bloodGroup || 'O+')}
        <div class="col-span-2">
           ${buildAttributeRow('Address', employee.address || '123, Tech Park Road, Electronic City, Bangalore - 560100')}
        </div>
      </div>
       <div style="margin-top: 2rem;">
        <h4 style="margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Emergency Contact</h4>
        <div class="grid grid-2 gap-4">
          ${buildAttributeRow('Contact Name', 'Rahul Sharma')}
          ${buildAttributeRow('Relationship', 'Brother')}
          ${buildAttributeRow('Phone Number', '+91 99887 76655')}
        </div>
       </div>
    `,
    employment: `
      <div class="grid grid-2 gap-4">
         ${buildAttributeRow('Employee ID', employee.employeeId || currentUser.userId)}
         ${buildAttributeRow('Department', employee.department || 'Engineering')}
         ${buildAttributeRow('Designation', employee.designation || 'Software Developer')}
         ${buildAttributeRow('Work Location', employee.location || 'Bangalore Office')}
         ${buildAttributeRow('Employment Type', 'Full-Time Permanent')}
         ${buildAttributeRow('Joining Date', new Date(employee.joiningDate || '2023-01-15').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
         ${buildAttributeRow('Confirmation Date', 'April 15, 2023')}
      </div>
    `,
    financial: `
       <div class="grid grid-2 gap-4">
         ${buildAttributeRow('Bank Name', 'HDFC Bank')}
         ${buildAttributeRow('Account Number', 'XXXX XXXX 4521')}
         ${buildAttributeRow('IFSC Code', 'HDFC0001234')}
         ${buildAttributeRow('PAN Number', 'ABCDE1234F')}
         ${buildAttributeRow('UAN Number', '101234567890')}
         ${buildAttributeRow('PF Account', 'MH/BAN/12345/123')}
      </div>
    `,
    documents: `
      <div style="text-align: center; padding: 3rem 1rem;">
        <h3 style="margin-bottom: 0.5rem;">No Documents Available</h3>
        <p class="text-muted">You haven't uploaded any documents yet.</p>
        <button class="btn btn-primary mt-4">Upload Document</button>
      </div>
    `
  };

  // Logic to handle tab switching
  const tabsContainer = container.querySelector('.tabs-header');
  const contentArea = container.querySelector('#tab-content-area');

  // Initial render
  contentArea.innerHTML = tabsContent.personal;

  const buttons = tabsContainer.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      buttons.forEach(b => b.classList.remove('active'));
      // Add to clicked
      btn.classList.add('active');

      // Update content
      const tabKey = btn.getAttribute('data-tab');
      contentArea.innerHTML = tabsContent[tabKey];

      // Add subtle fade in
      contentArea.animate([
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 300,
        easing: 'ease-out'
      });
    });
  });

  return container;
}

window.editProfile = function () {
  alert('Edit functionality would open a modal here.');
};
