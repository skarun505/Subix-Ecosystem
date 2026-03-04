// Keyboard Shortcuts System
import { toast } from './toast.js';

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;

            // Don't trigger shortcuts when typing in inputs
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                // Allow ESC even in inputs
                if (e.key !== 'Escape') return;
            }

            const key = this.getKeyCombo(e);
            if (this.shortcuts.has(key)) {
                e.preventDefault();
                const handler = this.shortcuts.get(key);
                handler.callback();
            }
        });
    }

    getKeyCombo(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');

        // Add the actual key (not modifier keys)
        if (!['Control', 'Alt', 'Shift'].includes(event.key)) {
            parts.push(event.key.toUpperCase());
        }

        return parts.join('+');
    }

    register(keyCombo, description, callback) {
        this.shortcuts.set(keyCombo, { description, callback });
    }

    unregister(keyCombo) {
        this.shortcuts.delete(keyCombo);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    getAllShortcuts() {
        return Array.from(this.shortcuts.entries()).map(([key, value]) => ({
            key,
            description: value.description
        }));
    }

    showHelp() {
        const shortcuts = this.getAllShortcuts();

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'shortcuts-modal';
        modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
    `;

        const content = document.createElement('div');
        content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

        const groups = {
            'Global': ['Alt+D', 'Alt+L', 'Alt+S', 'ESCAPE'],
            'Employee': ['Alt+A', 'Alt+V', 'Alt+P'],
            'HR Admin': ['Alt+E', 'Alt+R', 'Alt+C'],
            'Manager': ['Alt+M', 'Alt+T']
        };

        content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0;">⌨️ Keyboard Shortcuts</h2>
        <button id="close-shortcuts" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">✕</button>
      </div>

      <div style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.875rem;">
        Use these keyboard shortcuts to navigate faster and boost your productivity.
      </div>

      ${Object.entries(groups).map(([groupName, keys]) => {
            const groupShortcuts = shortcuts.filter(s => keys.includes(s.key));
            if (groupShortcuts.length === 0) return '';

            return `
          <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 0.875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1rem;">
              ${groupName}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${groupShortcuts.map(shortcut => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px;">
                  <span style="font-size: 0.875rem;">${shortcut.description}</span>
                  <kbd style="
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 0.25rem 0.75rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.75rem;
                    font-weight: 600;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  ">${shortcut.key.replace('+', ' + ')}</kbd>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        }).join('')}

      <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; font-size: 0.875rem; color: var(--text-secondary);">
        💡 <strong>Tip:</strong> Press <kbd style="padding: 0.125rem 0.5rem; background: white; border: 1px solid var(--border); border-radius: 4px;">Esc</kbd> to close any modal or popup
      </div>
    `;

        modal.appendChild(content);

        // Close handlers
        const closeBtn = content.querySelector('#close-shortcuts');
        const closeModal = () => {
            modal.style.animation = 'fadeOut 0.2s ease-in';
            setTimeout(() => {
                if (modal.parentElement) {
                    modal.parentElement.removeChild(modal);
                }
            }, 200);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Add CSS animations
        if (!document.querySelector('#modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
    }
}

// Export singleton
export const shortcuts = new KeyboardShortcuts();

// Helper function to initialize app shortcuts
export function initializeAppShortcuts(handleNavigation, handleLogout) {
    // Global shortcuts
    shortcuts.register('Alt+D', 'Navigate to Dashboard', () => {
        handleNavigation('dashboard');
        toast.info('Opening Dashboard');
    });

    shortcuts.register('Alt+L', 'Logout from application', () => {
        // Use global handler
        if (window.handleLogoutClick) {
            window.handleLogoutClick();
        } else {
            console.log('Logout handler not found');
        }
    });

    shortcuts.register('Alt+S', 'Save current form', () => {
        // Find and click the first save/submit button
        const saveBtn = document.querySelector('button[type="submit"], .btn-primary:not([data-action])');
        if (saveBtn) {
            saveBtn.click();
            toast.success('Attempting to save...');
        } else {
            toast.warning('No form to save on this page');
        }
    });

    shortcuts.register('ESCAPE', 'Close modal or popup', () => {
        // Close any visible modal
        const modal = document.querySelector('[id$="-modal"], [class*="modal"]');
        if (modal && modal.style.display !== 'none') {
            modal.style.display = 'none';
            modal.remove();
        }
    });

    // Employee shortcuts
    shortcuts.register('Alt+A', 'Go to Attendance', () => {
        handleNavigation('attendance');
        toast.info('Opening Attendance');
    });

    shortcuts.register('Alt+V', 'Apply for Leave', () => {
        handleNavigation('leaves');
        toast.info('Opening Leave Management');
    });

    shortcuts.register('Alt+P', 'View Payslip', () => {
        handleNavigation('salary');
        toast.info('Opening Salary & Payslips');
    });

    // HR Admin shortcuts
    shortcuts.register('Alt+E', 'Add Employee', () => {
        handleNavigation('employees');
        setTimeout(() => {
            const addBtn = document.querySelector('button:contains("Add Employee"), [data-action="add-employee"]');
            if (addBtn) addBtn.click();
        }, 300);
        toast.info('Opening Employee Directory');
    });

    shortcuts.register('Alt+R', 'Run Payroll', () => {
        handleNavigation('payroll');
        toast.info('Opening Payroll Module');
    });

    shortcuts.register('Alt+C', 'Company Settings', () => {
        handleNavigation('company');
        toast.info('Opening Company Settings');
    });

    // Manager shortcuts
    shortcuts.register('Alt+M', 'My Team', () => {
        handleNavigation('team');
        toast.info('Opening My Team');
    });

    shortcuts.register('Alt+T', 'Pending Approvals', () => {
        handleNavigation('approvals');
        toast.info('Opening Approvals');
    });

    // Help shortcut
    shortcuts.register('Alt+H', 'Show keyboard shortcuts', () => {
        shortcuts.showHelp();
    });

    shortcuts.register('Alt+/', 'Show keyboard shortcuts', () => {
        shortcuts.showHelp();
    });

    console.log('✓ Keyboard shortcuts initialized');
}
