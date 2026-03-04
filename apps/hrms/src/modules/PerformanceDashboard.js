import { performanceService } from '../core/performance.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';

export function renderPerformanceDashboard() {
    const container = document.createElement('div');
    container.id = 'performance-dashboard-container';

    const currentUser = authService.getCurrentUser();
    const isHROrAdmin = currentUser.role === 'hr_admin' || currentUser.role === 'super_admin';
    let currentTab = 'goals';

    // ... (previous content)
    container.innerHTML = `
        <div class="page-header" style="background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(5, 5, 5, 1) 100%); padding: 3rem 2rem; border-radius: 20px; border: 1px solid rgba(204, 255, 0, 0.1); margin-bottom: 2rem; position: relative; overflow: hidden;">
            <div style="position: relative; z-index: 2;">
                <h1 class="page-title" style="font-size: 2.5rem; margin-bottom: 0.5rem;">Performance & Goals</h1>
                <p class="page-subtitle" style="font-size: 1.1rem; max-width: 600px; color: var(--text-muted);">
                    Track your professional growth, manage goals, and review your performance appraisals.
                </p>
                <div class="mt-6 flex gap-3">
                    <button class="btn btn-primary" onclick="window.showAddGoalModal()">+ New Goal</button>
                    <button class="btn btn-secondary" onclick="window.viewReview('latest')">View Latest Review</button>
                </div>
            </div>
        </div>

        <div class="grid grid-3 mb-8" id="performance-stats">
            <!-- Stats loaded dynamically -->
        </div>

        <div class="card" style="padding: 0; overflow: hidden; background: var(--surface);">
            <div style="border-bottom: 1px solid var(--border); padding: 0 1rem;">
                <nav class="flex gap-6" id="performance-tabs">
                    <button class="tab-btn active" data-tab="goals" style="padding: 1.25rem 0.5rem; border-bottom: 3px solid var(--primary-lime); color: var(--text-main); font-weight: 600; background: none; cursor: pointer;">My Goals</button>
                    ${currentUser.role === 'manager' || isHROrAdmin ? '<button class="tab-btn" data-tab="team-goals" style="padding: 1.25rem 0.5rem; border-bottom: 3px solid transparent; color: var(--text-muted); font-weight: 500; background: none; cursor: pointer;">Team Goals</button>' : ''}
                    <button class="tab-btn" data-tab="reviews" style="padding: 1.25rem 0.5rem; border-bottom: 3px solid transparent; color: var(--text-muted); font-weight: 500; background: none; cursor: pointer;">Reviews & Appraisals</button>
                    ${isHROrAdmin ? '<button class="tab-btn" data-tab="admin" style="padding: 1.25rem 0.5rem; border-bottom: 3px solid transparent; color: var(--text-muted); font-weight: 500; background: none; cursor: pointer;">Admin Panel</button>' : ''}
                </nav>
            </div>
            
            <div id="performance-content" style="padding: 2rem;">
                <!-- Tab Content -->
            </div>
        </div>
    `;

    const contentArea = container.querySelector('#performance-content');
    const tabs = container.querySelectorAll('.tab-btn');

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
            currentTab = tab.dataset.tab;
            renderTab(currentTab, contentArea, currentUser, isHROrAdmin);
        });
    });

    const refreshDashboard = () => {
        if (!document.body.contains(container)) return;
        loadStats(container, currentUser.userId);
        // Only re-render tab content if it's not currently being interacted with (simple check)
        // Ideally we pass a flag to renderTab to not show loading spinner if it's a refresh
        renderTab(currentTab, contentArea, currentUser, isHROrAdmin, true);
    };

    // Initial Load
    refreshDashboard();

    // Listen for updates
    window.addEventListener('performance-updated', refreshDashboard);

    return container;
}

async function loadStats(container, userId) {
    const stats = await performanceService.getPerformanceStats(userId);
    const statsContainer = container.querySelector('#performance-stats');

    statsContainer.innerHTML = `
        <div class="card stat-card hover-reveal" style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(34, 197, 94, 0.1); color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                
            </div>
            <div>
                <div class="stat-value" style="font-size: 2rem; font-weight: 700;">${stats.totalGoals}</div>
                <div class="stat-label text-muted">Active Goals</div>
            </div>
        </div>
        
        <div class="card stat-card hover-reveal" style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(59, 130, 246, 0.1); color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                
            </div>
            <div>
                <div class="stat-value" style="font-size: 2rem; font-weight: 700;">${Math.round(stats.avgProgress)}%</div>
                <div class="stat-label text-muted">Avg. Progress</div>
            </div>
        </div>

        <div class="card stat-card hover-reveal" style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(168, 85, 247, 0.1); color: #a855f7; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                
            </div>
            <div>
                <div class="stat-value" style="font-size: 2rem; font-weight: 700;">${stats.latestReview ? stats.latestReview.finalScore : 'N/A'}<span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;">/5</span></div>
                <div class="stat-label text-muted">Latest Rating</div>
            </div>
        </div>
    `;
}

async function renderTab(tab, container, user, isAdmin) {
    container.innerHTML = `<div class="fade-in-up">Loading...</div>`;

    container.innerHTML = '';
    if (tab === 'goals') {
        await renderGoals(container, user.userId);
    } else if (tab === 'team-goals') {
        await renderTeamGoals(container, user.userId);
    } else if (tab === 'reviews') {
        await renderReviews(container, user);
    } else if (tab === 'admin') {
        await renderAdminPanel(container);
    }
}

async function renderTeamGoals(container, managerId) {
    const allEmployees = await employeeService.getEmployees();
    const mgr = allEmployees.find(m => m.id === managerId);
    const reportees = allEmployees.filter(e => {
        return e.manager === mgr?.name && e.id !== managerId;
    });

    if (reportees.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <h3 class="mt-4 text-xl font-bold">No Team Members</h3>
                <p class="text-muted">You don't have any direct reports assigned to you.</p>
            </div>
        `;
        return;
    }

    // Build team cards with async goal fetching
    const teamCardsHtml = (await Promise.all(reportees.map(async (emp) => {
        const goals = await performanceService.getGoals(emp.id);
        const avgProgress = goals.length > 0 ? goals.reduce((a, b) => a + b.progress, 0) / goals.length : 0;

        return `
            <div class="card hover-reveal" style="border: 1px solid var(--border);">
                <div class="flex items-center gap-4 mb-4">
                    <div class="avatar" style="width: 48px; height: 48px; background: var(--primary-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; color: white;">
                        ${emp.name.charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-lg">${emp.name}</h4>
                        <div class="text-sm text-muted">${emp.designation}</div>
                    </div>
                    <div class="ml-auto text-right">
                        <div class="text-2xl font-bold ${avgProgress >= 75 ? 'text-success' : avgProgress >= 50 ? 'text-warning' : 'text-danger'}">${Math.round(avgProgress)}%</div>
                        <div class="text-xs text-muted">Avg. Progress</div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <h5 class="text-xs uppercase font-bold text-muted tracking-wider">Active Goals (${goals.length})</h5>
                    ${goals.length === 0 ? '<div class="text-sm text-muted italic">No goals set</div>' :
                goals.slice(0, 3).map(g => `
                            <div class="flex flex-col gap-1">
                                <div class="flex justify-between text-xs">
                                    <span>${g.title}</span>
                                    <span class="font-bold">${g.progress}%</span>
                                </div>
                                <div class="progress-bar-sm" style="height: 4px; background: var(--bg-secondary); border-radius: 2px;">
                                    <div style="width: ${g.progress}%; height: 100%; background: ${g.progress >= 100 ? 'var(--success)' : 'var(--primary-lime)'}; border-radius: 2px;"></div>
                                </div>
                            </div>
                        `).join('')
            }
                    ${goals.length > 3 ? `<div class="text-xs text-center text-primary cursor-pointer hover:underline">+${goals.length - 3} more goals</div>` : ''}
                </div>

                <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button class="btn btn-sm btn-secondary" onclick="toast.info('Viewing details for ${emp.name}')">View Full Profile</button>
                </div>
            </div>
        `;
    }))).join('');

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold">Team Performance Overview</h3>
            <div class="flex gap-2">
                <span class="badge badge-primary">${reportees.length} Members</span>
            </div>
        </div>
        <div class="grid grid-2 gap-6">
            ${teamCardsHtml}
        </div>
    `;
}

async function renderGoals(container, userId) {
    const goals = await performanceService.getGoals(userId);

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="card-title">My Performance Goals</h3>
                <p class="text-sm text-muted">Track your progress towards key objectives</p>
            </div>
            <button class="btn btn-primary" onclick="window.showAddGoalModal()">
                <span style="font-size: 1.2rem; margin-right: 0.5rem;">+</span> Add New Goal
            </button>
        </div>

        ${goals.length === 0 ? `
            <div class="card text-center p-8">
                <h3>No Goals Set Yet</h3>
                <p class="text-muted mb-4">Set clear goals to track your professional growth and achievements.</p>
                <button class="btn btn-primary" onclick="window.showAddGoalModal()">Create First Goal</button>
            </div>
        ` : `
            <div class="grid grid-2 gap-4">
                ${goals.map(goal => {
        const status = getGoalStatus(goal);
        const statusColor = getStatusColor(status);

        return `
                    <div class="card goal-card" style="border-top: 4px solid ${statusColor}; position: relative;">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-bold text-lg mb-1">${goal.title}</h4>
                                <span class="badge" style="background: ${statusColor}20; color: ${statusColor};">
                                    ${status}
                                </span>
                            </div>
                            <div class="text-right">
                                <span class="text-xs text-muted block">Due Date</span>
                                <span class="font-medium text-sm">${new Date(goal.targetDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <p class="text-sm text-muted mb-4" style="min-height: 40px;">${goal.description || 'No description provided.'}</p>
                        
                        <div class="mb-4">
                            <div class="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span class="font-bold">${goal.progress}%</span>
                            </div>
                            <div class="progress-bar" style="height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                                <div class="progress" style="width: ${goal.progress}%; background: ${statusColor}; height: 100%; transition: width 0.3s ease;"></div>
                            </div>
                            <input type="range" class="w-full mt-2" value="${goal.progress}" min="0" max="100" 
                                onchange="window.updateGoalProgress('${goal.id}', this.value)"
                                style="cursor: pointer;">
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-muted">
                            <div class="flex gap-3">
                                <span>${goal.category}</span>
                                <span>Weight: ${goal.weight}%</span>
                            </div>
                            <button class="btn-text" style="color: var(--primary-lime);" onclick="window.editGoal('${goal.id}')">Edit</button>
                        </div>
                    </div>
                `}).join('')
        }
            </div>
    `}
    `;
}

function getGoalStatus(goal) {
    if (goal.progress >= 100) return 'Completed';
    const today = new Date();
    const target = new Date(goal.targetDate);
    if (today > target) return 'Overdue';
    if (goal.progress > 0) return 'In Progress';
    return 'Not Started';
}

function getStatusColor(status) {
    switch (status) {
        case 'Completed': return '#10b981'; // Green
        case 'Overdue': return '#ef4444';   // Red
        case 'In Progress': return '#3b82f6'; // Blue
        default: return '#9ca3af'; // Gray
    }
}

async function renderReviews(container, user) {
    const reviews = await performanceService.getReviews({ employeeId: user.userId });
    const cycles = await performanceService.getCycles();

    container.innerHTML = `
        <div class="mb-6">
            <h3 class="card-title">Appraisal Records</h3>
            <p class="text-sm text-muted">View your performance review history and active cycles</p>
        </div>

        ${reviews.length === 0 ? `
            <div class="card text-center p-8">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                <h3>No Appraisals Found</h3>
                <p class="text-muted">You have no active or past performance reviews.</p>
            </div>
        ` : `
            <div class="space-y-4">
                ${reviews.map(rev => {
        const cycle = cycles.find(c => c.id === rev.cycleId);
        const cycleName = cycle ? cycle.name : rev.cycleId;

        return `
                    <div class="card review-card hover-reveal" style="border-left: 4px solid var(--primary-lime);">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="font-bold text-lg">${cycleName}</h4>
                                <div class="text-xs text-muted">Cycle ID: ${rev.id}</div>
                            </div>
                            <div class="text-right">
                                ${rev.finalScore ? `
                                    <div class="text-2xl font-bold text-primary-lime">${rev.finalScore}<span class="text-sm text-muted">/5</span></div>
                                    <div class="text-xs text-muted">Final Score</div>
                                ` : `
                                    <span class="badge ${getStatusBadgeClass(rev.status)}">${formatStatus(rev.status)}</span>
                                `}
                            </div>
                        </div>

                        <!-- Process Stepper -->
                        <div class="mb-4">
                            ${getReviewStepsHTML(rev.status)}
                        </div>

                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                             <div class="text-sm text-muted">
                                ${rev.managerName ? `Manager: <strong>${rev.managerName}</strong>` : ''}
                             </div>
                             <div>
                                ${rev.status === 'in_self_assessment' ?
                `<button class="btn btn-primary btn-sm" onclick="window.takeAssessment('${rev.id}', 'self')">Start Self Assessment</button>` :
                `<button class="btn btn-secondary btn-sm" onclick="window.viewReview('${rev.id}')">View Details</button>`
            }
                             </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `}
    `;
}

function getReviewStepsHTML(status) {
    const steps = [
        { key: 'initiated', label: 'Started' },
        { key: 'in_self_assessment', label: 'Self Review' },
        { key: 'in_manager_assessment', label: 'Manager Review' },
        { key: 'completed', label: 'Completed' }
    ];

    let currentIdx = steps.findIndex(s => s.key === status);
    if (currentIdx === -1 && status === 'completed') currentIdx = 3;

    // Status Logic fix: if status is 'in_self', started is done. 
    // We map status to index 0..3
    if (status === 'initiated') currentIdx = 0;
    if (status === 'in_self_assessment') currentIdx = 1;
    if (status === 'in_manager_assessment') currentIdx = 2;
    if (status === 'completed') currentIdx = 3;

    return `
        <div class="flex items-center justify-between relative mt-2 mb-2">
            <!-- Line -->
            <div style="position: absolute; top: 10px; left: 0; right: 0; height: 2px; background: var(--bg-secondary); z-index: 1;"></div>
            <div style="position: absolute; top: 10px; left: 0; right: 0; height: 2px; background: var(--primary-lime); z-index: 1; width: ${(currentIdx / 3) * 100}%;"></div>

            ${steps.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        return `
                    <div class="flex flex-col items-center relative" style="z-index: 2;">
                        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${isCompleted ? 'var(--primary-lime)' : 'var(--bg-secondary)'}; border: 2px solid ${isCompleted ? 'var(--primary-lime)' : 'var(--border)'}; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                            ${isCompleted ? '<span style="font-size: 10px; color: black;">✓</span>' : ''}
                        </div>
                        <span style="font-size: 0.7rem; color: ${isCurrent ? 'var(--text-main)' : 'var(--text-muted)'}; font-weight: ${isCurrent ? 'bold' : 'normal'};">${step.label}</span>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function formatStatus(status) {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function renderAdminPanel(container) {
    const cycles = await performanceService.getCycles();
    const reviews = await performanceService.getReviews();

    container.innerHTML = `
        <div class="grid grid-2 gap-4">
            <div class="card">
                <h3>Cycle Management</h3>
                <div class="mt-4">
                    ${cycles.map(c => `
                        <div class="mb-3 p-3 rounded" style="background: var(--bg-secondary);">
                            <div class="font-medium">${c.name}</div>
                            <div class="text-xs text-muted">Status: ${c.status} | End: ${c.endDate}</div>
                            <button class="btn btn-sm btn-secondary mt-2" onclick="window.initiateCycle('${c.id}')">Bulk Initiate</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="card">
                <h3>Manager Reviews Pending</h3>
                <div class="mt-4">
                    ${reviews.filter(r => r.status === 'in_manager_assessment').map(r => `
                        <div class="mb-2 p-2 border-b flex justify-between items-center text-sm">
                            <span>${r.employeeName}</span>
                            <button class="btn btn-sm btn-primary" onclick="window.takeAssessment('${r.id}', 'manager')">Complete Review</button>
                        </div>
                    `).join('') || '<p class="text-muted">No pending manager assessments.</p>'}
                </div>
            </div>
        </div>
    `;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'completed': return 'badge-success';
        case 'in_self_assessment': return 'badge-primary';
        case 'in_manager_assessment': return 'badge-warning';
        default: return 'badge-secondary';
    }
}

// Global functions for actions
// Global functions for actions
window.showAddGoalModal = async () => {
    const title = prompt('Goal Title:');
    if (!title) return;
    const desc = prompt('Goal Description:');
    const date = prompt('Target Date (YYYY-MM-DD):', '2025-06-30');

    await performanceService.createGoal({
        employeeId: authService.getCurrentUser().userId,
        title,
        description: desc,
        targetDate: date
    });
    window.dispatchEvent(new Event('performance-updated'));
};

window.updateGoalProgress = async (id, val) => {
    await performanceService.updateGoal(id, { progress: parseInt(val) });
    window.dispatchEvent(new Event('performance-updated'));
};

window.initiateCycle = async (cycleId) => {
    const emps = await employeeService.getEmployees({ status: 'active' });
    let count = 0;
    for (const emp of emps) {
        const res = await performanceService.initiateReview(emp.id, cycleId);
        if (res.success) count++;
    }
    alert(`Initiated ${count} reviews!`);
    window.dispatchEvent(new Event('performance-updated'));
};

window.takeAssessment = async (id, role) => {
    const rating = prompt('Enter Rating (1-5):', '4');
    const comments = prompt('Enter Comments:');

    if (rating) {
        const ratings = {
            tech_skills: parseInt(rating),
            delivery: parseInt(rating),
            soft_skills: parseInt(rating),
            values: parseInt(rating)
        };
        await performanceService.submitAssessment(id, role, { ratings, comments });
        alert('Assessment submitted!');
        window.dispatchEvent(new Event('performance-updated'));
    }
};

window.viewReview = async (id) => {
    const reviews = await performanceService.getReviews();
    const rev = reviews.find(r => r.id === id);
    if (!rev) {
        alert('Review not found');
        return;
    }
    alert(`
        Review Status: ${rev.status}
        Final Score: ${rev.finalScore || 'Pending'} / 5
        Self Comments: ${rev.employeeComments || '-'}
        Manager Comments: ${rev.managerComments || '-'}
    `);
};
