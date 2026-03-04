/**
 * @subix/config — Shared Configuration
 * =====================================
 * Central configuration for all Subix Ecosystem apps.
 * 
 * Usage (ES Module):
 *   import { supabaseUrl, supabaseKey, appUrls } from '@subix/config';
 * 
 * Usage (Vanilla JS via <script>):
 *   <script src="/packages/config/browser.js"></script>
 *   Then access window.SubixConfig
 */

// ─── Supabase Credentials ───────────────────────────────────
export const supabaseUrl = "https://xrlqmngxxtbjxrkliypa.supabase.co";
export const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybHFtbmd4eHRianhya2xpeXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzI3MTUsImV4cCI6MjA4NzMwODcxNX0.qUBlRGyY8u-gUOkAjGvgKRrK36uzMuVMZj9Qs2zODQc";

// ─── App URLs ────────────────────────────────────────────────
export const appUrls = {
    web: "https://subix.in",
    accounts: "https://accounts.subix.in",
    leados: "https://leados.subix.in",
    hrms: "https://hrms.subix.in",
};

// ─── Full Config Object ─────────────────────────────────────
const config = {
    supabaseUrl,
    supabaseKey,
    appUrls,
};

export default config;
