import { notificationService } from '../core/notification.js';
import { authService } from '../core/auth.js';

export function renderNotificationBell() {
    const user = authService.getCurrentUser();
    const container = document.createElement('div');
    container.className = 'notification-bell-container';
    container.style.position = 'relative';
    container.style.cursor = 'pointer';

    const updateBell = async () => {
        const notifs = await notificationService.getNotifications(user.userId, true);
        const unreadCount = notifs.length;
        container.innerHTML = `
            <div class="bell-icon" style="font-size: 1.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bell"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            ${unreadCount > 0 ? `
                <span class="badge badge-danger" style="position: absolute; top: -5px; right: -5px; padding: 2px 5px; border-radius: 10px; font-size: 10px;">
                    ${unreadCount}
                </span>
            ` : ''}
            <div id="notification-dropdown" class="card" style="display: none; position: absolute; right: 0; top: 40px; width: 300px; z-index: 1000; padding: 1rem; max-height: 400px; overflow-y: auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); background: var(--surface); border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
                    <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">Notifications</h4>
                    <button class="btn btn-sm btn-text" id="mark-all-read" style="font-size: 0.75rem;">Mark all read</button>
                </div>
                <div id="notif-list"></div>
            </div>
        `;


        const dropdown = container.querySelector('#notification-dropdown');
        container.onclick = (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            if (dropdown.style.display === 'block') loadNotifications();
        };

        const markAllBtn = container.querySelector('#mark-all-read');
        if (markAllBtn) {
            markAllBtn.onclick = async (e) => {
                e.stopPropagation();
                await notificationService.markAllAsRead(user.userId);
                await updateBell();
            };
        }
    };

    const loadNotifications = async () => {
        const list = container.querySelector('#notif-list');
        const notifs = await notificationService.getNotifications(user.userId);

        if (notifs.length === 0) {
            list.innerHTML = '<p class="text-center text-muted p-4">No notifications</p>';
            return;
        }

        list.innerHTML = notifs.map(n => `
            <div class="p-2 mb-1 rounded ${n.isRead ? '' : 'bg-gray-100'}" style="border-bottom: 1px solid #f1f5f9; background: ${n.isRead ? 'transparent' : 'var(--bg-secondary)'}">
                <div class="font-medium text-sm flex items-center gap-2">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${getTypeColor(n.type)}"></span>
                    ${n.title}
                </div>
                <div class="text-xs text-muted">${n.message}</div>
                <div class="text-xs text-muted mt-1" style="font-size: 9px;">${new Date(n.createdAt).toLocaleTimeString()}</div>
            </div>
        `).join('');
    };

    function getTypeColor(type) {
        switch (type) {
            case 'success': return 'var(--success)';
            case 'warning': return 'var(--warning)';
            case 'danger': return 'var(--danger)';
            default: return 'var(--primary)';
        }
    }

    // Listen for updates
    window.addEventListener('notification-updated', updateBell);
    window.addEventListener('new-notification', updateBell);
    document.addEventListener('click', () => {
        const dropdown = container.querySelector('#notification-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    });

    updateBell();
    return container;
}
