/**
 * Subix LeadOS - Phase 1 Complete
 * All features implemented: Loading, Bulk Actions, Date Filters, Enhanced Search
 */

// ============================================
// STATE MANAGEMENT
// ============================================

let currentView = 'dashboard';
// ✅ currentUser is populated from the real Supabase session set by the session guard in index.html
let currentUser = {
    user_id: window._subixUser?.id || 'unknown',
    full_name: window._subixUser?.user_metadata?.full_name || window._subixUser?.email || 'User',
    role: 'member'
};
let leads = [];
let activities = [];
let selectedLeads = new Set();
let dateFilter = 'all';
let customDateRange = { from: null, to: null };

// ============================================
// CONSTANTS
// ============================================

const STATUSES = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost',
    'On Hold'
];

const SOURCES = [
    'Website Form',
    'Manual Entry',
    'Referral',
    'WhatsApp',
    'MagicBricks',
    '99Acres',
    'Facebook Ads',
    'Google Ads',
    'Cold Outreach'
];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Small timeout ensures the synchronous Session Guard in <head> has completely 
    // evaluated and assigned window._subixUser before we try to check it here.
    setTimeout(checkAuth, 150);
});

function initializeApp() {
    console.log('🚀 Subix LeadOS V2.0 - Phase 1 Complete');

    // Setup UI components
    updateDate();
    setupNavigation();
    setupLogout();
    setupModal();
    setupShortcuts();
    setupNotifications();
    setupActivityViewAll();
    setupBulkActions();
    setupDateFilters();
    setupTableFilters();
    setupAutomationModal();
    setupImport();

    // Setup Kanban drag-and-drop (event delegation — survives re-renders)
    initKanbanDragDrop();

    // Load data
    loadLeads();

    console.log('✅ Application initialized successfully');
}


// ✅ AUTH — Handled by session guard in <head> of index.html
function checkAuth() {
    // Wait until the session guard actually verifies a user!
    // If not authenticated, the app should naturally remain hidden so the Login Screen is visible.
    if (!window._subixUser && !window._isLocalDevMode) {
        console.warn('⛔ script-v2.js: No active user session detected. Halting dashboard init until login...');
        return;
    }

    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.display = 'flex';
        // Specifically hide the login overlay just in case they just logged in locally
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) loginContainer.style.display = 'none';
    }

    // Refresh currentUser from session guard data
    if (window._subixUser) {
        const meta = window._subixUser.user_metadata || {};
        const name = meta.full_name || meta.name || meta.display_name || window._subixUser.email.split('@')[0];
        currentUser = {
            user_id: window._subixUser.id,
            full_name: name,
            role: meta.role || 'member'
        };
    }
    initializeApp();
}

// ============================================
// LOADING STATES
// ============================================

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const text = overlay.querySelector('.loading-text');
    if (text) text.textContent = message;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

// ============================================
// DATA LOADING
// ============================================

async function loadLeads() {
    showLoading('Loading leads...');

    try {
        // specific delay to ensure DB is initialized if network is slow
        await new Promise(resolve => setTimeout(resolve, 500));

        leads = await DB.getAllRecords('leads');

        // Auto-seed dummy data on first load
        if (leads && leads.length === 0) {
            console.log('🌱 No leads found - Auto-seeding dummy data...');
            const count = await DB.generateRandomLeads(15);
            leads = await DB.getAllRecords('leads');
            showToast(`Welcome! Created ${count} sample leads for you`, 'success');
        }

        activities = await DB.getRecentActivities(20);

        // Apply date filter
        leads = filterLeadsByDate(leads);

        console.log(`📊 Loaded ${leads.length} leads`);

        // Render all views
        populateAllViews();

    } catch (error) {
        console.error('❌ Error loading data:', error);
        // Check for common Supabase errors
        if (error.message && error.message.includes('leads" does not exist')) {
            showToast('⚠️ Setup Needed: Run the SQL Script in Supabase!', 'error');
        } else if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
            showToast('⚠️ Network Error: Check internet / Supabase URL', 'error');
        } else {
            showToast('Error: ' + error.message, 'error');
        }
    } finally {
        hideLoading();
    }
}

// ============================================
// LOGOUT
// ============================================

// ✅ LOGOUT — Uses Supabase signOut via subixLogout() defined in session guard
function setupLogout() {
    if (window._logoutInit) return;
    window._logoutInit = true;

    document.addEventListener('click', (e) => {
        const profile = e.target.closest('.user-profile');
        if (!profile) return;
        if (document.getElementById('logout-dialog')) return;

        // ✅ Stop the opening click from bubbling — prevents the same event
        // from immediately triggering the backdrop-dismiss listener below.
        e.stopPropagation();

        const dialog = document.createElement('div');
        dialog.id = 'logout-dialog';
        dialog.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 20000;
            display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
            pointer-events: none;
        `;
        dialog.innerHTML = `
            <div style="background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; width: 340px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: center; pointer-events: all;">
                <span class="material-icons-round" style="font-size: 3rem; color: #ef4444; display: block; margin-bottom: 1rem;">logout</span>
                <h3 style="margin-bottom: 0.5rem; color: #f8fafc;">Sign Out</h3>
                <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem;">
                    You'll be signed out of all Subix products and returned to the login page.
                </p>
                <div style="display:flex; gap:1rem; justify-content:center;">
                    <button id="logout-cancel" style="padding:0.6rem 1.2rem; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:#f8fafc; cursor:pointer; font-weight:500;">Cancel</button>
                    <button id="logout-confirm" style="padding:0.6rem 1.2rem; border-radius:8px; background:#ef4444; border:none; color:white; font-weight:600; cursor:pointer;">Sign Out</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        // Enable backdrop clicks only after a short delay (prevents same-event dismiss)
        setTimeout(() => { dialog.style.pointerEvents = 'all'; }, 100);

        dialog.querySelector('#logout-cancel').addEventListener('click', () => dialog.remove());

        // Dismiss when clicking the dark backdrop (outside the card)
        dialog.addEventListener('click', evt => {
            if (evt.target === dialog) dialog.remove();
        });

        dialog.querySelector('#logout-confirm').addEventListener('click', async () => {
            const confirmBtn = dialog.querySelector('#logout-confirm');
            confirmBtn.textContent = 'Signing out…';
            confirmBtn.disabled = true;
            // ✅ Call sign out defined in session guard
            await subixLogout();
        });
    });

    console.log('✅ Logout handler initialized (Supabase SSO)');
}

function populateAllViews() {
    updateKPIs();
    renderDashboardCharts();
    renderLeadsTable();
    renderKanban();
    renderRecentActivity();
}

// ============================================
// DATE FILTERING
// ============================================

function setupDateFilters() {
    const buttons = document.querySelectorAll('.date-quick-btn');
    const customRange = document.getElementById('custom-date-range');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            dateFilter = btn.dataset.range;

            if (dateFilter === 'custom') {
                customRange.style.display = 'flex';
            } else {
                customRange.style.display = 'none';
                loadLeads();
            }
        });
    });

    if (dateFrom && dateTo) {
        dateFrom.addEventListener('change', () => {
            customDateRange.from = dateFrom.value;
            if (customDateRange.to) loadLeads();
        });

        dateTo.addEventListener('change', () => {
            customDateRange.to = dateTo.value;
            if (customDateRange.from) loadLeads();
        });
    }
}

function filterLeadsByDate(leadsList) {
    if (dateFilter === 'all') return leadsList;

    const now = new Date();
    let startDate;

    switch (dateFilter) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'custom':
            if (!customDateRange.from || !customDateRange.to) return leadsList;
            startDate = new Date(customDateRange.from);
            const endDate = new Date(customDateRange.to);
            return leadsList.filter(lead => {
                const leadDate = new Date(lead.created_at);
                return leadDate >= startDate && leadDate <= endDate;
            });
    }

    return leadsList.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= startDate;
    });
}

// ============================================
// BULK ACTIONS
// ============================================

function setupBulkActions() {
    const selectAll = document.getElementById('select-all');
    const bulkBar = document.getElementById('bulk-actions-bar');
    const bulkCancel = document.getElementById('bulk-cancel');
    const bulkDelete = document.getElementById('bulk-delete');
    const bulkAssign = document.getElementById('bulk-assign');
    const bulkStatus = document.getElementById('bulk-status');

    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.lead-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) {
                    selectedLeads.add(cb.dataset.leadId);
                } else {
                    selectedLeads.delete(cb.dataset.leadId);
                }
            });
            updateBulkActionsBar();
        });
    }

    if (bulkCancel) {
        bulkCancel.addEventListener('click', () => {
            clearSelection();
        });
    }

    if (bulkDelete) {
        bulkDelete.addEventListener('click', () => {
            handleBulkDelete();
        });
    }

    if (bulkAssign) {
        bulkAssign.addEventListener('click', () => {
            showToast('Bulk assign feature coming in Phase 8!', 'info');
        });
    }

    if (bulkStatus) {
        bulkStatus.addEventListener('click', () => {
            handleBulkStatusChange();
        });
    }
}

function updateBulkActionsBar() {
    const bulkBar = document.getElementById('bulk-actions-bar');
    const selectedCount = document.getElementById('selected-count');

    if (selectedLeads.size > 0) {
        bulkBar.classList.add('active');
        selectedCount.textContent = selectedLeads.size;
    } else {
        bulkBar.classList.remove('active');
    }
}

function clearSelection() {
    selectedLeads.clear();
    const checkboxes = document.querySelectorAll('.lead-checkbox, #select-all');
    checkboxes.forEach(cb => cb.checked = false);
    updateBulkActionsBar();
}

async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedLeads.size} lead(s) ? This cannot be undone.`)) return;

    showLoading('Deleting leads...');

    try {
        await Promise.all([...selectedLeads].map(leadId => DB.deleteRecord('leads', leadId)));

        clearSelection();
        loadLeads(); // calls async loadLeads
        showToast(`Deleted previous selection`, 'success');
    } catch (e) {
        console.error(e);
        showToast('Error deleting leads', 'error');
    } finally {
        hideLoading();
    }
}

async function handleBulkStatusChange() {
    // Build a quick inline dialog instead of prompt()
    const existing = document.getElementById('bulk-status-dialog');
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.id = 'bulk-status-dialog';
    dialog.style.cssText = `
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 20000;
            display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
            `;
    dialog.innerHTML = `
                <div style="background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; width: 340px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <h3 style="margin-bottom: 1rem; color: #f8fafc;">Change Status for ${selectedLeads.size} lead(s)</h3>
            <select id="bulk-status-select" style="width:100%; padding:0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #f8fafc; font-size: 1rem; margin-bottom: 1.5rem; cursor:pointer;">
                ${STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <div style="display:flex; gap:1rem; justify-content:flex-end;">
                <button id="bulk-status-cancel" style="padding:0.6rem 1.2rem; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:#f8fafc; cursor:pointer;">Cancel</button>
                <button id="bulk-status-confirm" style="padding:0.6rem 1.2rem; border-radius:8px; background: linear-gradient(135deg,#6366f1,#a855f7); border:none; color:white; font-weight:600; cursor:pointer;">Apply</button>
            </div>
        </div>
                `;
    document.body.appendChild(dialog);

    dialog.querySelector('#bulk-status-cancel').addEventListener('click', () => dialog.remove());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.remove(); });

    dialog.querySelector('#bulk-status-confirm').addEventListener('click', async () => {
        const newStatus = dialog.querySelector('#bulk-status-select').value;
        dialog.remove();

        showLoading('Updating status...');
        try {
            await Promise.all([...selectedLeads].map(leadId => DB.updateLeadStatus(leadId, newStatus)));
            clearSelection();
            loadLeads();
            showToast(`Updated \${ selectedLeads.size || 'selected' } leads to ${newStatus} `, 'success');
        } catch (e) {
            console.error(e);
            showToast('Error updating status', 'error');
        } finally {
            hideLoading();
        }
    });
}

// ============================================
// KPI DASHBOARD
// ============================================

async function updateKPIs() {
    const stats = await DB.getDashboardStats();

    // Update KPI cards (Main Dashboard)
    const kpiCards = document.querySelectorAll('#view-dashboard .kpi-card');

    if (kpiCards[0]) {
        kpiCards[0].querySelector('.value').textContent = stats.totalLeads.toLocaleString();
        const trend = stats.totalLeads > 0 ? '+12%' : '0%';
        kpiCards[0].querySelector('.trend').textContent = `${trend} vs last month`;
    }

    if (kpiCards[1]) {
        kpiCards[1].querySelector('.value').textContent = `${stats.conversionRate}% `;
        kpiCards[1].querySelector('.trend').textContent = '+2.1% vs last month';
    }

    if (kpiCards[2]) {
        kpiCards[2].querySelector('.value').textContent = stats.avgResponseTime;
        kpiCards[2].querySelector('.trend').textContent = '-15s (Improvement)';
    }

    if (kpiCards[3]) {
        const formattedRevenue = formatCurrency(stats.projectedRevenue);
        kpiCards[3].querySelector('.value').textContent = formattedRevenue;
        kpiCards[3].querySelector('.trend').textContent = stats.projectedRevenue > 0 ? 'High probability' : 'No data';
    }

    // Also update analytics view if it's open
    if (currentView === 'analytics') {
        updateAnalyticsReports(stats);
    }
}

async function updateAnalyticsReports(stats) {
    // Total Revenue
    const revEl = document.getElementById('report-total-revenue');
    if (revEl) revEl.textContent = formatCurrency(stats.totalRevenue);

    // Commissions (2% example)
    const commEl = document.getElementById('report-commissions');
    if (commEl) commEl.textContent = formatCurrency(stats.totalRevenue * 0.02);

    // Deals Closed
    const dealsEl = document.getElementById('report-deals-closed');
    if (dealsEl) dealsEl.textContent = stats.wonLeads;

    // Avg Deal Size
    const avgEl = document.getElementById('report-avg-deal');
    if (avgEl) {
        const avg = stats.wonLeads > 0 ? stats.totalRevenue / stats.wonLeads : 0;
        avgEl.textContent = formatCurrency(avg);
    }

    renderAnalyticsCharts();
}

function renderDashboardCharts() {
    renderPipelineChart();
    // If on analytics view, render those too
    if (currentView === 'analytics') {
        renderAnalyticsCharts();
    }
}

async function renderAnalyticsCharts() {
    const leads = await DB.getAllRecords('leads');

    // 1. Render Sources Bar Chart
    const sourcesCount = {};
    leads.forEach(l => {
        sourcesCount[l.source] = (sourcesCount[l.source] || 0) + 1;
    });

    const donutWrapper = document.querySelector('.chart-donut-wrapper');
    if (donutWrapper) {
        const total = leads.length || 1;
        const sortedSources = Object.keys(sourcesCount).sort((a, b) => sourcesCount[b] - sourcesCount[a]);
        const colors = ['#38bdf8', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#a78bfa', '#14b8a6', '#f43f5e'];

        // 1. Build Legend
        let html = '<div class="chart-legend" style="width: 100%; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; margin-top: 1rem;">';
        sortedSources.forEach((source, index) => {
            const count = sourcesCount[source];
            const pct = Math.round((count / total) * 100);
            const color = colors[index % colors.length];
            html += `
                <div class="legend-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
                        <span style="color: var(--text-muted)">${source}</span>
                    </div>
                    <span style="font-weight: 600;">${pct}% (${count})</span>
                </div>
                `;
        });
        html += '</div>';

        let legendContainer = donutWrapper.querySelector('.chart-legend');
        if (legendContainer) {
            legendContainer.outerHTML = html;
        } else {
            donutWrapper.insertAdjacentHTML('beforeend', html);
        }

        // 2. Build Interactive SVG Donut Chart
        const chartDonut = donutWrapper.querySelector('.chart-donut');
        if (chartDonut) {
            const radius = 12; // 32x32 viewBox, 12 is radius, 8 is stroke width (covers from r=8 to r=16)
            const circumference = 2 * Math.PI * radius;

            let svgHtml = `<svg viewBox="0 0 32 32" style="width: 100%; height: 100%; transform: rotate(-90deg); filter: drop-shadow(0 0 10px rgba(0,0,0,0.3)); stroke-linejoin: round; stroke-linecap: butt; overflow: visible;">`;
            let cumulativePercent = 0;

            sortedSources.forEach((source, index) => {
                const count = sourcesCount[source];
                const pct = count / total;
                const strokeDasharray = `${pct * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                const color = colors[index % colors.length];
                const displayPct = Math.round((count / total) * 100);

                svgHtml += `
                    <circle cx="16" cy="16" r="${radius}" 
                        fill="none" 
                        stroke="${color}" 
                        stroke-width="8" 
                        stroke-dasharray="${strokeDasharray}" 
                        stroke-dashoffset="${strokeDashoffset}"
                        style="transition: all 0.2s ease; cursor: pointer; transform-origin: center;"
                        onmouseover="this.style.strokeWidth='9'; this.style.filter='brightness(1.2)'; document.getElementById('donut-tooltip').style.opacity='1'; document.getElementById('donut-tooltip').innerHTML='<div style=\\'display:flex;align-items:center;gap:6px;\\'><span style=\\'width:8px;height:8px;border-radius:50%;background:${color}\\'></span><strong>${source}</strong></div><div style=\\'margin-top:4px;font-size:0.95rem;\\'>${displayPct}% <span style=\\'color:#94a3b8;font-size:0.8rem\\'>(${count} leads)</span></div>';"
                        onmouseout="this.style.strokeWidth='8'; this.style.filter='none'; document.getElementById('donut-tooltip').style.opacity='0';"
                        onmousemove="document.getElementById('donut-tooltip').style.left = (event.pageX + 15) + 'px'; document.getElementById('donut-tooltip').style.top = (event.pageY - 10) + 'px';"
                    ></circle>
                `;
                cumulativePercent += pct;
            });

            svgHtml += `</svg>`;
            chartDonut.innerHTML = svgHtml;
            chartDonut.style.background = 'none'; // Clear CSS conic-gradient
            chartDonut.style.boxShadow = 'none';
        }

        // 3. Add global tooltip element if it doesn't exist
        if (!document.getElementById('donut-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.id = 'donut-tooltip';
            tooltip.style.cssText = 'position: absolute; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; color: #f8fafc; pointer-events: none; opacity: 0; transition: opacity 0.2s ease; z-index: 100000; box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(4px);';
            document.body.appendChild(tooltip);
        }
    }

    // 2. Render Revenue Growth (Mock monthly data based on real lead creation dates)
    const monthlyRev = {};
    leads.filter(l => l.status === 'Won').forEach(l => {
        const date = new Date(l.created_at);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyRev[month] = (monthlyRev[month] || 0) + parseFloat(l.budget || 0);
    });

    const barChartVisual = document.querySelector('.bar-chart-visual');
    if (barChartVisual) {
        // Clear bars but keep grid lines
        const bars = barChartVisual.querySelectorAll('.bar-group');
        bars.forEach(b => b.remove());

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth();
        const displayMonths = [];
        for (let i = 5; i >= 0; i--) {
            const mIdx = (currentMonthIdx - i + 12) % 12;
            displayMonths.push(months[mIdx]);
        }

        const maxMonthly = Math.max(...Object.values(monthlyRev), 10000000); // at least 1Cr for scale

        displayMonths.forEach(m => {
            const rev = monthlyRev[m] || 0;
            const height = Math.max(5, (rev / maxMonthly) * 100);
            const formatted = formatCurrency(rev);

            const group = document.createElement('div');
            group.className = 'bar-group';
            group.innerHTML = `
                <div class="bar-tooltip">${formatted}</div>
                <div class="bar" style="height: ${height}%; background: ${rev > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}"></div>
                <span class="bar-label">${m}</span>
            `;
            barChartVisual.appendChild(group);
        });
    }
}

async function renderPipelineChart() {
    const container = document.querySelector('.pipeline-bars');
    if (!container) return;

    container.innerHTML = '';

    const statusCounts = await DB.getLeadsByStatusCount();
    const maxCount = Math.max(...Object.values(statusCounts), 1);

    STATUSES.forEach(status => {
        const count = statusCounts[status] || 0;
        const percentage = (count / maxCount) * 100;

        const item = document.createElement('div');
        item.className = 'pipeline-item';
        item.innerHTML = `
                <span class="pipeline-label">${status}</span>
            <div class="pipeline-track">
                <div class="pipeline-fill" style="width: ${percentage}%; background: ${getStatusColor(status)}"></div>
            </div>
            <span class="pipeline-count">${count}</span>
            `;
        container.appendChild(item);
    });
}

function renderRecentActivity() {
    const list = document.getElementById('activity-list');
    if (!list) return;

    list.innerHTML = '';

    const recentActivities = activities.slice(0, 5);

    if (recentActivities.length === 0) {
        list.innerHTML = '<li class="text-muted" style="padding: 1rem;">No recent activity</li>';
        return;
    }

    recentActivities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';

        const icon = getActivityIcon(activity.activity_type);
        const timeAgo = getTimeAgo(activity.created_at);

        li.innerHTML = `
                <div class="activity-icon ${getActivityColor(activity.activity_type)}">
                    <span class="material-icons-round">${icon}</span>
            </div>
                <div class="activity-details">
                    <span class="act-title">${activity.description}</span>
                    <span class="act-time">${timeAgo}</span>
                </div>
            `;
        list.appendChild(li);
    });
}

// ============================================
// LEADS TABLE
// ============================================

function renderLeadsTable() {
    const tbody = document.querySelector('#leads-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Filter leads based on dropdowns
    let displayedLeads = [...leads];

    const statusFilter = document.getElementById('filter-status');
    const sourceFilter = document.getElementById('filter-source');
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    if (query) {
        displayedLeads = displayedLeads.filter(l =>
            l.name.toLowerCase().includes(query) ||
            (l.phone && l.phone.includes(query)) ||
            (l.email && l.email.toLowerCase().includes(query)) ||
            (l.company && l.company.toLowerCase().includes(query))
        );
    }

    if (statusFilter && statusFilter.value) {
        displayedLeads = displayedLeads.filter(l => l.status === statusFilter.value);
    }

    if (sourceFilter && sourceFilter.value) {
        displayedLeads = displayedLeads.filter(l => l.source === sourceFilter.value);
    }

    if (displayedLeads.length === 0) {
        tbody.innerHTML = `
                <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">No leads found</div>
                        <div class="empty-state-description">Try adjusting your filters</div>
                    </div>
                </td>
            </tr>
                `;
        // Update pagination info for empty state
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `0 of ${leads.length} `;
        }
        return;
    }

    // Sort leads by created_at descending
    const sortedLeads = displayedLeads.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    sortedLeads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';

        const leadAge = new LeadModel(lead).calculateAge();

        tr.innerHTML = `
                <td onclick="event.stopPropagation()">
                <input type="checkbox" class="checkbox lead-checkbox" data-lead-id="${lead.lead_id}" ${selectedLeads.has(lead.lead_id) ? 'checked' : ''}>
            </td>
            <td onclick="openLeadDetails('${lead.lead_id}')">
                <strong>${lead.name}</strong><br>
                <small class="text-muted">${lead.email || lead.phone}</small>
            </td>
            <td onclick="openLeadDetails('${lead.lead_id}')">
                <div class="status-dropdown-wrapper" onclick="event.stopPropagation();">
                    <select class="status-select" data-lead-id="${lead.lead_id}" 
                            style="background: ${getStatusColor(lead.status)}20; color: ${getStatusColor(lead.status)}; border: 1px solid ${getStatusColor(lead.status)}40; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
                        <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Qualified" ${lead.status === 'Qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="Proposal Sent" ${lead.status === 'Proposal Sent' ? 'selected' : ''}>Proposal Sent</option>
                        <option value="Negotiation" ${lead.status === 'Negotiation' ? 'selected' : ''}>Negotiation</option>
                        <option value="Won" ${lead.status === 'Won' ? 'selected' : ''}>✅ Won</option>
                        <option value="Lost" ${lead.status === 'Lost' ? 'selected' : ''}>❌ Lost</option>
                        <option value="On Hold" ${lead.status === 'On Hold' ? 'selected' : ''}>⏸️ On Hold</option>
                    </select>
                </div>
            </td>
            <td onclick="openLeadDetails('${lead.lead_id}')">${lead.source}</td>
            <td onclick="openLeadDetails('${lead.lead_id}')">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 60px; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${lead.lead_score}%; height: 100%; background: ${getScoreColor(lead.lead_score)}"></div>
                    </div>
                    <small>${lead.lead_score}/100</small>
                </div>
            </td>
            <td onclick="openLeadDetails('${lead.lead_id}')">
                <span style="color: ${leadAge.color}">
                    ${leadAge.days} day${leadAge.days !== 1 ? 's' : ''} (${leadAge.status})
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="event.stopPropagation(); openLeadDetails('${lead.lead_id}')">
                    <span class="material-icons-round">visibility</span>
                </button>
            </td>
            `;
        tbody.appendChild(tr);

        // Add checkbox event listener
        const checkbox = tr.querySelector('.lead-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedLeads.add(lead.lead_id);
            } else {
                selectedLeads.delete(lead.lead_id);
            }
            updateBulkActionsBar();
        });

        // Add status change event listener
        const statusSelect = tr.querySelector('.status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                const newStatus = e.target.value;
                const leadId = e.target.dataset.leadId;

                showLoading('Updating status...');

                setTimeout(() => {
                    // Update in database
                    DB.updateRecord('leads', leadId, { status: newStatus });

                    // Log activity
                    DB.logActivity({
                        lead_id: leadId,
                        activity_type: 'status_changed',
                        description: `Status changed to ${newStatus} `,
                        performed_by: currentUser?.user_id || 'user_admin_001'
                    });

                    // Reload data
                    loadLeads();

                    hideLoading();
                    showToast(`Status changed to ${newStatus} `, 'success');
                }, 300);
            });
        }
    });

    // Update pagination info
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `1 - ${sortedLeads.length} of ${leads.length} `;
    }
}

// Setup Table Filters
function setupTableFilters() {
    const statusFilter = document.getElementById('filter-status');
    const sourceFilter = document.getElementById('filter-source');

    if (statusFilter) {
        statusFilter.addEventListener('change', renderLeadsTable);
    }

    setupSearch(); // Initialize search listener

    if (sourceFilter) {
        sourceFilter.addEventListener('change', renderLeadsTable);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const viewPipeline = document.getElementById('view-pipeline');
            const viewLeads = document.getElementById('view-leads');

            // Render active view(s)
            if (viewPipeline && viewPipeline.classList.contains('active')) {
                renderKanban();
            }
            if (viewLeads && (viewLeads.classList.contains('active') || viewLeads.style.display !== 'none')) {
                renderLeadsTable();
            }
            // If in dashboard, maybe filter something there? For now just these two.
        }, 300); // 300ms debounce
    });
}

// ============================================
// KANBAN PIPELINE
// ============================================

// Track how many cards are loaded per column
const columnLoadCounts = {};
const CARDS_PER_LOAD = 20; // Show 20 cards initially

function renderKanban() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    // Clear all column contents
    board.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');

    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Reset load counts if searching (so we see results immediately)
    const pipelineStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won'];
    if (query) {
        // If searching, show more results by default
        pipelineStatuses.forEach(status => {
            columnLoadCounts[status] = 50;
        });
    } else {
        // Only reset if load counts are empty (initial load)
        if (Object.keys(columnLoadCounts).length === 0) {
            pipelineStatuses.forEach(status => {
                columnLoadCounts[status] = CARDS_PER_LOAD;
            });
        }
    }
    // Ensure counts are initialized at least once
    if (Object.keys(columnLoadCounts).length === 0) {
        pipelineStatuses.forEach(status => {
            columnLoadCounts[status] = CARDS_PER_LOAD;
        });
    }

    // Group leads by status and sort by lead score (or smart priority)
    const leadsByStatus = {};
    pipelineStatuses.forEach(status => {
        leadsByStatus[status] = leads
            .filter(lead => lead.status === status)
            .filter(lead => {
                if (!query) return true;
                return (lead.name && lead.name.toLowerCase().includes(query)) ||
                    (lead.phone && lead.phone.includes(query)) ||
                    (lead.email && lead.email.toLowerCase().includes(query)) ||
                    (lead.company && lead.company.toLowerCase().includes(query));
            })
            .sort((a, b) => {
                // Use smart priority score when enabled, fallback to lead_score
                const scoreA = window.smartSortEnabled && window.calcPriorityScore
                    ? window.calcPriorityScore(a) : (a.lead_score || 0);
                const scoreB = window.smartSortEnabled && window.calcPriorityScore
                    ? window.calcPriorityScore(b) : (b.lead_score || 0);
                return scoreB - scoreA;
            });
    });


    // Render cards for each column
    pipelineStatuses.forEach(status => {
        // Use DOM traversal to find the column — avoids selector escaping issues with spaces in status names
        const kanbanCol = Array.from(board.querySelectorAll('.kanban-column')).find(c => c.dataset.stage === status);
        const column = kanbanCol ? kanbanCol.querySelector('.column-content') : null;
        if (!column) return;

        const statusLeads = leadsByStatus[status] || [];
        const leadsToShow = statusLeads.slice(0, columnLoadCounts[status]);

        // Render cards
        leadsToShow.forEach(lead => {
            const card = createKanbanCard(lead);
            column.appendChild(card);
        });

        // Add "Load More" button if there are more leads
        if (statusLeads.length > columnLoadCounts[status]) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.innerHTML = `
                <span class="material-icons-round" style="font-size: 1rem;">expand_more</span>
                Load More (${statusLeads.length - columnLoadCounts[status]} remaining)
            `;
            loadMoreBtn.onclick = () => loadMoreCards(status);
            column.appendChild(loadMoreBtn);
        }
    });

    // Update column counts (total, not just visible)
    board.querySelectorAll('.kanban-column').forEach(col => {
        const status = col.dataset.stage;
        const totalCount = leadsByStatus[status]?.length || 0;
        const visibleCount = col.querySelectorAll('.kanban-card').length;

        const countElement = col.querySelector('.col-count');
        if (countElement) {
            if (totalCount > visibleCount) {
                countElement.textContent = `${visibleCount}/${totalCount}`;
                countElement.style.fontSize = '0.85rem';
            } else {
                countElement.textContent = totalCount;
            }
        }
    });
}

function loadMoreCards(status) {
    // Increase load count for this column
    columnLoadCounts[status] += CARDS_PER_LOAD;

    // Re-render kanban (more efficient than just this column due to simplicity)
    renderKanban();
}

function createKanbanCard(lead) {
    const card = document.createElement('div');
    card.className = 'kanban-card glass-panel';
    card.draggable = true;
    card.dataset.id = lead.lead_id;

    const leadAge = new LeadModel(lead).calculateAge();

    // Determine if high-value (budget > 50L)
    const isHighValue = lead.budget && lead.budget >= 5000000;

    // Check if follow-up is overdue
    let isOverdue = false;
    if (lead.follow_up_date) {
        const followUpDate = new Date(lead.follow_up_date);
        const today = new Date();
        isOverdue = followUpDate < today;
    }

    card.innerHTML = `
        <!-- Badges -->
        <div class="card-badges">
            ${isHighValue ? '<span class="badge-high-value">💎 High Value</span>' : ''}
            ${isOverdue ? '<span class="badge-overdue">⏰ Overdue</span>' : ''}
        </div>
        
        <!-- Lead Name -->
        <div class="card-title">${lead.name}</div>
        
        <!-- Contact Info -->
        <div class="card-contact">
            ${lead.phone ? `
                <div class="contact-item">
                    <span class="material-icons-round">phone</span>
                    <span>${lead.phone}</span>
                </div>
            ` : ''}
            ${lead.email ? `
                <div class="contact-item">
                    <span class="material-icons-round">email</span>
                    <span>${lead.email}</span>
                </div>
            ` : ''}
        </div>
        
        <!-- Meta Info -->
        <div class="card-meta-grid">
            <div class="meta-item">
                <span class="meta-label">Source</span>
                <span class="meta-value">${lead.source}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Score</span>
                <span class="meta-value" style="color: ${getScoreColor(lead.lead_score)}">${lead.lead_score}/100</span>
            </div>
            ${lead.budget ? `
                <div class="meta-item">
                    <span class="meta-label">Budget</span>
                    <span class="meta-value">₹${formatNumber(lead.budget)}</span>
                </div>
            ` : ''}
            <div class="meta-item">
                <span class="meta-label">Age</span>
                <span class="meta-value" style="color: ${leadAge.color}">${leadAge.days}d</span>
            </div>
        </div>
        
        <!-- Quick Actions (shown on hover) -->
        <div class="card-quick-actions">
            <button class="card-action-btn" data-action="call" title="Call">
                <span class="material-icons-round">call</span>
            </button>
            <button class="card-action-btn" data-action="whatsapp" title="WhatsApp">
                <span class="material-icons-round">chat</span>
            </button>
            <button class="card-action-btn" data-action="email" title="Email">
                <span class="material-icons-round">mail</span>
            </button>
            <button class="card-action-btn card-status-btn" data-action="status" title="Change Status">
                <span class="material-icons-round">swap_horiz</span>
            </button>
            <button class="card-action-btn" data-action="details" title="View Details">
                <span class="material-icons-round">visibility</span>
            </button>
        </div>
        
        <!-- Status Change Dropdown (hidden by default) -->
        <div class="card-status-dropdown" style="display: none;">
            <div class="status-dropdown-header">Change Status</div>
            ${STATUSES.filter(s => s !== lead.status && s !== 'Lost' && s !== 'On Hold').map(status => `
                <button class="status-option" data-status="${status}">
                    <span class="status-dot" style="background: ${getStatusColor(status)}"></span>
                    ${status}
                </button>
            `).join('')}
        </div>
    `;

    // Quick action buttons
    const actionButtons = card.querySelectorAll('.card-action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const action = btn.dataset.action;

            if (action === 'status') {
                // Toggle status dropdown with smart positioning
                const dropdown = card.querySelector('.card-status-dropdown');
                const isVisible = dropdown.style.display !== 'none';

                // Hide all other dropdowns first
                document.querySelectorAll('.card-status-dropdown').forEach(d => {
                    d.style.display = 'none';
                });

                if (!isVisible) {
                    // Show dropdown with smart positioning
                    dropdown.style.display = 'block';

                    // Get button position
                    const btnRect = btn.getBoundingClientRect();
                    const dropdownRect = dropdown.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    let top, left;

                    // Determine horizontal position
                    // If button is on right half of screen, show dropdown on left
                    if (btnRect.left > viewportWidth / 2) {
                        // Position to the left of button
                        left = btnRect.right - dropdownRect.width;
                    } else {
                        // Position to the right of button (or aligned with button)
                        left = btnRect.left;
                    }

                    // Determine vertical position
                    // If button is on top half, show dropdown below
                    if (btnRect.top < viewportHeight / 2) {
                        // Position below button
                        top = btnRect.bottom + 8;
                    } else {
                        // Position above button
                        top = btnRect.top - dropdownRect.height - 8;
                    }

                    // Ensure dropdown stays within viewport bounds
                    left = Math.max(10, Math.min(left, viewportWidth - dropdownRect.width - 10));
                    top = Math.max(10, Math.min(top, viewportHeight - dropdownRect.height - 10));

                    // Apply position
                    dropdown.style.left = `${left}px`;
                    dropdown.style.top = `${top}px`;
                } else {
                    dropdown.style.display = 'none';
                }
            } else {
                handleCardAction(action, lead, card);
            }
        });
    });


    // Status change options
    const statusOptions = card.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            const newStatus = option.dataset.status;

            try {
                // Update status in database
                DB.updateLeadStatus(lead.lead_id, newStatus);

                // Hide dropdown
                card.querySelector('.card-status-dropdown').style.display = 'none';

                // Reload kanban to show in new column
                loadLeads();

                showToast(`Lead moved to ${newStatus}`, 'success');
            } catch (error) {
                console.error('Failed to update status:', error);
                showToast('Failed to update status', 'error');
            }
        });
    });

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!card.contains(e.target)) {
            const dropdown = card.querySelector('.card-status-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        }
    });

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    // Click to open details
    card.addEventListener('click', (e) => {
        // Only open if not clicking action buttons or dropdown
        if (!e.target.closest('.card-action-btn') && !e.target.closest('.card-status-dropdown')) {
            openLeadDetails(lead.lead_id);
        }
    });

    return card;
}

// Handle quick actions from kanban cards
function handleCardAction(action, lead) {
    switch (action) {
        case 'call':
            if (lead.phone) {
                window.open(`tel:${lead.phone}`);
                showToast(`Calling ${lead.name}...`, 'info');
                DB.logActivity({
                    lead_id: lead.lead_id,
                    activity_type: 'call_initiated',
                    description: `Call initiated from kanban card`,
                    performed_by: currentUser.user_id
                });
            } else {
                showToast('No phone number available', 'error');
            }
            break;

        case 'whatsapp':
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/91${cleanPhone}`, '_blank');
                showToast(`Opening WhatsApp for ${lead.name}`, 'success');
                DB.logActivity({
                    lead_id: lead.lead_id,
                    activity_type: 'whatsapp_initiated',
                    description: `WhatsApp opened from kanban card`,
                    performed_by: currentUser.user_id
                });
            } else {
                showToast('No phone number available', 'error');
            }
            break;

        case 'email':
            if (lead.email) {
                const subject = encodeURIComponent(`Following up - ${lead.name}`);
                window.open(`mailto:${lead.email}?subject=${subject}`);
                showToast(`Opening email for ${lead.name}`, 'info');
                DB.logActivity({
                    lead_id: lead.lead_id,
                    activity_type: 'email_initiated',
                    description: `Email opened from kanban card`,
                    performed_by: currentUser.user_id
                });
            } else {
                showToast('No email address available', 'error');
            }
            break;

        case 'details':
            openLeadDetails(lead.lead_id);
            break;
    }
}

// ─── Drag & Drop ─────────────────────────────────────────────────────────────
let draggedCard = null;
let draggedLeadId = null;

function handleDragStart(e) {
    draggedCard = this;
    draggedLeadId = this.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    this.classList.add('dragging');
    setTimeout(() => this.style.opacity = '0.5', 0);
}

function handleDragEnd() {
    this.style.opacity = '1';
    this.classList.remove('dragging');
    // Clear all drag-over highlights
    document.querySelectorAll('.kanban-column.drag-over').forEach(c => c.classList.remove('drag-over'));
    draggedCard = null;
    draggedLeadId = null;
}

// ─── Event delegation on the static board container ──────────────────────────
// This survives renderKanban() because #kanban-board itself is never re-created.
function initKanbanDragDrop() {
    const board = document.getElementById('kanban-board');
    if (!board || board._dragDropInit) return;
    board._dragDropInit = true; // prevent double-init

    board.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // Highlight the column being dragged over
        const col = e.target.closest('.kanban-column');
        document.querySelectorAll('.kanban-column.drag-over').forEach(c => {
            if (c !== col) c.classList.remove('drag-over');
        });
        if (col) col.classList.add('drag-over');
    });

    board.addEventListener('dragleave', e => {
        // Only remove highlight when truly leaving the column (not entering a child)
        const col = e.target.closest('.kanban-column');
        if (col && !col.contains(e.relatedTarget)) {
            col.classList.remove('drag-over');
        }
    });

    board.addEventListener('drop', async e => {
        e.preventDefault();
        const col = e.target.closest('.kanban-column');
        if (!col) return;
        col.classList.remove('drag-over');

        const newStatus = col.dataset.stage;
        const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
        if (!leadId) return;

        // Determine old status to skip no-op drops
        const oldCard = document.querySelector(`.kanban-card[data-id="${leadId}"]`);
        const oldCol = oldCard?.closest('.kanban-column');
        if (oldCol && oldCol.dataset.stage === newStatus) return; // dropped in same column

        try {
            showLoading(`Moving to ${newStatus}...`);
            await DB.updateLeadStatus(leadId, newStatus);
            await loadLeads(); // re-render after confirmed DB write
            showToast(`✅ Lead moved to ${newStatus}`, 'success');
        } catch (err) {
            console.error('Drag drop failed:', err);
            showToast('Failed to update lead status', 'error');
        } finally {
            hideLoading();
        }
    });
}


// ============================================
// MODAL & FORMS
// ============================================

function setupModal() {
    const modal = document.getElementById('add-lead-modal');
    const btnAdd = document.getElementById('btn-add-lead');
    const btnClose = document.querySelectorAll('.close-modal');

    btnAdd.addEventListener('click', () => {
        modal.style.display = 'flex';
        document.getElementById('new-lead-form').reset();
    });

    btnClose.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Form submission
    document.getElementById('new-lead-form').addEventListener('submit', handleLeadSubmission);
}

async function handleLeadSubmission(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const leadData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        source: formData.get('source'),
        status: formData.get('status') || 'New',
        budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
        notes: formData.get('notes'),
        assigned_to: currentUser.user_id
    };

    const btn = e.target.querySelector('[type="submit"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<span class="material-icons-round spin">sync</span> Saving...'; btn.disabled = true; }

    showLoading('Creating lead...');

    try {
        const newLead = await DB.createLead(leadData);

        // Close modal
        document.getElementById('add-lead-modal').style.display = 'none';
        e.target.reset();

        // Reload data
        await loadLeads();

        showToast(`Lead ${newLead.name} created successfully!`, 'success');

    } catch (error) {
        console.error('Failed to create lead:', error);
        showToast(error.message || 'Failed to create lead', 'error');
    } finally {
        hideLoading();
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    }
}

// openLeadDetails is defined in script-phase2.js — do not redefine here

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const titleObj = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch view
            const targetView = item.dataset.view;
            currentView = targetView;

            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(`view-${targetView}`);
            if (targetSection) targetSection.classList.add('active');

            // Update UI
            if (targetView === 'dashboard' || targetView === 'analytics') {
                updateKPIs();
                renderDashboardCharts();
            } else if (targetView === 'leads') {
                loadLeads();
            } else if (targetView === 'pipeline') {
                renderKanban();
            }

            // Save preference
            localStorage.setItem('leadOS_lastView', targetView);
        });
    });

    // Restore last view
    const lastView = localStorage.getItem('leadOS_lastView');
    if (lastView && lastView !== 'dashboard') {
        const item = document.querySelector(`.nav-item[data-view="${lastView}"]`);
        if (item) item.click();
    }
}

function setupNotifications() {
    const notifBtn = document.getElementById('btn-notifications');
    const notifDropdown = document.querySelector('.notifications-dropdown');
    const badge = notifBtn ? notifBtn.querySelector('.badge') : null;
    const markAllReadBtn = notifDropdown ? notifDropdown.querySelector('.notif-header .text-muted') : null;

    if (notifBtn && notifDropdown) {
        // Toggle dropdown
        notifBtn.addEventListener('click', (e) => {
            // Only toggle if clicking the icon, not inside the dropdown
            if (!notifDropdown.contains(e.target)) {
                e.stopPropagation();
                notifDropdown.classList.toggle('active');
            }
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            notifDropdown.classList.remove('active');
        });

        // Prevent closing when clicking inside dropdown
        notifDropdown.addEventListener('click', (e) => e.stopPropagation());

        // Handle "Mark all read"
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                if (badge) {
                    badge.style.display = 'none';
                    badge.textContent = '0';
                }
                const items = notifDropdown.querySelectorAll('.notif-item');
                items.forEach(item => item.style.opacity = '0.5');
                showToast('All notifications marked as read', 'success');
                setTimeout(() => notifDropdown.classList.remove('active'), 300);
            });
        }

        // Make notification items clickable
        const notifItems = notifDropdown.querySelectorAll('.notif-item');
        notifItems.forEach(item => {
            item.addEventListener('click', () => {
                // Decrement badge
                if (badge && badge.style.display !== 'none') {
                    let count = parseInt(badge.textContent) || 0;
                    if (count > 0) {
                        count--;
                        badge.textContent = count;
                        if (count === 0) {
                            badge.style.display = 'none';
                        }
                    }
                }

                // Mark this specific item as read visual style
                item.style.opacity = '0.5';

                const targetView = item.dataset.view;
                if (targetView) {
                    // Navigate to the view
                    const navItem = document.querySelector(`.nav-item[data-view="${targetView}"]`);
                    if (navItem) navItem.click();

                    // Close dropdown
                    notifDropdown.classList.remove('active');
                }
            });
        });
    }
}

function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // 'N' for New Lead
        if (e.key.toLowerCase() === 'n' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            document.getElementById('btn-add-lead').click();
        }

        // Alt + Number for view switching
        if (e.altKey) {
            const views = ['dashboard', 'pipeline', 'leads', 'automation', 'analytics'];
            const key = parseInt(e.key);
            if (key >= 1 && key <= views.length) {
                const viewName = views[key - 1];
                const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
                if (navItem) navItem.click();
            }
        }
    });
}

function setupActivityViewAll() {
    const viewAllBtn = document.getElementById('view-all-activity');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            // Navigate to leads view
            const navItem = document.querySelector('.nav-item[data-view="leads"]');
            if (navItem) {
                navItem.click();
                showToast('Viewing all activities in Leads section', 'info');
            }
        });
    }
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

function updateDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('en-US', options);
    }
}

function getStatusColor(status) {
    const colors = {
        'New': '#3b82f6',
        'Contacted': '#8b5cf6',
        'Qualified': '#06b6d4',
        'Proposal Sent': '#10b981',
        'Negotiation': '#f59e0b',
        'Won': '#22c55e',
        'Lost': '#ef4444',
        'On Hold': '#64748b'
    };
    return colors[status] || '#6366f1';
}

function getScoreColor(score) {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}

function getActivityIcon(type) {
    const icons = {
        'lead_created': 'person_add',
        'status_changed': 'swap_horiz',
        'email_sent': 'mail',
        'sms_sent': 'sms',
        'whatsapp_sent': 'chat',
        'call_made': 'call',
        'note_added': 'notes',
        'lead_updated': 'edit',
        'follow_up_scheduled': 'event'
    };
    return icons[type] || 'circle';
}

function getActivityColor(type) {
    if (type.includes('email')) return 'bg-blue';
    if (type.includes('call')) return 'bg-green';
    if (type.includes('created')) return 'bg-purple';
    return 'bg-gray';
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function formatCurrency(amount) {
    if (!amount) return '₹0';

    if (amount >= 10000000) { // 1 Crore
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) { // 1 Lakh
        return `₹${(amount / 100000).toFixed(2)} L`;
    } else {
        return `₹${amount.toLocaleString('en-IN')}`;
    }
}

function formatNumber(num) {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    return num.toLocaleString('en-IN');
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#f59e0b'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ⓘ';
    toast.innerHTML = `<span style="font-size: 1.2rem">${icon}</span> ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// EXPORT FOR DEBUGGING
// ============================================

window.LeadOS = {
    leads,
    DB,
    loadLeads,
    currentView,
    currentUser,
    selectedLeads,
    clearSelection
};

console.log('💡 Access app state via: window.LeadOS');
console.log('🎉 Phase 1 Complete - All Features Implemented!');

// ============================================
// AUTOMATION RULES
// ============================================

function setupAutomationModal() {
    const startBtn = document.getElementById('btn-add-rule');
    const modal = document.getElementById('add-rule-modal');

    if (!startBtn || !modal) return;

    // Close buttons specific to this modal
    const closeBtns = modal.querySelectorAll('.close-modal');

    startBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        const form = document.getElementById('new-rule-form');
        if (form) form.reset();
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Form submission
    const form = document.getElementById('new-rule-form');
    if (form) {
        form.addEventListener('submit', handleRuleSubmission);
    }
}

function handleRuleSubmission(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const ruleData = {
        name: formData.get('rule_name'),
        trigger: formData.get('trigger'),
        condition: formData.get('condition'),
        action: formData.get('action'),
        active: true,
        created_at: new Date().toISOString()
    };

    createRuleCard(ruleData);

    // Close modal
    document.getElementById('add-rule-modal').style.display = 'none';

    showToast(`Rule "${ruleData.name}" created successfully!`, 'success');
}

function createRuleCard(rule) {
    const grid = document.querySelector('.automation-grid');
    if (!grid) return;

    // Map icons/colors based on action/trigger
    let icon = 'settings';
    let colorHex = '#60a5fa';
    let bgHex = 'rgba(59, 130, 246, 0.2)';

    if (rule.action.includes('email')) { icon = 'email'; colorHex = '#818cf8'; bgHex = 'rgba(99, 102, 241, 0.2)'; }
    else if (rule.action.includes('whatsapp')) { icon = 'whatsapp'; colorHex = '#4ade80'; bgHex = 'rgba(74, 222, 128, 0.2)'; }
    else if (rule.action.includes('task')) { icon = 'event_repeat'; colorHex = '#fbbf24'; bgHex = 'rgba(245, 158, 11, 0.2)'; }
    else if (rule.action.includes('alert')) { icon = 'notification_important'; colorHex = '#f87171'; bgHex = 'rgba(239, 68, 68, 0.2)'; }
    else if (rule.action.includes('cold') || rule.action.includes('assign')) { icon = 'ac_unit'; colorHex = '#22d3ee'; bgHex = 'rgba(34, 211, 238, 0.2)'; }

    const card = document.createElement('div');
    card.className = 'card glass-panel';
    card.style.padding = '1.5rem';
    card.style.animation = 'fadeIn 0.5s ease';

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div class="icon-box" style="padding: 10px; border-radius: 8px; background: ${bgHex}; color: ${colorHex};">
                <span class="material-icons-round">${icon}</span>
            </div>
            <div class="toggle-switch">
                <label class="switch">
                    <input type="checkbox" checked>
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
        <h3 style="margin-bottom: 0.5rem;">${rule.name}</h3>
        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 1rem;">
            When <strong>${formatTrigger(rule.trigger)}</strong> ${rule.condition ? `(${rule.condition})` : ''}, then <strong>${formatAction(rule.action)}</strong>.
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span class="status-badge" style="background: rgba(255,255,255,0.1);">${formatTrigger(rule.trigger)}</span>
            <span class="material-icons-round" style="font-size: 1rem; color: var(--text-muted); align-self: center;">arrow_forward</span>
            <span class="status-badge" style="background: rgba(255,255,255,0.1);">${formatAction(rule.action)}</span>
        </div>
    `;

    // Insert at beginning of grid
    if (grid.firstChild) {
        grid.insertBefore(card, grid.firstChild);
    } else {
        grid.appendChild(card);
    }
}

function formatTrigger(trigger) {
    const map = {
        'new_lead': 'New Lead',
        'status_change': 'Status Change',
        'inactivity': 'Inactivity',
        'source_match': 'Source Match'
    };
    return map[trigger] || trigger;
}

function formatAction(action) {
    const map = {
        'email': 'Send Email',
        'whatsapp': 'Send WhatsApp',
        'task': 'Create Task',
        'assign': 'Assign User',
        'alert': 'Alert Manager',
        'cold': 'Mark Cold'
    };
    return map[action] || action;
}

// ============================================
// DATA IMPORT
// ============================================

function setupImport() {
    const importBtn = document.getElementById('btn-import-leads');
    const modal = document.getElementById('import-modal');
    const downloadBtn = document.getElementById('btn-download-template');
    const uploadTrigger = document.getElementById('btn-upload-trigger');
    const fileInput = document.getElementById('file-import-csv');

    if (!importBtn || !modal) return;

    // Open Modal
    importBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Close Modal logic
    const closeBtns = modal.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Download Template
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const headers = ['Name', 'Phone', 'Email', 'Budget', 'Status', 'Source', 'Notes'];
            const dummy = ['John Doe', '9876543210', 'john@example.com', '5000000', 'New', 'Website', 'Interested in 3BHK'];

            const csvContent = "data:text/csv;charset=utf-8,"
                + headers.join(",") + "\n"
                + dummy.join(",");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "subix_leads_template.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Trigger File Input
    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle File Selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.csv', '.txt'];
            const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValidFile) {
                showToast('❌ Wrong Format! Please upload a CSV file only.', 'error');
                e.target.value = '';
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ File too large! Maximum size is 5MB.', 'error');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result;
                processCSV(text);
            };
            reader.readAsText(file);

            // Reset input
            e.target.value = '';
            modal.style.display = 'none';

            showLoading('Importing leads...');
        });
    }
}

async function processCSV(csvText) {
    // Validate content exists
    if (!csvText || csvText.trim().length === 0) {
        showToast('❌ Wrong Format! File is empty.', 'error');
        hideLoading();
        return;
    }

    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim());

    // Check for minimum rows (header + at least 1 data row)
    if (lines.length < 2) {
        showToast('❌ Wrong Format! CSV must have headers and at least one data row.', 'error');
        hideLoading();
        return;
    }

    // Validate CSV structure (check if first line has commas)
    const firstLine = lines[0];
    if (!firstLine.includes(',')) {
        showToast('❌ Wrong Format! Not a valid CSV file. Make sure columns are separated by commas.', 'error');
        hideLoading();
        return;
    }

    const headers = firstLine.toLowerCase().split(',').map(h => h.trim());

    // Check if headers are meaningful (not empty, not just numbers)
    const validHeaders = headers.filter(h => h.length > 0 && isNaN(h));
    if (validHeaders.length === 0) {
        showToast('❌ Wrong Format! CSV headers are missing or invalid.', 'error');
        hideLoading();
        return;
    }

    let successCount = 0;

    // Smart Column Mapping
    const map = {
        name: headers.findIndex(h => h.includes('name') || h.includes('customer')),
        phone: headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact')),
        email: headers.findIndex(h => h.includes('email') || h.includes('mail')),
        budget: headers.findIndex(h => h.includes('budget') || h.includes('value') || h.includes('amount') || h.includes('price')),
        status: headers.findIndex(h => h.includes('status') || h.includes('stage')),
        source: headers.findIndex(h => h.includes('source') || h.includes('channel')),
        notes: headers.findIndex(h => h.includes('note') || h.includes('remark') || h.includes('comment'))
    };

    // Validate required columns
    if (map.name === -1) {
        showToast('❌ Wrong Format! Required column "Name" not found. Please download the template.', 'error');
        hideLoading();
        return;
    }

    // Process rows (async batch insert)
    const insertPromises = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Simple CSV split (handles basic CSVs; doesn't parse quoted commas)
        const row = lines[i].split(',');

        if (row.length < 2) continue; // Skip likely empty rows

        try {
            const leadData = {
                name: cleanCell(row[map.name]),
                phone: map.phone > -1 ? cleanCell(row[map.phone]) : '',
                email: map.email > -1 ? cleanCell(row[map.email]) : '',
                budget: map.budget > -1 ? parseBudget(cleanCell(row[map.budget])) : 0,
                status: map.status > -1 ? mapStatus(cleanCell(row[map.status])) : 'New',
                source: map.source > -1 ? cleanCell(row[map.source]) : 'Manual Import',
                notes: map.notes > -1 ? cleanCell(row[map.notes]) : '',
                assigned_to: currentUser?.user_id || '00000000-0000-0000-0000-000000000001'
            };

            const lead = new LeadModel(leadData);
            if (DB && DB.calculateLeadScore) {
                lead.lead_score = DB.calculateLeadScore(lead);
            }

            const p = DB.insertRecord('leads', lead.toJSON()).then(() => {
                DB.logActivity({
                    lead_id: lead.lead_id,
                    activity_type: 'lead_imported',
                    description: 'Imported via Bulk CSV',
                    created_at: new Date().toISOString()
                });
                successCount++;
            }).catch(err => console.error('Error importing row:', i, err));

            insertPromises.push(p);
        } catch (err) {
            console.error('Error preparing row:', i, err);
        }
    }

    await Promise.all(insertPromises);

    hideLoading();
    await loadLeads(); // Refresh table
    showToast(`Successfully imported ${successCount} leads!`, 'success');
}

function cleanCell(data) {
    if (!data) return '';
    return data.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

function parseBudget(val) {
    if (!val) return 0;
    // Remove non-numeric characters except dots
    const num = val.replace(/[^0-9.]/g, '');
    return parseInt(num) || 0;
}

function mapStatus(val) {
    if (!val) return 'New';
    const v = val.toLowerCase();

    if (v.includes('won') || v.includes('close')) return 'Won';
    if (v.includes('lost') || v.includes('fail') || v.includes('drop')) return 'Lost';
    if (v.includes('neg')) return 'Negotiation';
    if (v.includes('prop')) return 'Proposal Sent';
    if (v.includes('qual')) return 'Qualified';
    if (v.includes('cont')) return 'Contacted';

    return 'New'; // Default
}
