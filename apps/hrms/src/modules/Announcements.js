import { announcementService } from '../core/announcements.js';
import { authService } from '../core/auth.js';
import { toast } from '../core/toast.js';

export function renderAnnouncements() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();
  const isHROrAdmin = currentUser && (currentUser.role === 'hr_admin' || currentUser.role === 'super_admin');


  // ... (previous code)

  container.innerHTML = `
    <div class="page-header" style="background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(5, 5, 5, 1) 100%); padding: 3rem 2rem; border-radius: 24px; border: 1px solid rgba(204, 255, 0, 0.1); margin-bottom: 2rem; position: relative; overflow: hidden;">
        <div style="position: relative; z-index: 2;">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="page-title" style="font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 700;">Company Announcements</h1>
                    <p class="page-subtitle" style="color: var(--text-muted); font-size: 1.1rem;">Stay updated with company news and events</p>
                </div>
                ${isHROrAdmin ? '<button class="btn btn-primary" id="create-announcement-btn" style="padding: 0.75rem 1.5rem; font-weight: 600;">+ New Announcement</button>' : ''}
            </div>
        </div>
        
        <!-- Decorative Elements -->
        <div style="position: absolute; right: -50px; top: -50px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204, 255, 0, 0.1) 0%, transparent 70%); border-radius: 50%; filter: blur(40px);"></div>
    </div>

    <!-- Category Filters -->
    <div class="card mb-6" style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem;">
      <div class="flex gap-3" style="flex-wrap: wrap;">
        <button class="filter-btn active" data-category="">All Updates</button>
        <button class="filter-btn" data-category="fun_friday">🎉 Fun Friday</button>
        <button class="filter-btn" data-category="festival">🎊 Festivals</button>
        <button class="filter-btn" data-category="leave">📅 Leave Updates</button>
        <button class="filter-btn" data-category="party">🎈 Parties</button>
        <button class="filter-btn" data-category="policy">📋 Policies</button>
        <button class="filter-btn" data-category="general">💬 General</button>
      </div>
    </div>

    <!-- Announcements List -->
    <div id="announcements-list" class="grid gap-6"></div>
  `;

  // Load announcements
  loadAnnouncements(container, '');

  // Filter buttons
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadAnnouncements(container, btn.dataset.category);
    });
  });

  // Create announcement button
  if (isHROrAdmin) {
    container.querySelector('#create-announcement-btn').addEventListener('click', () => {
      showCreateAnnouncementModal(container);
    });
  }

  return container;
}

async function loadAnnouncements(container, category) {
  const filters = { active: true };
  if (category) filters.category = category;

  const announcements = await announcementService.getAnnouncements(filters);
  renderAnnouncementsList(container, announcements);
}

function renderAnnouncementsList(container, announcements) {
  const listContainer = container.querySelector('#announcements-list');

  if (announcements.length === 0) {
    listContainer.innerHTML = `
      <div class="card text-center p-12" style="background: var(--surface); border: 1px border: var(--border); border-radius: 16px;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
        <h3 class="text-xl font-bold mb-2">No Announcements</h3>
        <p class="text-muted">Check back later for company updates</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = announcements.map(ann => renderAnnouncementCard(ann)).join('');
}

function renderAnnouncementCard(ann) {
  const icons = {
    fun_friday: '🎉',
    festival: '🎊',
    leave: '📅',
    party: '🎈',
    policy: '📋',
    general: '💬'
  };

  const colors = {
    fun_friday: 'var(--primary-lime)',
    festival: '#f59e0b',
    leave: '#3b82f6',
    party: '#ec4899',
    policy: '#10b981',
    general: '#6b7280'
  };

  const color = colors[ann.category] || '#6b7280';
  const icon = icons[ann.category] || '💬';

  return `
    <div class="card hover-reveal" style="border: 1px solid var(--border); border-radius: 16px; overflow: hidden; position: relative; transition: all 0.3s ease;">
      <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${color};"></div>
      
      <div style="padding: 1.5rem 1.5rem 1.5rem 2rem;">
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
                <div style="font-size: 2rem;">${icon}</div>
                <div>
                    <h3 class="text-lg font-bold" style="margin: 0; line-height: 1.2;">${ann.title}</h3>
                    <div class="text-sm text-muted mt-1">
                        ${new Date(ann.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
            <span class="badge" style="background: ${color}15; color: ${color}; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.35rem 0.75rem; border-radius: 999px;">
                ${ann.category.replace('_', ' ')}
            </span>
        </div>

        <div class="announcement-content" style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.95rem;">
            ${ann.content}
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-gray-100">
            <div class="flex items-center gap-2">
                <div class="avatar" style="width: 24px; height: 24px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted);">
                    ${ann.createdByName ? ann.createdByName.charAt(0) : 'A'}
                </div>
                <span class="text-xs text-muted">Posted by <span class="text-main font-medium">${ann.createdByName || 'Admin'}</span></span>
            </div>
            
            <div class="flex gap-4">
                <button class="btn-like" onclick="window.likeAnnouncement('${ann.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; transition: color 0.2s;">
                    👍 <span>${ann.likes?.length || 0}</span>
                </button>
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.85rem;">
                    👁️ <span>${ann.views || 0}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  `;
}

function showCreateAnnouncementModal(container) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); padding: 2rem; overflow-y: auto; z-index: 1000;';

  modal.innerHTML = `
    <div class="card" style="max-width: 700px; margin: 2rem auto;">
      <h3 class="mb-4">Create Announcement</h3>
      <form id="announcement-form">
        <div class="form-group">
          <label>Title *</label>
          <input type="text" id="ann-title" required placeholder="e.g., Fun Friday - Pizza Party!" />
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label>Category *</label>
            <select id="ann-category" required>
              <option value="general">General</option>
              <option value="fun_friday">Fun Friday</option>
              <option value="festival">Festival</option>
              <option value="leave">Leave Update</option>
              <option value="party">Party</option>
              <option value="policy">Policy</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="ann-priority">
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Content *</label>
          <textarea id="ann-content" rows="6" required placeholder="Write your announcement here..."></textarea>
        </div>

        <div class="form-group">
          <label>Expiry Date (Optional)</label>
          <input type="date" id="ann-expiry" />
        </div>

        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Publish Announcement</button>
          <button type="button" class="btn btn-secondary" id="cancel-ann-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Form submission
  modal.querySelector('#announcement-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      title: modal.querySelector('#ann-title').value,
      category: modal.querySelector('#ann-category').value,
      priority: modal.querySelector('#ann-priority').value,
      content: modal.querySelector('#ann-content').value,
      expiryDate: modal.querySelector('#ann-expiry').value || null
    };

    await announcementService.createAnnouncement(data);
    document.body.removeChild(modal);
    toast.success('Announcement published successfully!');
    loadAnnouncements(container, '');
  });

  // Cancel button
  modal.querySelector('#cancel-ann-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

// Global like function
window.likeAnnouncement = async (announcementId) => {
  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    await announcementService.likeAnnouncement(announcementId, currentUser.userId);

    const likeBtn = document.querySelector(`button[onclick="window.likeAnnouncement('${announcementId}')"]`);
    if (likeBtn) {
      const likeSpan = likeBtn.querySelector('span');
      if (likeSpan) {
        const updatedAnn = await announcementService.getAnnouncement(announcementId);
        if (updatedAnn) {
          likeSpan.innerText = updatedAnn.likes.length;
        }
      }
    }
  }
};

