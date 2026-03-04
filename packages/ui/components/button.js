/**
 * Subix Button Component
 * ======================
 * Shared button styles for consistent CTA styling across products.
 * 
 * Usage:
 *   <button class="subix-btn subix-btn-primary">Get Started</button>
 *   <button class="subix-btn subix-btn-secondary">Learn More</button>
 *   <button class="subix-btn subix-btn-ghost">Cancel</button>
 */

const BUTTON_STYLES = `
    .subix-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: var(--subix-radius-md, 10px);
        font-family: var(--subix-font-family, 'Inter', sans-serif);
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--subix-transition-base, 250ms ease);
        text-decoration: none;
        line-height: 1;
        white-space: nowrap;
    }
    .subix-btn:active { transform: scale(0.97); }

    /* Primary */
    .subix-btn-primary {
        background: linear-gradient(135deg, var(--subix-primary, #6C63FF), var(--subix-primary-dark, #5A52D5));
        color: #fff;
        box-shadow: 0 4px 15px rgba(108, 99, 255, 0.4);
    }
    .subix-btn-primary:hover {
        box-shadow: 0 6px 20px rgba(108, 99, 255, 0.6);
        transform: translateY(-1px);
    }

    /* Secondary */
    .subix-btn-secondary {
        background: transparent;
        color: var(--subix-primary, #6C63FF);
        border: 2px solid var(--subix-primary, #6C63FF);
    }
    .subix-btn-secondary:hover {
        background: var(--subix-primary-alpha, rgba(108, 99, 255, 0.15));
    }

    /* Ghost */
    .subix-btn-ghost {
        background: transparent;
        color: var(--subix-text-secondary, #B0B0C8);
    }
    .subix-btn-ghost:hover {
        background: var(--subix-bg-surface, rgba(255, 255, 255, 0.05));
        color: var(--subix-text-primary, #fff);
    }

    /* Danger */
    .subix-btn-danger {
        background: linear-gradient(135deg, var(--subix-error, #EF4444), #DC2626);
        color: #fff;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }
    .subix-btn-danger:hover {
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
        transform: translateY(-1px);
    }

    /* Success */
    .subix-btn-success {
        background: linear-gradient(135deg, var(--subix-success, #10B981), #059669);
        color: #fff;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
    .subix-btn-success:hover {
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        transform: translateY(-1px);
    }

    /* Sizes */
    .subix-btn-sm { padding: 8px 16px; font-size: 0.85rem; }
    .subix-btn-lg { padding: 16px 32px; font-size: 1.1rem; }

    /* Loading */
    .subix-btn-loading {
        pointer-events: none;
        opacity: 0.7;
    }
    .subix-btn-loading::after {
        content: '';
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: subix-btn-spin 0.6s linear infinite;
    }
    @keyframes subix-btn-spin {
        to { transform: rotate(360deg); }
    }
`;

// Auto-inject styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.id = 'subix-button-styles';
    if (!document.getElementById('subix-button-styles')) {
        style.textContent = BUTTON_STYLES;
        document.head.appendChild(style);
    }
}

export class SubixButton {
    static injectStyles() {
        if (typeof document !== 'undefined' && !document.getElementById('subix-button-styles')) {
            const style = document.createElement('style');
            style.id = 'subix-button-styles';
            style.textContent = BUTTON_STYLES;
            document.head.appendChild(style);
        }
    }
}
