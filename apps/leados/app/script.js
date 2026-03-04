/**
 * Subix LeadOS - Frontend Controller
 * Handles UI interactions, data fetching, and mock logic for local dev.
 */

// State
let leads = [];
let view = 'dashboard';

// Constants
const STAGES = ['Inquiry', 'Viewing Schedule', 'Viewing Completed', 'Offer Made', 'Under Contract', 'Closed Won', 'Closed Lost'];

// Mock Data Generator
function generateMockLeads(count = 50) {
    const names = ["Aarav Patel", "Vihaan Singh", "Aditya Kumar", "Sai Iyer", "Reyansh Gupta", "Arjun Reddy", "Vivaan Joshi", "Rohan Mehta", "Ananya Verma", "Diya Rao", "Saanvi Nair", "Kiara Shah", "Myra Malhotra", "Aadhya Kapoor"];
    const sources = ["MagicBricks", "99Acres", "Housing.com", "WhatsApp", "Referral", "Facebook Ads", "NoBroker"];
    const owners = ["Me", "Rohan", "Anjali", "Vikram"];

    return Array.from({ length: count }, (_, i) => ({
        id: (i + 1).toString(), // IDs are strings in GAS
        name: names[Math.floor(Math.random() * names.length)],
        email: `lead${i}@example.com`,
        phone: `+91 ${Math.floor(9000000000 + Math.random() * 900000000)}`,
        status: STAGES[Math.floor(Math.random() * STAGES.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        score: Math.floor(Math.random() * 100),
        owner: owners[Math.floor(Math.random() * owners.length)],
        date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
    }));
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateDate();
    setupNavigation();
    setupModal();
    setupShortcuts();
    fetchLeads();
}

function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for Search (Future)

        // 'N' for New Lead (if not typing in input)
        if (e.key.toLowerCase() === 'n' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            document.getElementById('btn-add-lead').click();
        }

        // Switching Views: Alt + 1, Alt + 2, etc.
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

function updateDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
}

// Navigation Handling
function setupNavigation() {
    // Notification Toggle
    const notifBtn = document.getElementById('btn-notifications');
    const notifDropdown = document.querySelector('.notifications-dropdown');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
        });

        // Close on click outside
        document.addEventListener('click', () => {
            notifDropdown.classList.remove('active');
        });

        notifDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const titleObj = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // UI Update
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // View Update
            const targetView = item.dataset.view;
            localStorage.setItem('leadOS_lastPage', targetView);
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(`view-${targetView}`);
            if (targetSection) targetSection.classList.add('active');

            // Title Update
            titleObj.textContent = item.querySelector('span:nth-child(2)').textContent;

            // Render specific views
            if (targetView === 'leads') renderLeadsTable();
            if (targetView === 'pipeline') renderKanban();
        });
    });

    // Restore Last View
    const lastPage = localStorage.getItem('leadOS_lastPage') || 'dashboard';
    const activeItem = document.querySelector(`.nav-item[data-view="${lastPage}"]`);
    if (activeItem && lastPage !== 'dashboard') {
        activeItem.click();
    }
}


// Data Handling
function fetchLeads() {
    // Check if running in GAS environment
    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(data => {
                leads = data;
                populateDashboard();
            })
            .withFailureHandler(error => {
                console.error("Error fetching leads:", error);
                alert("Failed to fetch leads. See console for details.");
            })
            .getLeads();
    } else {
        // Local Mock
        console.log("Running locally...");
        fetch('mock_data.json')
            .then(res => res.json())
            .then(data => {
                console.log("Loaded mock_data.json");
                leads = data;
                populateDashboard();
            })
            .catch(err => {
                console.warn("Could not load mock_data.json, generating random data...", err);
                if (leads.length === 0) leads = generateMockLeads(25);
                populateDashboard();
            });
    }
}


function populateDashboard() {
    renderLeadsTable();
    renderKanban();
    updateKPIs();
    renderActivity();
    renderPipelineChart();
}

// Renderers
function renderLeadsTable() {
    const tbody = document.querySelector('#leads-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    leads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${lead.name}</strong><br><small class="text-muted">${lead.email}</small></td>
            <td><span class="status-badge status-${lead.status.toLowerCase().replace(' ', '-')}">${lead.status}</span></td>
            <td>${lead.source}</td>
            <td>
                <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${lead.score}%; height: 100%; background: ${getScoreColor(lead.score)}"></div>
                </div>
                <small>${lead.score}/100</small>
            </td>
            <td>${lead.owner}</td>
            <td>
                <button class="btn-icon"><span class="material-icons-round">edit</span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderKanban() {
    const board = document.getElementById('kanban-board');
    // Clear columns content only
    board.querySelectorAll('.column-content').forEach(col => col.innerHTML = '');

    leads.forEach(lead => {
        const col = board.querySelector(`.kanban-column[data-stage="${lead.status}"] .column-content`);
        if (col) {
            const card = document.createElement('div');
            card.className = 'kanban-card glass-panel';
            card.draggable = true;
            card.dataset.id = lead.id; // Store ID for Drag and Drop
            card.innerHTML = `
                <span class="card-title">${lead.name}</span>
                <div class="card-meta">
                    <span>${lead.source}</span>
                    <span style="color: ${getScoreColor(lead.score)}">${lead.score}%</span>
                </div>
            `;

            // Drag Events
            card.addEventListener('dragstart', handleDragStart);

            col.appendChild(card);
        }
    });

    // Update counts
    board.querySelectorAll('.kanban-column').forEach(col => {
        const count = col.querySelectorAll('.kanban-card').length;
        col.querySelector('.col-count').textContent = count;

        // Drop Events
        col.addEventListener('dragover', handleDragOver);
        col.addEventListener('drop', handleDrop);
    });
}
// Drag and Drop Handlers
let draggedCard = null;

function handleDragStart(e) {
    draggedCard = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    setTimeout(() => this.style.opacity = '0.5', 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const column = this.closest('.kanban-column'); // Ensure we get the column
    if (!column) return;

    const newStage = column.dataset.stage;
    const leadId = e.dataTransfer.getData('text/plain');

    // UI Update (Optimistic)
    const originalStage = leads.find(l => l.id == leadId).status;
    if (originalStage === newStage) return;

    // Update Local Data
    const leadIndex = leads.findIndex(l => l.id == leadId);
    if (leadIndex > -1) {
        leads[leadIndex].status = newStage;
    }

    populateDashboard();

    // Backend Update
    if (typeof google !== 'undefined' && google.script) {
        google.script.run.withFailureHandler(() => {
            // Revert on failure
            leads[leadIndex].status = originalStage;
            populateDashboard();
            alert("Failed to update stage.");
        }).updateLeadStage(leadId, newStage);
    } else {
        console.log(`[Mock] Moved Lead ${leadId} to ${newStage}`);
    }
}


function renderActivity() {
    const list = document.getElementById('activity-list');
    list.innerHTML = '';

    // Mock recent activity based on leads if possible, or static
    const activities = [
        { type: 'mail', text: `New inquiry from <strong>MagicBricks</strong>`, time: '5 mins ago' },
        { type: 'call', text: `Call scheduled with <strong>${leads[0]?.name || 'Client'}</strong>`, time: '1 hour ago' },
        { type: 'check_circle', text: `<strong>${leads[1]?.name || 'Client'}</strong> offered ₹1.5 Cr`, time: '3 hours ago' }
    ];

    activities.forEach(act => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
            <div class="activity-icon"><span class="material-icons-round">${act.type}</span></div>
            <div class="activity-details">
                <span class="act-title">${act.text}</span>
                <span class="act-time">${act.time}</span>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderPipelineChart() {
    const container = document.querySelector('.pipeline-bars');
    if (!container) return;

    container.innerHTML = '';

    // Group by Stage
    const counts = {};
    STAGES.forEach(stage => counts[stage] = 0);
    leads.forEach(l => {
        if (counts[l.status] !== undefined) counts[l.status]++;
    });

    const max = Math.max(...Object.values(counts), 1); // Avoid div by zero

    STAGES.forEach(stage => {
        const count = counts[stage];
        const percent = (count / max) * 100;

        const item = document.createElement('div');
        item.className = 'pipeline-item';
        item.innerHTML = `
            <span class="pipeline-label">${stage}</span>
            <div class="pipeline-track">
                <div class="pipeline-fill" style="width: ${percent}%; background: ${getStageColor(stage)}"></div>
            </div>
            <span class="pipeline-count">${count}</span>
        `;
        container.appendChild(item);
    });
}

function getStageColor(stage) {
    if (stage === 'Won') return '#10b981';
    if (stage === 'Lost') return '#ef4444';
    return '#6366f1';
}

function updateKPIs() {
    // Simple mock logic for KPIs
    const total = leads.length;
    const won = leads.filter(l => l.status === 'Won').length;
    const conversion = total > 0 ? ((won / total) * 100).toFixed(1) : 0;

    // Find KPI elements and update (in a real app, use IDs)
    document.querySelector('.kpi-card:nth-child(1) .value').textContent = total;
    document.querySelector('.kpi-card:nth-child(2) .value').textContent = `${conversion}%`;
}

// Utilities
function getScoreColor(score) {
    if (score > 70) return '#10b981'; // Green
    if (score > 30) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
}

function setupModal() {
    const modal = document.getElementById('add-lead-modal');
    const btnAdd = document.getElementById('btn-add-lead');
    const btnClose = document.querySelectorAll('.close-modal');

    btnAdd.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    btnClose.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Form Handle
    document.getElementById('new-lead-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const newLead = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            source: formData.get('source'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            id: 'temp-' + Date.now(), // Temporary ID
            score: 30, // Default score
            owner: 'Me'
        };

        // Optimistic UI Update
        leads.unshift(newLead);
        populateDashboard();
        modal.style.display = 'none';
        e.target.reset();

        // Backend Call
        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(() => {
                    console.log("Lead saved successfully");
                    fetchLeads(); // Refresh to get real ID and Score
                })
                .withFailureHandler((err) => {
                    console.error("Failed to save lead", err);
                    alert("Failed to save lead.");
                })
                .addLead(newLead);
        } else {
            console.log(`[Mock] Saved Lead:`, newLead);
        }
    });
}
