import { exitService } from '../core/exit.js';
import { authService } from '../core/auth.js';
import { employeeService } from '../core/employee.js';

export function renderExitDashboard() {
    const container = document.createElement('div');
    container.id = 'exit-dashboard-container';

    // Immediate partial render to show loading state
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Exit & Separations</h1>
            <p class="page-subtitle">Manage resignation workflows and Full & Final settlements</p>
        </div>
        <div id="exit-main-container" style="display: flex; justify-content: center; padding: 3rem;">
            <div class="text-muted">Loading exit details...</div>
        </div>
    `;

    const loadContent = async () => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            container.innerHTML = '<div class="alert alert-error">Please login first</div>';
            return;
        }

        const isHROrAdmin = currentUser.role === 'hr_admin' || currentUser.role === 'super_admin';

        let currentExit = null;
        try {
            // Race condition: Timeout after 5s to prevent infinite hanging
            const fetchExits = exitService.getExits();
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 5000));

            const allExits = await Promise.race([fetchExits, timeout]).catch(err => {
                console.warn('Exit fetch warning:', err);
                return []; // Fallback to empty
            });

            currentExit = allExits.find(e =>
                e.employeeId === currentUser.userId &&
                ['pending_approval', 'approved', 'in_clearance', 'notice_period'].includes(e.status)
            ) || null;

            console.log('Exit Dashboard State:', { role: currentUser.role, foundExit: !!currentExit });

            // Render final content
            const content = isHROrAdmin ? await renderHRView() : renderEmployeeView(currentExit, currentUser);

            const mainContainer = container.querySelector('#exit-main-container');
            if (mainContainer) {
                mainContainer.innerHTML = content;
                mainContainer.style.display = 'block'; // Reset flex/grid if needed
                mainContainer.style.padding = '0';
            }

        } catch (err) {
            console.error('Critical Error in Exit Dashboard:', err);
            const mainContainer = container.querySelector('#exit-main-container');
            if (mainContainer) mainContainer.innerHTML = `<div class="alert alert-danger">Error loading dashboard: ${err.message}</div>`;
        }

        // Initialize listeners
        setTimeout(() => {
            if (!isHROrAdmin && !currentExit) {
                const form = container.querySelector('#resignation-form');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        await handleResignation(form, currentUser.userId);
                    });
                }
            }

            // Attach HR action listeners
            container.querySelectorAll('.approve-exit-btn').forEach(btn => {
                btn.addEventListener('click', () => processExitAction(btn.dataset.id, 'approved'));
            });
            container.querySelectorAll('.reject-exit-btn').forEach(btn => {
                btn.addEventListener('click', () => processExitAction(btn.dataset.id, 'rejected'));
            });
            container.querySelectorAll('.clearance-btn').forEach(btn => {
                btn.addEventListener('click', () => showClearanceModal(btn.dataset.id));
            });
            container.querySelectorAll('.fnf-btn').forEach(btn => {
                btn.addEventListener('click', () => calculateFnF(btn.dataset.id));
            });

            // Withdraw button
            const withdrawBtn = container.querySelector('#withdraw-btn');
            if (withdrawBtn) {
                withdrawBtn.addEventListener('click', () => withdrawResignation(withdrawBtn.dataset.id));
            }
        }, 0);
    };

    loadContent();

    const handleUpdate = () => {
        if (document.body.contains(container)) {
            loadContent();
        }
    };
    window.addEventListener('exit-updated', handleUpdate);

    // ===== Action Handlers =====

    async function handleResignation(form, userId) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        const data = {
            employeeId: userId,
            reason: form.querySelector('#reason').value,
            requestedLWD: form.querySelector('#requested-lwd').value,
            personalEmail: form.querySelector('#personal-email').value,
            comments: form.querySelector('#comments').value
        };

        console.log('Submitting resignation with data:', data);

        try {
            const res = await exitService.initiateExit(data);
            console.log('Resignation result:', res);
            if (res.success) {
                alert('Resignation submitted successfully.');
                window.dispatchEvent(new Event('exit-updated'));
            } else {
                alert(res.message || 'Failed to submit resignation.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error('Resignation submission error:', err);
            alert('Error submitting resignation: ' + err.message);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async function withdrawResignation(id) {
        if (confirm('Are you sure you want to withdraw your resignation?')) {
            try {
                const res = await exitService.rejectExit(id, authService.getCurrentUser().userId, 'User withdrew resignation');
                if (res.success) {
                    alert('Resignation withdrawn successfully.');
                    window.dispatchEvent(new Event('exit-updated'));
                }
            } catch (err) {
                alert('Error withdrawing resignation: ' + err.message);
            }
        }
    }

    async function processExitAction(id, status) {
        const comments = prompt('Any comments for the employee?') || '';
        try {
            let res;
            if (status === 'approved') {
                res = await exitService.approveExit(id, authService.getCurrentUser().userId, comments);
            } else {
                res = await exitService.rejectExit(id, authService.getCurrentUser().userId, comments);
            }
            if (res.success) {
                alert(`Exit request ${status}.`);
                window.dispatchEvent(new Event('exit-updated'));
            }
        } catch (err) {
            alert('Error processing exit: ' + err.message);
        }
    }

    async function showClearanceModal(exitId) {
        try {
            const allExits = await exitService.getExits();
            const exit = allExits.find(e => e.id === exitId);
            if (!exit || !exit.clearance) {
                alert('Exit record not found.');
                return;
            }

            let html = '<h3 class="mb-4">Clearance Status</h3><div style="display: flex; flex-direction: column; gap: 1rem;">';
            Object.entries(exit.clearance).forEach(([deptId, dept]) => {
                const isCleared = dept.completed || dept.status === 'cleared';
                html += `<div class="p-3 rounded" style="border: 1px solid var(--border); background: var(--bg-secondary);">
                            <strong>${dept.department || deptId}</strong> - ${isCleared ? '✅ Cleared' : '⏳ Pending'}
                            <div style="margin-top: 0.5rem; font-size: 0.8rem;">
                                ${(dept.items || []).map((item, idx) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0;">
                                        <span>${item.name}</span>
                                        <input type="checkbox" ${item.cleared || item.status === 'cleared' ? 'checked' : ''} 
                                            class="clearance-item-cb" data-exit="${exitId}" data-dept="${deptId}" data-idx="${idx}">
                                    </div>
                                `).join('')}
                            </div>
                        </div>`;
            });
            html += '<button class="btn btn-secondary w-full" id="close-clearance-modal">Close</button></div>';

            const div = document.createElement('div');
            div.className = 'modal-backdrop';
            div.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;';
            div.innerHTML = `<div class="card" style="max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">${html}</div>`;
            document.body.appendChild(div);

            // Attach checkbox listeners
            div.querySelectorAll('.clearance-item-cb').forEach(cb => {
                cb.addEventListener('change', async () => {
                    const status = cb.checked ? 'cleared' : 'pending';
                    const user = authService.getCurrentUser();
                    try {
                        await exitService.updateClearance(
                            cb.dataset.exit,
                            cb.dataset.dept,
                            parseInt(cb.dataset.idx),
                            cb.checked,
                            user.name || user.userId
                        );
                    } catch (err) {
                        console.error('Error updating clearance:', err);
                    }
                });
            });

            div.querySelector('#close-clearance-modal').addEventListener('click', () => {
                div.remove();
                window.dispatchEvent(new Event('exit-updated'));
            });

            // Click backdrop to close
            div.addEventListener('click', (e) => {
                if (e.target === div) {
                    div.remove();
                    window.dispatchEvent(new Event('exit-updated'));
                }
            });
        } catch (err) {
            alert('Error loading clearance: ' + err.message);
        }
    }

    async function calculateFnF(exitId) {
        try {
            const fnf = await exitService.calculateFnF(exitId);
            if (fnf) {
                alert(`FnF calculated. Net Payable: ₹${fnf.netFnF?.toLocaleString() || 'N/A'}`);
                if (confirm('Directly complete exit and update employee status to EXITED?')) {
                    await exitService.completeExit(exitId);
                }
                window.dispatchEvent(new Event('exit-updated'));
            } else {
                alert('Unable to calculate FnF.');
            }
        } catch (err) {
            alert('Error calculating FnF: ' + err.message);
        }
    }

    return container;
}

// ===== View Renderers =====

function renderEmployeeView(currentExit, user) {
    if (!currentExit) {
        return `
            <div class="card" style="max-width: 600px;">
                <h3 class="mb-4">Submit Resignation</h3>
                <form id="resignation-form">
                    <div class="form-group">
                        <label>Reason for Leaving</label>
                        <select id="reason" required>
                            <option value="">Select a reason</option>
                            <option>Better Opportunity</option>
                            <option>Personal Reasons</option>
                            <option>Higher Studies</option>
                            <option>Relocation</option>
                            <option>Health Reasons</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Requested Last Working Day</label>
                        <input type="date" id="requested-lwd" required min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Personal Email (for FnF communication)</label>
                        <input type="email" id="personal-email" placeholder="e.g. john.doe@gmail.com" required>
                    </div>
                    <div class="form-group">
                        <label>Additional Comments</label>
                        <textarea id="comments" rows="3" placeholder="Explain further..."></textarea>
                    </div>
                    <div class="alert alert-warning text-sm mb-4" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: var(--warning);">
                        <strong>Note:</strong> Your notice period as per policy is 30 days. 
                        Final LWD will be subject to management approval.
                    </div>
                    <button type="submit" class="btn btn-danger w-full">Submit Resignation</button>
                </form>
            </div>
        `;
    }

    const clearanceHTML = currentExit.clearance ? Object.entries(currentExit.clearance).map(([id, dept]) => `
        <div class="flex justify-between items-center p-3 mb-2 rounded" style="border: 1px solid var(--border);">
            <span>${dept.department || id}</span>
            <span class="badge ${dept.completed ? 'badge-success' : 'badge-warning'}">${dept.completed ? 'Cleared' : 'Pending'}</span>
        </div>
    `).join('') : '<p class="text-muted">No clearance data available</p>';

    return `
        <div class="grid grid-2 gap-6">
            <div class="card">
                <h3>Resignation Status</h3>
                <div class="mt-4 p-4 rounded" style="background: var(--bg-secondary);">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-muted">Current Status:</span>
                        <span class="badge ${getStatusBadge(currentExit.status)}">${(currentExit.status || '').replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-muted">LWD:</span>
                        <span class="font-medium">${currentExit.requestedLWD || '—'}</span>
                    </div>
                    <div class="text-xs text-muted mt-2">Submitted on: ${currentExit.resignationDate ? new Date(currentExit.resignationDate).toLocaleDateString() : '—'}</div>
                </div>

                ${currentExit.status === 'pending_approval' ? `
                    <button class="btn btn-sm btn-secondary w-full mt-4" id="withdraw-btn" data-id="${currentExit.id}">Withdraw Resignation</button>
                ` : ''}

                <h3 class="mt-6 mb-4">Department Clearance</h3>
                <div class="clearance-list">
                    ${clearanceHTML}
                </div>
            </div>

            <div class="card">
                <h3>FnF Settlement Detail</h3>
                ${currentExit.status === 'completed' && currentExit.fnf ? `
                    <div class="mt-4">
                        <div class="p-4 rounded text-center mb-4" style="background: rgba(204, 255, 0, 0.1);">
                            <div class="text-sm">Net Payable Amount</div>
                            <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">₹${(currentExit.fnf.netFnF || 0).toLocaleString()}</div>
                        </div>
                        <div class="text-sm" style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <div class="flex justify-between"><span>Unpaid Days Salary:</span> <span>₹${(currentExit.fnf.unpaidSalary || 0).toLocaleString()}</span></div>
                            <div class="flex justify-between"><span>Leave Encashment:</span> <span>₹${(currentExit.fnf.leaveEncashment || 0).toLocaleString()}</span></div>
                            <div class="flex justify-between font-bold" style="border-top: 1px solid var(--border); padding-top: 0.5rem;"><span>Total Earnings:</span> <span>₹${(currentExit.fnf.totalEarnings || 0).toLocaleString()}</span></div>
                        </div>
                    </div>
                ` : `
                    <div class="text-center p-4 text-muted" style="padding: 2rem;">
                        <div style="font-size: 3rem;">💰</div>
                        <p>FnF details will be visible once clearance is completed and management approves the final amount.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

async function renderHRView() {
    let allExits = [];
    try {
        allExits = await exitService.getExits();
    } catch (err) {
        console.error('Error loading exits:', err);
    }

    const pendingExits = allExits.filter(e => e.status === 'pending_approval');
    const inProgressExits = allExits.filter(e => e.status === 'approved');

    return `
        <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <div class="card" style="grid-column: span 1;">
                <h3>Pending Resignations</h3>
                <div class="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>LWD</th>
                                <th>Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingExits.length === 0 ? '<tr><td colspan="4" class="text-center p-4 text-muted">No pending requests</td></tr>' : ''}
                            ${pendingExits.map(exit => `
                                <tr>
                                    <td>${exit.employeeName || '—'}</td>
                                    <td>${exit.requestedLWD || '—'}</td>
                                    <td class="text-xs">${exit.reason || '—'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success approve-exit-btn" data-id="${exit.id}">Approve</button>
                                        <button class="btn btn-sm btn-danger reject-exit-btn" data-id="${exit.id}">Reject</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <h3 class="mt-8">Clearance & FnF Management</h3>
                <div class="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Clearance Status</th>
                                <th>FnF Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inProgressExits.length === 0 ? '<tr><td colspan="4" class="text-center p-4 text-muted">No exit processes in progress</td></tr>' : ''}
                            ${inProgressExits.map(exit => {
        const clearanceEntries = exit.clearance ? Object.values(exit.clearance) : [];
        const clearedCount = clearanceEntries.filter(c => c.completed || c.status === 'cleared').length;
        const totalCount = clearanceEntries.length || 1;
        return `
                                    <tr>
                                        <td>${exit.employeeName || '—'}</td>
                                        <td>
                                            <div class="text-xs">${clearedCount}/${totalCount} Cleared</div>
                                            <div style="height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-top: 4px; overflow: hidden;">
                                                <div style="height: 100%; width: ${(clearedCount / totalCount) * 100}%; background: var(--primary); border-radius: 2px;"></div>
                                            </div>
                                        </td>
                                        <td>${exit.fnf ? 'Calculated' : 'Pending'}</td>
                                        <td>
                                            <button class="btn btn-sm btn-secondary clearance-btn" data-id="${exit.id}">Update Clearance</button>
                                            <button class="btn btn-sm btn-primary fnf-btn" data-id="${exit.id}">Calc FnF</button>
                                        </td>
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3>Quick Stats</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <div class="p-4 rounded" style="border-left: 4px solid var(--warning); background: var(--bg-secondary);">
                        <div style="font-size: 1.5rem; font-weight: bold;">${pendingExits.length}</div>
                        <div class="text-sm text-muted">Pending Resignations</div>
                    </div>
                    <div class="p-4 rounded" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
                        <div style="font-size: 1.5rem; font-weight: bold;">${inProgressExits.length}</div>
                        <div class="text-sm text-muted">In Clearance Stage</div>
                    </div>
                    <div class="p-4 rounded" style="border-left: 4px solid var(--success); background: var(--bg-secondary);">
                        <div style="font-size: 1.5rem; font-weight: bold;">${allExits.filter(e => e.status === 'completed').length}</div>
                        <div class="text-sm text-muted">Completed Exits</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    if (status === 'completed') return 'badge-success';
    if (status === 'approved') return 'badge-primary';
    if (status === 'rejected' || status === 'cancelled') return 'badge-danger';
    return 'badge-warning';
}
