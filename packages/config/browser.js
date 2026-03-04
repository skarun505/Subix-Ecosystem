/**
 * @subix/config — Browser Bundle (for vanilla JS apps)
 * =====================================================
 * Include this as a <script> tag in HTML files that need Subix config
 * without ES module support.
 * 
 * Usage:
 *   <script src="../../packages/config/browser.js"></script>
 *   Then access: window.SubixConfig.supabaseUrl, etc.
 */

window.SubixConfig = {
    // ⚠️ In Production, inject these from your CI/CD pipeline or .env
    supabaseUrl: "https://xrlqmngxxtbjxrkliypa.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybHFtbmd4eHRianhya2xpeXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzI3MTUsImV4cCI6MjA4NzMwODcxNX0.qUBlRGyY8u-gUOkAjGvgKRrK36uzMuVMZj9Qs2zODQc",

    // Core Links used across products
    authUrl: "https://accounts.subix.in",
    productBase: "https://subix.in",
    leadosUrl: "https://leados.subix.in",
    hrmsUrl: "https://hrms.subix.in",
};
