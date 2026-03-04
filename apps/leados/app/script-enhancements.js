/**
 * Subix LeadOS — Enhancement Module v1.0
 * Features: Follow-up alerts, Export, WA Templates, Call Logger,
 *           Risk Widget, Smart Sort, Advanced Search, Dup Check,
 *           Toast Stack, Keyboard Shortcuts
 */

// ─────────────────────────────────────────────
// 1. ENHANCED LEAD SCORING (patches DB)
// ─────────────────────────────────────────────
function enhancedLeadScore(lead) {
    let score = 30;
    const sourceScores = {
        'Referral': 40, 'Website Form': 30, 'WhatsApp': 28, 'MagicBricks': 25,
        '99Acres': 25, 'Google Ads': 22, 'Facebook Ads': 20, 'Manual': 15,
        'Manual Import': 12, 'Cold Outreach': 10
    };
    score += sourceScores[lead.source] || 10;
    if (lead.budget) {
        if (lead.budget > 10000000) score += 30;
        else if (lead.budget > 5000000) score += 20;
        else if (lead.budget > 2000000) score += 10;
        else score += 5;
    }
    if (lead.email && !lead.email.includes('gmail') && !lead.email.includes('yahoo')) score += 10;
    const daysOld = Math.floor((new Date() - new Date(lead.created_at)) / 86400000);
    if (daysOld > 30) score -= 20;
    else if (daysOld > 14) score -= 10;
    else if (daysOld > 7) score -= 5;
    if (lead.follow_up_date && new Date(lead.follow_up_date) < new Date()) score -= 15;
    if (lead.notes && lead.notes.length > 50) score += 5;
    const statusBonus = { 'Negotiation': 20, 'Proposal Sent': 15, 'Qualified': 10, 'Contacted': 5, 'Lost': -50, 'On Hold': -10 };
    score += statusBonus[lead.status] || 0;
    return Math.max(0, Math.min(score, 100));
}

// ─────────────────────────────────────────────
// 2. FOLLOW-UP ALERT SYSTEM
// ─────────────────────────────────────────────
const alertedFollowups = new Set();

async function checkFollowupAlerts() {
    try {
        const followups = await DB.getAllRecords('follow_ups');
        const now = new Date();
        for (const fu of followups) {
            if (fu.status !== 'pending' || alertedFollowups.has(fu.lead_id)) continue;
            const fuTime = new Date(`${fu.scheduled_date}T${fu.scheduled_time || '09:00'}:00`);
            const diffMins = Math.floor((now - fuTime) / 60000);
            if (diffMins >= -5 && diffMins < 120) {
                alertedFollowups.add(fu.lead_id);
                const lead = await DB.getRecordById('leads', fu.lead_id);
                if (lead) {
                    const label = diffMins < 0 ? `in ${Math.abs(diffMins)} min` : `${diffMins} min overdue`;
                    showFollowupAlert(lead, fu, label);
                }
            }
        }
    } catch (e) { /* silent */ }
}

function showFollowupAlert(lead, fu, timeLabel) {
    const el = document.createElement('div');
    el.className = 'fu-alert-toast';
    el.innerHTML = `
        <span class="material-icons-round" style="color:#f59e0b;font-size:1.4rem;">event_available</span>
        <div style="flex:1;">
            <div style="font-weight:600;font-size:0.9rem;">Follow-up Due!</div>
            <div style="font-size:0.82rem;color:#94a3b8;">${lead.name} · ${fu.type || 'Call'} (${timeLabel})</div>
        </div>
        <button onclick="openLeadDetails('${lead.lead_id}');this.closest('.fu-alert-toast').remove();"
            style="background:var(--warning);border:none;border-radius:6px;color:white;padding:4px 10px;cursor:pointer;font-size:0.8rem;white-space:nowrap;">Open</button>
        <button onclick="this.closest('.fu-alert-toast').remove();"
            style="background:transparent;border:none;color:#94a3b8;cursor:pointer;line-height:1;">✕</button>`;
    el.style.cssText = `position:fixed;bottom:2rem;right:2rem;width:360px;background:#1e293b;
        border:1px solid rgba(245,158,11,0.4);border-radius:12px;padding:1rem;z-index:10001;
        box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:slideIn 0.3s ease;
        display:flex;align-items:center;gap:0.8rem;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 12000);
}

// ─────────────────────────────────────────────
// 3. TODAY'S FOLLOW-UPS WIDGET
// ─────────────────────────────────────────────
async function renderTodayFollowups() {
    const container = document.getElementById('followup-today-list');
    if (!container) return;
    const followups = await DB.getAllRecords('follow_ups');
    const todayStr = new Date().toDateString();
    const todayFUs = followups.filter(fu => {
        if (fu.status !== 'pending') return false;
        return new Date(fu.scheduled_date).toDateString() === todayStr || new Date(fu.scheduled_date) < new Date();
    });
    const countEl = document.getElementById('followup-count');
    if (countEl) { countEl.textContent = todayFUs.length; countEl.style.display = todayFUs.length ? 'inline' : 'none'; }
    if (!todayFUs.length) {
        container.innerHTML = `<div class="widget-empty"><span class="material-icons-round">check_circle</span><p>All clear! No follow-ups today.</p></div>`;
        return;
    }
    const icons = { call: 'call', email: 'email', whatsapp: 'chat', meeting: 'groups' };
    let html = '';
    for (const fu of todayFUs.slice(0, 5)) {
        const lead = await DB.getRecordById('leads', fu.lead_id);
        if (!lead) continue;
        const overdue = new Date(fu.scheduled_date) < new Date();
        html += `<div class="widget-row" onclick="openLeadDetails('${lead.lead_id}')">
            <div class="widget-row-icon ${overdue ? 'danger' : 'warning'}"><span class="material-icons-round">${icons[fu.type] || 'event'}</span></div>
            <div class="widget-row-info"><div class="widget-row-name">${lead.name}</div>
            <div class="widget-row-meta">${(fu.type || 'Follow-up').toUpperCase()} · ${fu.scheduled_date}</div></div>
            <span class="widget-row-badge ${overdue ? 'danger' : 'info'}">${overdue ? 'Overdue' : 'Today'}</span></div>`;
    }
    if (todayFUs.length > 5) html += `<div class="widget-more">+${todayFUs.length - 5} more</div>`;
    container.innerHTML = html;
}

// ─────────────────────────────────────────────
// 4. LEADS AT RISK WIDGET
// ─────────────────────────────────────────────
async function renderLeadsAtRisk() {
    const container = document.getElementById('leads-at-risk-list');
    if (!container) return;
    const allLeads = await DB.getAllRecords('leads');
    const now = new Date();
    const atRisk = [];
    allLeads.forEach(lead => {
        if (['Won', 'Lost'].includes(lead.status)) return;
        const daysOld = Math.floor((now - new Date(lead.created_at)) / 86400000);
        let riskLevel = null, reason = '';
        if (lead.status === 'New' && daysOld > 3) { riskLevel = 'critical'; reason = `Not contacted in ${daysOld} days`; }
        else if (!lead.follow_up_date && daysOld > 5) { riskLevel = 'warning'; reason = 'No follow-up scheduled'; }
        else if (lead.follow_up_date && new Date(lead.follow_up_date) < now) { riskLevel = 'overdue'; reason = 'Follow-up overdue'; }
        if (riskLevel) atRisk.push({ ...lead, riskLevel, reason });
    });
    atRisk.sort((a, b) => ({ 'critical': 0, 'overdue': 1, 'warning': 2 }[a.riskLevel] - { 'critical': 0, 'overdue': 1, 'warning': 2 }[b.riskLevel]));
    const countEl = document.getElementById('risk-count');
    if (countEl) { countEl.textContent = atRisk.length; countEl.style.display = atRisk.length ? 'inline' : 'none'; }
    if (!atRisk.length) {
        container.innerHTML = `<div class="widget-empty"><span class="material-icons-round" style="color:var(--success)">verified</span><p>No at-risk leads. Great work! 🎉</p></div>`;
        return;
    }
    const colors = { critical: '#ef4444', overdue: '#f59e0b', warning: '#3b82f6' };
    const riskIcons = { critical: 'warning', overdue: 'schedule', warning: 'info' };
    container.innerHTML = atRisk.slice(0, 5).map(l => `
        <div class="widget-row" onclick="openLeadDetails('${l.lead_id}')" style="border-left:3px solid ${colors[l.riskLevel]};">
            <div class="widget-row-icon" style="color:${colors[l.riskLevel]};background:${colors[l.riskLevel]}20;">
                <span class="material-icons-round">${riskIcons[l.riskLevel]}</span></div>
            <div class="widget-row-info"><div class="widget-row-name">${l.name}</div>
            <div class="widget-row-meta">${l.reason}</div></div>
            <span class="widget-row-badge" style="background:${colors[l.riskLevel]}20;color:${colors[l.riskLevel]};">${l.status}</span>
        </div>`).join('');
}

// ─────────────────────────────────────────────
// 5. EXPORT LEADS TO CSV
// ─────────────────────────────────────────────
async function exportLeadsToCSV() {
    const allLeads = await DB.getAllRecords('leads');
    if (!allLeads.length) { showToast('No leads to export', 'error'); return; }
    const headers = ['Name', 'Phone', 'Email', 'Status', 'Source', 'Budget (₹)', 'Score', 'Age (Days)', 'Created', 'Notes', 'Location', 'Follow-up Date'];
    const rows = allLeads.map(l => {
        const days = Math.floor((new Date() - new Date(l.created_at)) / 86400000);
        return [`"${(l.name || '').replace(/"/g, '""')}"`, `"${l.phone || ''}"`, `"${l.email || ''}"`,
        `"${l.status || ''}"`, `"${l.source || ''}"`, l.budget || 0, l.lead_score || 0, days,
        `"${l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN') : ''}"`,
        `"${(l.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${l.location_preference || ''}"`,
        `"${l.follow_up_date ? new Date(l.follow_up_date).toLocaleDateString('en-IN') : ''}"`].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `LeadOS_${new Date().toISOString().split('T')[0]}.csv`
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(`✅ Exported ${allLeads.length} leads!`, 'success');
}

// ─────────────────────────────────────────────
// 6. WHATSAPP TEMPLATES
// ─────────────────────────────────────────────
const WA_TEMPLATES = [
    { id: 'welcome', name: '👋 Welcome', msg: 'Hi {name}! We received your property inquiry. Our team will reach out shortly with some great options matching your requirements! 🏠' },
    { id: 'followup', name: '📞 Follow-Up', msg: 'Hi {name}, following up on your property inquiry. Are you available for a quick call to discuss your requirements? Let me know a convenient time! 😊' },
    { id: 'proposal', name: '📋 Proposal Ready', msg: 'Hi {name}! Great news — we have a customized property proposal ready for you. Shall I share the details? 🎉' },
    { id: 'sitevisit', name: '🏗️ Site Visit', msg: 'Hi {name}! We would love to invite you for a site visit. The property looks even better in person! When would work for you? 📅' },
    { id: 'closing', name: '🤝 Closing', msg: 'Hi {name}, we have a limited-time offer that I think you\'ll love. Can we connect today to finalize the details? 💎' },
    { id: 'reengage', name: '🔄 Re-engage', msg: 'Hi {name}! It\'s been a while since we connected. We have exciting new properties that match your profile — interested to take a look? 🏠✨' }
];

function openWhatsAppTemplates(lead) {
    const existing = document.getElementById('wa-modal'); if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'wa-modal'; modal.className = 'modal-overlay'; modal.style.display = 'flex';
    modal.innerHTML = `<div class="modal glass-panel" style="max-width:540px;width:95%;max-height:90vh;overflow-y:auto;">
        <div class="modal-header">
            <h2 style="display:flex;align-items:center;gap:0.5rem;"><span class="material-icons-round" style="color:#4ade80;">chat</span>WhatsApp Templates</h2>
            <button class="btn-icon" onclick="document.getElementById('wa-modal').remove()"><span class="material-icons-round">close</span></button>
        </div>
        <div style="margin-bottom:1rem;padding:0.75rem;background:rgba(74,222,128,0.1);border-radius:8px;border:1px solid rgba(74,222,128,0.2);font-size:0.85rem;color:#94a3b8;">
            Sending to: <strong style="color:#f8fafc;">${lead.name}</strong> (${lead.phone})</div>
        <div class="wa-template-grid">${WA_TEMPLATES.map(t => `
            <div class="wa-card" onclick="sendWATemplate('${lead.lead_id}','${t.id}')">
                <div class="wa-card-name">${t.name}</div>
                <div class="wa-card-preview">${t.msg.replace('{name}', lead.name).substring(0, 80)}...</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:1rem;">
            <label style="font-size:0.85rem;color:var(--text-muted);display:block;margin-bottom:0.5rem;">Or type a custom message:</label>
            <textarea id="wa-custom" rows="3" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#f8fafc;padding:0.75rem;font-family:inherit;resize:vertical;" placeholder="Type your message..."></textarea>
            <button class="btn btn-primary" style="margin-top:0.75rem;width:100%;" onclick="sendCustomWA('${lead.lead_id}')">
                <span class="material-icons-round">send</span> Send Custom Message</button>
        </div></div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
}

async function sendWATemplate(leadId, templateId) {
    const lead = await DB.getRecordById('leads', leadId);
    if (!lead?.phone) { showToast('No phone number!', 'error'); return; }
    const t = WA_TEMPLATES.find(x => x.id === templateId);
    if (!t) return;
    const msg = t.msg.replace(/{name}/g, lead.name);
    window.open(`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    DB.logActivity({ lead_id: leadId, activity_type: 'whatsapp_sent', description: `WA template: "${t.name}"`, performed_by: currentUser?.user_id || 'user' });
    document.getElementById('wa-modal')?.remove();
    showToast(`WhatsApp opened — "${t.name}"`, 'success');
}

async function sendCustomWA(leadId) {
    const lead = await DB.getRecordById('leads', leadId);
    if (!lead?.phone) { showToast('No phone number!', 'error'); return; }
    const msg = document.getElementById('wa-custom')?.value?.trim();
    if (!msg) { showToast('Please type a message', 'error'); return; }
    window.open(`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    DB.logActivity({ lead_id: leadId, activity_type: 'whatsapp_sent', description: 'Custom WA message sent', performed_by: currentUser?.user_id || 'user' });
    document.getElementById('wa-modal')?.remove();
    showToast('WhatsApp opened!', 'success');
}

// ─────────────────────────────────────────────
// 7. CALL OUTCOME LOGGER
// ─────────────────────────────────────────────
function openCallOutcomeLogger(leadId, leadName, phone) {
    if (phone) window.open(`tel:${phone}`);
    const existing = document.getElementById('call-modal'); if (existing) existing.remove();
    const outcomes = [
        { v: 'interested', l: '🙌 Interested', c: '#10b981' },
        { v: 'callback', l: '📅 Call Back', c: '#3b82f6' },
        { v: 'not_interested', l: '❌ Not Interested', c: '#ef4444' },
        { v: 'no_answer', l: '📵 No Answer', c: '#f59e0b' },
        { v: 'wrong_number', l: '🔢 Wrong Number', c: '#64748b' },
        { v: 'voicemail', l: '📬 Voicemail', c: '#8b5cf6' }
    ];
    const modal = document.createElement('div');
    modal.id = 'call-modal'; modal.className = 'modal-overlay'; modal.style.display = 'flex';
    modal.innerHTML = `<div class="modal glass-panel" style="max-width:460px;width:95%;">
        <div class="modal-header">
            <h2 style="display:flex;align-items:center;gap:0.5rem;"><span class="material-icons-round" style="color:var(--success);">call</span>Log Call Outcome</h2>
            <button class="btn-icon" onclick="document.getElementById('call-modal').remove()"><span class="material-icons-round">close</span></button>
        </div>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;">Call to <strong style="color:#f8fafc;">${leadName}</strong>. What was the outcome?</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.5rem;">
            ${outcomes.map(o => `<button class="call-outcome-btn" data-outcome="${o.v}" data-color="${o.c}"
                onclick="selectCallOutcome(this)" style="border:2px solid transparent;background:rgba(255,255,255,0.05);
                color:#f8fafc;padding:0.75rem;border-radius:10px;cursor:pointer;font-weight:500;text-align:left;transition:all 0.2s;">${o.l}</button>`).join('')}
        </div>
        <div class="form-group">
            <label>Notes (optional)</label>
            <textarea id="call-notes" rows="2" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#f8fafc;padding:0.75rem;font-family:inherit;" placeholder="What was discussed..."></textarea>
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem;">
            <button class="btn btn-secondary" onclick="document.getElementById('call-modal').remove()" style="flex:1;">Skip</button>
            <button class="btn btn-primary" onclick="submitCallOutcome('${leadId}')" style="flex:2;"><span class="material-icons-round">save</span>Save Outcome</button>
        </div></div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
}

function selectCallOutcome(btn) {
    document.querySelectorAll('.call-outcome-btn').forEach(b => {
        b.style.borderColor = 'transparent'; b.style.background = 'rgba(255,255,255,0.05)';
    });
    const c = btn.dataset.color;
    btn.style.borderColor = c; btn.style.background = c + '25';
    btn.dataset.selected = 'true';
}

async function submitCallOutcome(leadId) {
    const btn = document.querySelector('.call-outcome-btn[data-selected="true"]');
    if (!btn) { showToast('Please select an outcome', 'error'); return; }
    const outcome = btn.dataset.outcome;
    const notes = document.getElementById('call-notes')?.value?.trim();
    await DB.logActivity({ lead_id: leadId, activity_type: 'call_made', description: `Call: ${outcome.replace(/_/g, ' ')}${notes ? '. ' + notes : ''}`, performed_by: currentUser?.user_id || 'user' });
    document.getElementById('call-modal')?.remove();
    if (outcome === 'interested') { await DB.updateLeadStatus(leadId, 'Qualified'); showToast('🎉 Lead marked Qualified!', 'success'); await loadLeads(); }
    else if (outcome === 'not_interested') { await DB.updateLeadStatus(leadId, 'Lost'); showToast('Lead marked Lost', 'info'); await loadLeads(); }
    else if (outcome === 'callback') {
        await DB.updateLeadStatus(leadId, 'Contacted');
        showToast('📅 Opening follow-up scheduler...', 'info');
        setTimeout(() => { window.currentLeadId = leadId; openFollowupScheduler(); }, 400);
    } else { showToast('Call outcome saved!', 'success'); }
}

// ─────────────────────────────────────────────
// 8. SOURCE ROI REPORT
// ─────────────────────────────────────────────
async function renderSourceROIReport() {
    const container = document.getElementById('source-roi-container');
    if (!container) return;
    const leads = await DB.getAllRecords('leads');
    const data = {};
    leads.forEach(l => {
        const s = l.source || 'Unknown';
        if (!data[s]) data[s] = { total: 0, won: 0, revenue: 0 };
        data[s].total++;
        if (l.status === 'Won') { data[s].won++; data[s].revenue += parseFloat(l.budget || 0); }
    });
    const sources = Object.keys(data).sort((a, b) => data[b].total - data[a].total);
    const maxTotal = Math.max(...sources.map(s => data[s].total), 1);
    container.innerHTML = sources.map(s => {
        const d = data[s];
        const conv = d.total > 0 ? ((d.won / d.total) * 100).toFixed(1) : '0.0';
        const color = parseFloat(conv) > 20 ? 'var(--success)' : parseFloat(conv) > 10 ? 'var(--warning)' : 'var(--danger)';
        return `<div class="roi-row">
            <div class="roi-source">${s}</div>
            <div class="roi-bar-track"><div class="roi-bar" style="width:${(data[s].total / maxTotal) * 100}%"></div></div>
            <div class="roi-stats">
                <span>${d.total} leads</span>
                <span style="color:${color};font-weight:600;">${conv}%</span>
                ${d.revenue > 0 ? `<span style="color:var(--success);">${formatCurrency(d.revenue)}</span>` : ''}
            </div></div>`;
    }).join('');
}

// ─────────────────────────────────────────────
// 9. SMART PRIORITIZATION
// ─────────────────────────────────────────────
window.smartSortEnabled = false;

function toggleSmartSort() {
    window.smartSortEnabled = !window.smartSortEnabled;
    const btn = document.getElementById('smart-sort-btn');
    if (btn) {
        btn.style.background = window.smartSortEnabled ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)';
        btn.style.color = window.smartSortEnabled ? 'white' : 'var(--text-muted)';
        btn.innerHTML = `<span class="material-icons-round">auto_awesome</span>${window.smartSortEnabled ? 'Smart Sort ON' : 'Smart Sort'}`;
    }
    if (typeof renderKanban === 'function') renderKanban();
    showToast(window.smartSortEnabled ? '🧠 Hot leads first!' : 'Default sort restored', 'info');
}

function calcPriorityScore(lead) {
    let s = (lead.lead_score || 0) * 0.5;
    const days = Math.floor((new Date() - new Date(lead.created_at)) / 86400000);
    s += Math.max(0, 20 - days) * 1.5;
    if (lead.budget > 10000000) s += 30; else if (lead.budget > 5000000) s += 15;
    if (lead.follow_up_date && new Date(lead.follow_up_date) < new Date()) s += 20;
    return s;
}

// ─────────────────────────────────────────────
// 10. ADVANCED SEARCH PANEL
// ─────────────────────────────────────────────
function setupAdvancedSearch() {
    const toggle = document.getElementById('adv-search-toggle');
    const panel = document.getElementById('adv-search-panel');
    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            const open = panel.classList.toggle('open');
            toggle.style.color = open ? 'var(--primary)' : 'var(--text-muted)';
        });
    }
    document.querySelectorAll('.adv-filter').forEach(el => {
        el.addEventListener('input', () => {
            if (typeof renderLeadsTable === 'function') renderLeadsTable();
            if (typeof renderKanban === 'function') renderKanban();
        });
    });
}

window.getAdvancedFilters = function () {
    return {
        budgetMin: parseInt(document.getElementById('adv-budget-min')?.value) || 0,
        budgetMax: parseInt(document.getElementById('adv-budget-max')?.value) || Infinity,
        location: (document.getElementById('adv-location')?.value || '').toLowerCase().trim(),
        scoreMin: parseInt(document.getElementById('adv-score-min')?.value) || 0,
    };
};

// ─────────────────────────────────────────────
// 11. LIVE DUPLICATE CHECK
// ─────────────────────────────────────────────
function setupDuplicateCheck() {
    const phoneInput = document.querySelector('#new-lead-form input[name="phone"]');
    const emailInput = document.querySelector('#new-lead-form input[name="email"]');
    if (!phoneInput) return;
    let timer;
    const check = async (field, val) => {
        clearTimeout(timer);
        removeDupWarning();
        if (!val || val.length < 7) return;
        timer = setTimeout(async () => {
            const leads = await DB.getAllRecords('leads');
            const clean = val.replace(/[^0-9]/g, '');
            const dup = leads.find(l => field === 'phone'
                ? l.phone && l.phone.replace(/[^0-9]/g, '') === clean
                : l.email && l.email.toLowerCase() === val.toLowerCase());
            if (dup) showDupWarning(dup, field);
        }, 500);
    };
    phoneInput.addEventListener('input', e => check('phone', e.target.value));
    emailInput?.addEventListener('input', e => check('email', e.target.value));
}

function showDupWarning(lead, field) {
    removeDupWarning();
    const w = document.createElement('div');
    w.id = 'dup-warning';
    w.style.cssText = `background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.4);border-radius:8px;padding:0.75rem;
        margin-top:0.5rem;font-size:0.85rem;color:#fbbf24;display:flex;align-items:center;gap:0.5rem;animation:fadeIn 0.3s ease;`;
    w.innerHTML = `<span class="material-icons-round" style="font-size:1.1rem;">warning</span>
        <div><strong>Possible Duplicate!</strong> ${lead.name} exists with same ${field}.
        <span onclick="openLeadDetails('${lead.lead_id}')" style="color:var(--primary);cursor:pointer;margin-left:4px;text-decoration:underline;">View →</span></div>`;
    document.querySelector('#new-lead-form .form-row')?.insertAdjacentElement('afterend', w);
}

function removeDupWarning() { document.getElementById('dup-warning')?.remove(); }

// ─────────────────────────────────────────────
// 12. TOAST STACK
// ─────────────────────────────────────────────
const _toastStack = [];
const _origShowToast = window.showToast;

window.showToast = function (msg, type = 'info') {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const el = document.createElement('div');
    el.id = id;
    const bottomPx = 2 + _toastStack.length * 4.5;
    el.style.cssText = `position:fixed;right:2rem;bottom:${bottomPx}rem;padding:0.85rem 1.2rem;
        z-index:10002;background:${colors[type] || colors.info};color:white;border-radius:10px;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:slideIn 0.3s ease;
        display:flex;align-items:center;gap:0.6rem;max-width:340px;font-size:0.88rem;font-weight:500;transition:bottom 0.3s ease;`;
    el.innerHTML = `<span style="font-size:1rem;">${icons[type] || 'ℹ'}</span><span style="flex:1;">${msg}</span>
        <button onclick="document.getElementById('${id}')?.remove();window._removeToast('${id}');"
            style="background:transparent;border:none;color:rgba(255,255,255,0.8);cursor:pointer;padding:0;margin-left:4px;">✕</button>`;
    document.body.appendChild(el);
    _toastStack.push(id);
    setTimeout(() => { el.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => { el.remove(); window._removeToast(id); }, 300); }, 3500);
};

window._removeToast = function (id) {
    const i = _toastStack.indexOf(id); if (i > -1) _toastStack.splice(i, 1);
    _toastStack.forEach((tid, idx) => {
        const t = document.getElementById(tid);
        if (t) t.style.bottom = `${2 + idx * 4.5}rem`;
    });
};

// ─────────────────────────────────────────────
// 13. KEYBOARD SHORTCUTS POPUP
// ─────────────────────────────────────────────
function showShortcutsPopup() {
    const ex = document.getElementById('shortcuts-popup'); if (ex) { ex.remove(); return; }
    const shortcuts = [
        ['N', 'New Lead'], ['?', 'Shortcuts'], ['Alt+1', 'Dashboard'], ['Alt+2', 'Pipeline'],
        ['Alt+3', 'All Leads'], ['Alt+4', 'Automation'], ['Alt+5', 'Reports'],
        ['Esc', 'Close Modal'], ['Ctrl+E', 'Export CSV'], ['Ctrl+F', 'Focus Search'],
        ['Ctrl+Shift+R', 'Refresh Data']
    ];
    const popup = document.createElement('div');
    popup.id = 'shortcuts-popup'; popup.className = 'modal-overlay'; popup.style.display = 'flex';
    popup.innerHTML = `<div class="modal glass-panel" style="max-width:480px;width:95%;">
        <div class="modal-header">
            <h2 style="display:flex;align-items:center;gap:0.5rem;"><span class="material-icons-round">keyboard</span>Keyboard Shortcuts</h2>
            <button class="btn-icon" onclick="document.getElementById('shortcuts-popup').remove()"><span class="material-icons-round">close</span></button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
            ${shortcuts.map(([k, d]) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.8rem;background:rgba(255,255,255,0.04);border-radius:8px;">
                <span style="color:var(--text-muted);font-size:0.85rem;">${d}</span>
                <kbd style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:5px;padding:3px 8px;font-size:0.75rem;font-family:monospace;color:#f8fafc;white-space:nowrap;">${k}</kbd>
            </div>`).join('')}
        </div>
        <p style="text-align:center;margin-top:1rem;color:var(--text-muted);font-size:0.8rem;">Press <kbd style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;padding:2px 6px;">?</kbd> anytime to toggle</p>
    </div>`;
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
    document.body.appendChild(popup);
}

// ─────────────────────────────────────────────
// 14. GLOBAL KEYBOARD HANDLERS
// ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    if (e.key === 'Escape') ['wa-modal', 'call-modal', 'shortcuts-popup', 'bulk-status-dialog'].forEach(id => document.getElementById(id)?.remove());
    if (e.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA') showShortcutsPopup();
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); exportLeadsToCSV(); }
    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'R') { e.preventDefault(); if (typeof loadLeads === 'function') loadLeads(); }
});

// ─────────────────────────────────────────────
// 15. PATCH KANBAN CALL & WA ACTIONS
// ─────────────────────────────────────────────
// Override handleCardAction to use new modals
const _origHandleCardAction = window.handleCardAction;
window.handleCardAction = function (action, lead, card) {
    if (action === 'call') {
        openCallOutcomeLogger(lead.lead_id, lead.name, lead.phone);
    } else if (action === 'whatsapp') {
        if (lead.phone) openWhatsAppTemplates(lead);
        else showToast('No phone number', 'error');
    } else if (_origHandleCardAction) {
        _origHandleCardAction(action, lead, card);
    }
};

// ─────────────────────────────────────────────
// 16. INITIALIZE ALL ENHANCEMENTS
// ─────────────────────────────────────────────
function initEnhancements() {
    console.log('🚀 LeadOS Enhancements Loading...');

    // Patch enhanced scoring
    if (window.DB) window.DB.calculateLeadScore = enhancedLeadScore;

    // Start follow-up alerts every 60s
    checkFollowupAlerts();
    setInterval(checkFollowupAlerts, 60000);

    // Setup advanced search panel
    setupAdvancedSearch();

    // Setup duplicate check on new lead form
    setupDuplicateCheck();

    // Render dashboard widgets (retry until elements exist)
    const tryWidgets = () => {
        if (document.getElementById('followup-today-list')) {
            renderTodayFollowups();
            renderLeadsAtRisk();
            renderSourceROIReport();
        } else {
            setTimeout(tryWidgets, 800);
        }
    };
    setTimeout(tryWidgets, 1500);

    console.log('✅ LeadOS Enhancements Active!');
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initEnhancements, 600));
} else {
    setTimeout(initEnhancements, 600);
}

// Global exports
window.openWhatsAppTemplates = openWhatsAppTemplates;
window.openCallOutcomeLogger = openCallOutcomeLogger;
window.exportLeadsToCSV = exportLeadsToCSV;
window.toggleSmartSort = toggleSmartSort;
window.calcPriorityScore = calcPriorityScore;
window.showShortcutsPopup = showShortcutsPopup;
window.renderTodayFollowups = renderTodayFollowups;
window.renderLeadsAtRisk = renderLeadsAtRisk;
window.renderSourceROIReport = renderSourceROIReport;
window.sendWATemplate = sendWATemplate;
window.sendCustomWA = sendCustomWA;
window.selectCallOutcome = selectCallOutcome;
window.submitCallOutcome = submitCallOutcome;
window.removeDupWarning = removeDupWarning;

console.log('📦 Enhancement module loaded!');
