import { authService } from '../core/auth.js';

export function renderMyTeam() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();

  // Sample team data for manager
  const teamMembers = [
    {
      id: 'TM001',
      name: 'Rajesh Kumar',
      employeeId: 'E005',
      designation: 'Senior Developer',
      department: 'Engineering',
      email: 'rajesh.kumar@company.com',
      phone: '+91 98765 43211',
      joiningDate: '2022-03-15',
      status: 'present',
      avatar: 'R'
    },
    {
      id: 'TM002',
      name: 'Priya Sharma',
      employeeId: 'E006',
      designation: 'Software Developer',
      department: 'Engineering',
      email: 'priya.sharma@company.com',
      phone: '+91 98765 43212',
      joiningDate: '2022-06-20',
      status: 'present',
      avatar: 'P'
    },
    {
      id: 'TM003',
      name: 'Amit Patel',
      employeeId: 'E007',
      designation: 'Junior Developer',
      department: 'Engineering',
      email: 'amit.patel@company.com',
      phone: '+91 98765 43213',
      joiningDate: '2023-01-10',
      status: 'on_leave',
      avatar: 'A'
    },
    {
      id: 'TM004',
      name: 'Sneha Reddy',
      employeeId: 'E008',
      designation: 'QA Engineer',
      department: 'Engineering',
      email: 'sneha.reddy@company.com',
      phone: '+91 98765 43214',
      joiningDate: '2022-09-05',
      status: 'present',
      avatar: 'S'
    },
    {
      id: 'TM005',
      name: 'Vikram Singh',
      employeeId: 'E009',
      designation: 'UI Developer',
      department: 'Engineering',
      email: 'vikram.singh@company.com',
      phone: '+91 98765 43215',
      joiningDate: '2023-04-18',
      status: 'wfh',
      avatar: 'V'
    }
  ];

  const presentCount = teamMembers.filter(m => m.status === 'present').length;
  const onLeaveCount = teamMembers.filter(m => m.status === 'on_leave').length;
  const wfhCount = teamMembers.filter(m => m.status === 'wfh').length;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">My Team</h1>
      <p class="page-subtitle">View and manage your team members</p>
    </div>

    <div class="grid grid-4 mb-6">
      <div class="card stat-card">
        <div class="stat-value">${teamMembers.length}</div>
        <div class="stat-label">Total Members</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--success);">${presentCount}</div>
        <div class="stat-label">Present Today</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--warning);">${onLeaveCount}</div>
        <div class="stat-label">On Leave</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value" style="color: var(--primary);">${wfhCount}</div>
        <div class="stat-label">Work From Home</div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3>Team Members</h3>
        <div class="flex gap-2">
          <select id="status-filter" class="btn btn-secondary">
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="on_leave">On Leave</option>
            <option value="wfh">Work From Home</option>
          </select>
        </div>
      </div>

      <div class="grid grid-2" id="team-grid" style="gap: 1rem;">
        ${teamMembers.map(member => `
          <div class="team-member-card" style="border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.25rem;">
              ${member.avatar}
            </div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="font-weight: 600; font-size: 1rem;">${member.name}</div>
                  <div class="text-sm text-muted">${member.designation}</div>
                </div>
                <span class="badge badge-${member.status === 'present' ? 'success' : member.status === 'on_leave' ? 'warning' : 'primary'}">
                  ${member.status === 'present' ? 'Present' : member.status === 'on_leave' ? 'On Leave' : 'WFH'}
                </span>
              </div>
              <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                <div style="margin-bottom: 0.25rem;">ID: ${member.employeeId}</div>
                <div style="margin-bottom: 0.25rem;">${member.email}</div>
                <div>${member.phone}</div>
              </div>
              <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-secondary" onclick="window.viewTeamMember('${member.id}')">View Profile</button>
                <button class="btn btn-sm btn-secondary" onclick="window.messageTeamMember('${member.id}')">Message</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="grid grid-2 gap-6 mt-6">
      <div class="card">
        <h3 class="mb-4">Team Leaves This Week</h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px;">
            <div>
              <div style="font-weight: 500;">Amit Patel</div>
              <div class="text-sm text-muted">Sick Leave</div>
            </div>
            <div class="text-sm text-right">
              <div>Dec 30 - Dec 31</div>
              <span class="badge badge-warning">Approved</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px;">
            <div>
              <div style="font-weight: 500;">Priya Sharma</div>
              <div class="text-sm text-muted">Casual Leave</div>
            </div>
            <div class="text-sm text-right">
              <div>Jan 2 - Jan 3</div>
              <span class="badge badge-primary">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-4">Team Performance</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Average Attendance</span>
              <span style="font-weight: 600;">94%</span>
            </div>
            <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: 94%; background: #10b981; border-radius: 4px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Tasks Completed</span>
              <span style="font-weight: 600;">87%</span>
            </div>
            <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: 87%; background: #3b82f6; border-radius: 4px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Sprint Progress</span>
              <span style="font-weight: 600;">72%</span>
            </div>
            <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: 72%; background: #f59e0b; border-radius: 4px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return container;
}

// Global handlers
window.viewTeamMember = function (memberId) {
  alert(`Viewing profile for team member ${memberId}\n\nThis would open the detailed employee profile in a production system.`);
};

window.messageTeamMember = function (memberId) {
  alert(`Opening message composer for team member ${memberId}\n\nThis would open the internal messaging system in a production system.`);
};
