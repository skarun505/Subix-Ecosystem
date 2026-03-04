/**
 * Subix LeadOS - Phase 2: Lead Detail Modal & Follow-ups
 * Feature Module for enhanced lead management
 */

// ============================================
// LEAD DETAIL MODAL
// ============================================

let currentLeadId = null;

async function openLeadDetails(leadId) {
    const lead = await DB.getRecordById('leads', leadId);
    if (!lead) {
        showToast('Lead not found', 'error');
        return;
    }

    currentLeadId = leadId;
    const modal = document.getElementById('lead-detail-modal');

    // Populate header
    document.getElementById('lead-detail-name').textContent = lead.name;
    document.getElementById('lead-detail-subtitle').textContent = `${lead.status} • ${lead.source}`;

    // Populate summary bar
    const initials = lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('lead-avatar-initials').textContent = initials;
    document.getElementById('lead-phone').textContent = lead.phone || '--';
    document.getElementById('lead-email').textContent = lead.email || '--';
    document.getElementById('lead-source').textContent = lead.source;

    const statusBadge = document.getElementById('lead-status-badge');
    statusBadge.textContent = lead.status;
    statusBadge.style.background = `${getStatusColor(lead.status)}20`;
    statusBadge.style.color = getStatusColor(lead.status);

    document.getElementById('lead-score-value').textContent = lead.lead_score || 0;

    const leadAge = new LeadModel(lead).calculateAge();
    document.getElementById('lead-age-value').textContent = `${leadAge.days} days (${leadAge.status})`;
    document.getElementById('lead-age-value').style.color = leadAge.color;

    // Populate Details Tab
    populateDetailsTab(lead);

    // Populate Activity Tab
    populateActivityTab(leadId);

    // Populate Notes Tab
    populateNotesTab(leadId);

    // Show modal
    modal.style.display = 'flex';
}

function populateDetailsTab(lead) {
    document.getElementById('detail-name').textContent = lead.name;
    document.getElementById('detail-phone').textContent = lead.phone || 'Not provided';
    document.getElementById('detail-email').textContent = lead.email || 'Not provided';
    document.getElementById('detail-company').textContent = lead.company || 'Not provided';

    document.getElementById('detail-source').textContent = lead.source;
    document.getElementById('detail-status').textContent = lead.status;

    // getAssignedUserName is likely async too if it fetches from DB
    DB.getRecordById('users', lead.assigned_to).then(user => {
        document.getElementById('detail-assigned').textContent = user ? user.full_name : 'Unassigned';
    });

    document.getElementById('detail-created').textContent = formatDateTime(lead.created_at);

    document.getElementById('detail-budget').textContent = lead.budget ? formatCurrency(lead.budget) : 'Not specified';
    document.getElementById('detail-property').textContent = lead.property_type || 'Not specified';
    document.getElementById('detail-location').textContent = lead.location || 'Not specified';

    document.getElementById('detail-notes').textContent = lead.notes || 'No notes available';
}

async function populateActivityTab(leadId) {
    const activities = await DB.getActivitiesForLead(leadId);
    const container = document.getElementById('lead-activity-timeline');

    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No activity yet</div>
                <div class="empty-state-description">Activity will appear here as you interact with this lead</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    // Sort by date descending
    const sortedActivities = [...activities].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    sortedActivities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const icon = getActivityIcon(activity.activity_type);
        const color = getActivityColor(activity.activity_type);

        item.innerHTML = `
            <div class="timeline-icon ${color}">
                <span class="material-icons-round">${icon}</span>
            </div>
            <div class="timeline-content">
                <div class="timeline-title">${formatActivityType(activity.activity_type)}</div>
                <div class="timeline-description">${activity.description}</div>
                <div class="timeline-time">${getTimeAgo(activity.created_at)}</div>
            </div>
        `;

        container.appendChild(item);
    });
}

async function populateNotesTab(leadId) {
    const notes = await DB.getNotesForLead(leadId);
    const container = document.getElementById('notes-list');

    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-title">No notes yet</div>
                <div class="empty-state-description">Add your first note about this lead</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    notes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'note-item';

        item.innerHTML = `
            <div class="note-header">
                <span class="note-author">${note.created_by || 'You'}</span>
                <span class="note-time">${getTimeAgo(note.created_at)}</span>
            </div>
            <div class="note-content">${note.content}</div>
        `;

        container.appendChild(item);
    });
}

function closeLeadDetails() {
    document.getElementById('lead-detail-modal').style.display = 'none';
    currentLeadId = null;
}

// ============================================
// LEAD DETAIL TABS
// ============================================

function setupLeadDetailTabs() {
    const tabs = document.querySelectorAll('.lead-tab');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active pane
            panes.forEach(pane => pane.classList.remove('active'));
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });
}

// ============================================
// QUICK ACTIONS
// ============================================

function setupQuickActions() {
    // Call Action
    document.getElementById('action-call')?.addEventListener('click', async () => {
        if (!currentLeadId) return;
        const lead = await DB.getRecordById('leads', currentLeadId);
        if (lead && lead.phone) {
            window.open(`tel:${lead.phone}`);
            logQuickAction(currentLeadId, 'call');
            showToast('Initiating call...', 'info');
        } else {
            showToast('No phone number available', 'error');
        }
    });

    // WhatsApp Action
    document.getElementById('action-whatsapp')?.addEventListener('click', async () => {
        if (!currentLeadId) return;
        const lead = await DB.getRecordById('leads', currentLeadId);
        if (lead && lead.phone) {
            const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
            const whatsappUrl = `https://wa.me/91${cleanPhone}`;
            window.open(whatsappUrl, '_blank');
            logQuickAction(currentLeadId, 'whatsapp');
            showToast('Opening WhatsApp...', 'success');
        } else {
            showToast('No phone number available', 'error');
        }
    });

    // Email Action
    document.getElementById('action-email')?.addEventListener('click', async () => {
        if (!currentLeadId) return;
        const lead = await DB.getRecordById('leads', currentLeadId);
        if (lead && lead.email) {
            const subject = encodeURIComponent(`Following up - ${lead.name}`);
            const body = encodeURIComponent(`Hi ${lead.name},\n\n`);
            window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
            logQuickAction(currentLeadId, 'email');
            showToast('Opening email client...', 'info');
        } else {
            showToast('No email address available', 'error');
        }
    });

    // Schedule Follow-up
    document.getElementById('action-schedule-followup')?.addEventListener('click', () => {
        if (!currentLeadId) return;
        openFollowupScheduler();
    });
}

async function logQuickAction(leadId, actionType) {
    await DB.logActivity({
        lead_id: leadId,
        activity_type: `${actionType}_initiated`,
        description: `${formatActivityType(actionType)} initiated from lead detail`,
        performed_by: currentUser.user_id
    });

    // Refresh activity tab if it's active
    const activeTab = document.querySelector('.lead-tab.active')?.dataset.tab;
    if (activeTab === 'activity') {
        populateActivityTab(leadId);
    }
}

// ============================================
// NOTES FUNCTIONALITY
// ============================================

function setupNotesFeature() {
    const addNoteBtn = document.getElementById('add-note-btn');
    const noteInput = document.getElementById('new-note-input');

    if (addNoteBtn && noteInput) {
        addNoteBtn.addEventListener('click', () => {
            const content = noteInput.value.trim();
            if (!content) {
                showToast('Please enter a note', 'error');
                return;
            }

            if (!currentLeadId) return;

            // Add note to database (async)
            DB.addNote({
                lead_id: currentLeadId,
                content: content,
                created_by: currentUser.user_id
            }).then(note => {
                if (note) {
                    // Log as activity (optional as addNote already logs)
                    // Clear input
                    noteInput.value = '';
                    // Refresh notes
                    populateNotesTab(currentLeadId);
                    showToast('Note added successfully', 'success');
                }
            });
        });
    }
}

// ============================================
// FOLLOW-UP SCHEDULER
// ============================================

function openFollowupScheduler() {
    const modal = document.getElementById('followup-modal');
    if (modal) {
        modal.style.display = 'flex';

        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateInput = modal.querySelector('input[name="followup-date"]');
        if (dateInput) {
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }

        // Set default time to 10:00 AM
        const timeInput = modal.querySelector('input[name="followup-time"]');
        if (timeInput) {
            timeInput.value = '10:00';
        }
    }
}

function closeFollowupScheduler() {
    document.getElementById('followup-modal').style.display = 'none';
}

function setupFollowupScheduler() {
    const form = document.getElementById('followup-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!currentLeadId) {
                showToast('No lead selected', 'error');
                return;
            }

            const formData = new FormData(form);
            const followupData = {
                lead_id: currentLeadId,
                scheduled_date: formData.get('followup-date'),
                scheduled_time: formData.get('followup-time'),
                type: formData.get('followup-type'),
                notes: formData.get('followup-notes'),
                status: 'pending'
            };

            showLoading('Scheduling follow-up...');

            setTimeout(() => {
                try {
                    const followup = DB.scheduleFollowup(followupData);

                    if (followup) {
                        // Log activity
                        DB.logActivity({
                            lead_id: currentLeadId,
                            activity_type: 'follow_up_scheduled',
                            description: `Follow-up scheduled for ${followupData.scheduled_date} at ${followupData.scheduled_time}`,
                            performed_by: currentUser.user_id
                        });

                        // Update lead with next follow-up date
                        DB.updateRecord('leads', currentLeadId, {
                            follow_up_date: `${followupData.scheduled_date}T${followupData.scheduled_time}:00`
                        });

                        closeFollowupScheduler();
                        form.reset();

                        // Refresh activity tab
                        populateActivityTab(currentLeadId);

                        showToast('Follow-up scheduled successfully!', 'success');
                    }
                } catch (error) {
                    console.error('Failed to schedule follow-up:', error);
                    showToast('Failed to schedule follow-up', 'error');
                } finally {
                    hideLoading();
                }
            }, 300);
        });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatActivityType(type) {
    const labels = {
        'lead_created': 'Lead Created',
        'status_changed': 'Status Changed',
        'note_added': 'Note Added',
        'email_sent': 'Email Sent',
        'sms_sent': 'SMS Sent',
        'whatsapp_sent': 'WhatsApp Message',
        'call_made': 'Call Made',
        'call_initiated': 'Phone Call',
        'whatsapp_initiated': 'WhatsApp',
        'email_initiated': 'Email',
        'follow_up_scheduled': 'Follow-up Scheduled',
        'follow_up_completed': 'Follow-up Completed',
        'lead_updated': 'Lead Updated'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getAssignedUserName(userId) {
    if (!userId) return 'Unassigned';
    const user = DB.getRecordById('users', userId);
    return user ? user.full_name : 'Unknown User';
}

function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('en-US', options);
}

// ============================================
// INITIALIZATION
// ============================================

function initializePhase2Features() {
    console.log('🚀 Initializing Phase 2 Features...');

    // Setup lead detail modal
    const closeBtn = document.getElementById('lead-detail-close');
    const backBtn = document.getElementById('lead-detail-back');

    if (closeBtn) closeBtn.addEventListener('click', closeLeadDetails);
    if (backBtn) backBtn.addEventListener('click', closeLeadDetails);

    // Close on overlay click
    const modal = document.getElementById('lead-detail-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLeadDetails();
        });
    }

    // Setup tabs
    setupLeadDetailTabs();

    // Setup quick actions
    setupQuickActions();

    // Setup notes
    setupNotesFeature();

    // Setup follow-up scheduler
    setupFollowupScheduler();

    // Close buttons for follow-up modal
    const followupModal = document.getElementById('followup-modal');
    if (followupModal) {
        const closeBtns = followupModal.querySelectorAll('.close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', closeFollowupScheduler);
        });

        followupModal.addEventListener('click', (e) => {
            if (e.target === followupModal) closeFollowupScheduler();
        });
    }

    console.log('✅ Phase 2 Features Initialized');
}

// Auto-initialize when DOM is ready, but wait for session guard check!
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setTimeout(initializePhase2Features, 150); });
} else {
    setTimeout(initializePhase2Features, 150);
}

// Export for global access
window.Phase2 = {
    openLeadDetails,
    closeLeadDetails,
    openFollowupScheduler,
    closeFollowupScheduler,
    currentLeadId: () => currentLeadId
};

console.log('📦 Phase 2 Module Loaded');
