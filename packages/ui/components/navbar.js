/**
 * Subix Navbar Component
 * ======================
 * Shared navigation bar structure for product apps.
 * Provides consistent branding and product switching.
 */

const NAVBAR_STYLES = `
    .subix-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 60px;
        background: var(--subix-bg-secondary, #1A1A2E);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        font-family: var(--subix-font-family, 'Inter', sans-serif);
        position: sticky;
        top: 0;
        z-index: var(--subix-z-sticky, 200);
    }
    .subix-navbar-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: var(--subix-text-primary, #fff);
        font-weight: 700;
        font-size: 1.1rem;
    }
    .subix-navbar-brand img {
        height: 28px;
        width: auto;
    }
    .subix-navbar-links {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .subix-navbar-link {
        padding: 8px 14px;
        border-radius: var(--subix-radius-sm, 6px);
        color: var(--subix-text-secondary, #B0B0C8);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all var(--subix-transition-fast, 150ms ease);
    }
    .subix-navbar-link:hover,
    .subix-navbar-link.active {
        background: var(--subix-bg-surface, rgba(255, 255, 255, 0.05));
        color: var(--subix-text-primary, #fff);
    }
    .subix-navbar-user {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .subix-navbar-avatar {
        width: 34px;
        height: 34px;
        border-radius: var(--subix-radius-full, 50%);
        background: var(--subix-primary, #6C63FF);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
    }
`;

let navStyleInjected = false;

function ensureNavStyles() {
    if (!navStyleInjected && typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = NAVBAR_STYLES;
        document.head.appendChild(style);
        navStyleInjected = true;
    }
}

export class SubixNavbar {
    /**
     * @param {Object} options
     * @param {string} options.brandName - Product name (e.g. "LeadOS")
     * @param {string} options.logoSrc - Path to logo image
     * @param {Array} options.links - [{ label, href, active? }]
     * @param {Object} options.user - { name, avatar? }
     * @param {string} options.containerSelector - Where to mount (default: 'body', prepend)
     */
    static render({ brandName = 'Subix', logoSrc = '', links = [], user = null, containerSelector = 'body' } = {}) {
        ensureNavStyles();

        const nav = document.createElement('nav');
        nav.className = 'subix-navbar';

        const brand = logoSrc
            ? `<a class="subix-navbar-brand" href="/"><img src="${logoSrc}" alt="${brandName}"> ${brandName}</a>`
            : `<a class="subix-navbar-brand" href="/">${brandName}</a>`;

        const linksHtml = links.map(l =>
            `<a class="subix-navbar-link ${l.active ? 'active' : ''}" href="${l.href}">${l.label}</a>`
        ).join('');

        const userHtml = user
            ? `<div class="subix-navbar-user">
                <div class="subix-navbar-avatar">${user.name ? user.name[0].toUpperCase() : '?'}</div>
               </div>`
            : '';

        nav.innerHTML = `
            ${brand}
            <div class="subix-navbar-links">${linksHtml}</div>
            ${userHtml}
        `;

        const container = document.querySelector(containerSelector);
        if (container) {
            container.prepend(nav);
        }

        return nav;
    }
}

if (typeof window !== 'undefined') {
    window.SubixNavbar = SubixNavbar;
}
