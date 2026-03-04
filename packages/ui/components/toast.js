/**
 * Subix Toast Component
 * =====================
 * A reusable toast notification system.
 * 
 * Usage (Browser):
 *   <script src="../../packages/ui/components/toast.js"></script>
 *   showToast('Hello!', 'success');
 * 
 * Usage (ES Module):
 *   import { showToast } from '@subix/ui';
 *   showToast('Hello!', 'success');
 */

const TOAST_STYLES = `
    .subix-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: var(--subix-z-toast, 500);
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }
    .subix-toast {
        padding: 14px 20px;
        border-radius: var(--subix-radius-md, 10px);
        color: #fff;
        font-family: var(--subix-font-family, 'Inter', sans-serif);
        font-size: 0.9rem;
        font-weight: 500;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        pointer-events: auto;
        animation: subix-toast-in 0.3s ease forwards;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 380px;
    }
    .subix-toast.success { background: rgba(16, 185, 129, 0.9); }
    .subix-toast.error   { background: rgba(239, 68, 68, 0.9); }
    .subix-toast.warning { background: rgba(245, 158, 11, 0.9); }
    .subix-toast.info    { background: rgba(59, 130, 246, 0.9); }
    .subix-toast.hiding {
        animation: subix-toast-out 0.3s ease forwards;
    }
    @keyframes subix-toast-in {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes subix-toast-out {
        from { transform: translateX(0); opacity: 1; }
        to   { transform: translateX(100%); opacity: 0; }
    }
`;

const ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

let containerEl = null;
let styleInjected = false;

function ensureContainer() {
    if (!styleInjected) {
        const style = document.createElement('style');
        style.textContent = TOAST_STYLES;
        document.head.appendChild(style);
        styleInjected = true;
    }
    if (!containerEl) {
        containerEl = document.createElement('div');
        containerEl.className = 'subix-toast-container';
        document.body.appendChild(containerEl);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    ensureContainer();

    const toast = document.createElement('div');
    toast.className = `subix-toast ${type}`;
    toast.innerHTML = `<span>${ICONS[type] || ''}</span><span>${message}</span>`;
    containerEl.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Make available globally for browser script usage
if (typeof window !== 'undefined') {
    window.showToast = showToast;
}

export class SubixToast {
    static success(msg, duration) { showToast(msg, 'success', duration); }
    static error(msg, duration) { showToast(msg, 'error', duration); }
    static warning(msg, duration) { showToast(msg, 'warning', duration); }
    static info(msg, duration) { showToast(msg, 'info', duration); }
}
