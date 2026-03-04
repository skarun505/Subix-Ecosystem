/**
 * @subix/ui — Shared UI Components
 * ==================================
 * Reusable UI building blocks for all Subix products:
 *   - Design tokens (colors, typography, spacing)
 *   - CSS utility classes
 *   - Web Components (buttons, nav, modals, toasts)
 * 
 * For vanilla HTML apps, load via <link> and <script>:
 *   <link rel="stylesheet" href="../../packages/ui/styles/tokens.css">
 *   <script src="../../packages/ui/components/toast.js"></script>
 */

// Re-export components for ES module consumers
export { SubixToast, showToast } from './components/toast.js';
export { SubixButton } from './components/button.js';
export { SubixModal } from './components/modal.js';
export { SubixNavbar } from './components/navbar.js';
