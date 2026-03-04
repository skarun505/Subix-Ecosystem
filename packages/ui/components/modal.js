/**
 * Subix Modal Component
 * =====================
 * Reusable modal dialog with backdrop.
 * 
 * Usage:
 *   const modal = new SubixModal({ title: 'Confirm', content: '...' });
 *   modal.open();
 *   modal.close();
 */

const MODAL_STYLES = `
    .subix-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: var(--subix-z-modal, 400);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity var(--subix-transition-base, 250ms ease);
        pointer-events: none;
    }
    .subix-modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
    }
    .subix-modal {
        background: var(--subix-bg-card, #16213E);
        border-radius: var(--subix-radius-lg, 16px);
        padding: 28px;
        max-width: 520px;
        width: 90%;
        box-shadow: var(--subix-shadow-lg, 0 8px 24px rgba(0,0,0,0.5));
        transform: translateY(20px) scale(0.95);
        transition: transform var(--subix-transition-base, 250ms ease);
    }
    .subix-modal-overlay.active .subix-modal {
        transform: translateY(0) scale(1);
    }
    .subix-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
    }
    .subix-modal-title {
        font-family: var(--subix-font-family, 'Inter', sans-serif);
        font-size: var(--subix-font-xl, 1.25rem);
        font-weight: 700;
        color: var(--subix-text-primary, #fff);
    }
    .subix-modal-close {
        background: none;
        border: none;
        color: var(--subix-text-muted, #6B6B8D);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        transition: color var(--subix-transition-fast, 150ms ease);
    }
    .subix-modal-close:hover {
        color: var(--subix-text-primary, #fff);
    }
    .subix-modal-body {
        color: var(--subix-text-secondary, #B0B0C8);
        font-family: var(--subix-font-family, 'Inter', sans-serif);
        font-size: var(--subix-font-base, 1rem);
        line-height: 1.6;
    }
    .subix-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
    }
`;

let modalStyleInjected = false;

function ensureModalStyles() {
    if (!modalStyleInjected && typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = MODAL_STYLES;
        document.head.appendChild(style);
        modalStyleInjected = true;
    }
}

export class SubixModal {
    constructor({ title = '', content = '', footer = '', onClose = null } = {}) {
        ensureModalStyles();
        this.onClose = onClose;

        this.overlay = document.createElement('div');
        this.overlay.className = 'subix-modal-overlay';
        this.overlay.innerHTML = `
            <div class="subix-modal">
                <div class="subix-modal-header">
                    <span class="subix-modal-title">${title}</span>
                    <button class="subix-modal-close">&times;</button>
                </div>
                <div class="subix-modal-body">${content}</div>
                ${footer ? `<div class="subix-modal-footer">${footer}</div>` : ''}
            </div>
        `;

        this.overlay.querySelector('.subix-modal-close').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.body.appendChild(this.overlay);
    }

    open() {
        requestAnimationFrame(() => this.overlay.classList.add('active'));
    }

    close() {
        this.overlay.classList.remove('active');
        setTimeout(() => {
            this.overlay.remove();
            if (this.onClose) this.onClose();
        }, 300);
    }
}

if (typeof window !== 'undefined') {
    window.SubixModal = SubixModal;
}
