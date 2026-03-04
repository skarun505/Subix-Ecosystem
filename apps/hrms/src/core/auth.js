import { supabase } from './supabase.js';

// ✅ Authentication Service — powered by Subix Accounts (Supabase SSO)
class AuthService {
    constructor() {
        this.currentUser = null;
        this._sessionLoaded = false;
    }

    // Load session from Supabase (replaces sessionStorage check)
    async loadSession() {
        if (this._sessionLoaded) return;

        // 🛠️ LOCAL DEV BYPASS — Skip auth for local development
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalDev) {
            // Only skip auth if we already logged in during this session
            if (localStorage.getItem('sb-local-dev-auth-token')) {
                console.log("🛠️ Local dev mode — simulating auth session");
                if (!this.currentUser) {
                    this.currentUser = {
                        id: 'dev-user',
                        userId: 'dev-user',
                        email: 'dev@subix.local',
                        name: 'Dev User',
                        role: 'admin', // Full access locally
                        employeeId: 'DEV-001',
                        companyCode: 'SUBIX',
                        loginTime: new Date().toISOString(),
                    };
                }
                this._sessionLoaded = true;
                return;
            }
        }

        // Production Supabase Auth Load
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const meta = session.user.user_metadata || {};
            this.currentUser = {
                id: session.user.id,
                userId: session.user.id,
                email: session.user.email,
                name: meta.full_name || meta.name || session.user.email.split('@')[0],
                role: meta.role || 'employee',
                employeeId: meta.employee_id || session.user.id,
                companyCode: meta.company_code || 'SUBIX',
                loginTime: new Date().toISOString(),
            };
        }
        this._sessionLoaded = true;
    }

    // Check if authenticated via Supabase
    isAuthenticated() {
        // 🛠️ LOCAL DEV BYPASS
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalDev) {
            return localStorage.getItem('sb-local-dev-auth-token') === 'true';
        }

        // Sync check using stored session key (Supabase stores in localStorage)
        const keys = Object.keys(localStorage);
        return keys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    }

    // Get current user (sync, after loadSession)
    getCurrentUser() {
        return this.currentUser;
    }

    // ✅ Logout — signs out of Supabase and redirects to central login
    async logout() {
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalDev) {
            console.log("🛠️ Local dev mode — simulating logout");
            localStorage.removeItem('sb-local-dev-auth-token');
            this.currentUser = null;
            this._sessionLoaded = false;
            window.location.reload();
            return;
        }

        await supabase.auth.signOut();
        this.currentUser = null;
        this._sessionLoaded = false;
        window.location.replace('https://accounts.subix.in');
    }

    async login(identifier, password, companyCode) {
        // 🛠️ LOCAL DEV BYPASS
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalDev) {
            // Find user in db
            const { data, error } = await supabase.from('users')
                .select('*')
                .or(`email.eq.${identifier},employee_id.eq.${identifier}`)
                .eq('password', password)
                .maybeSingle();

            if (data) {
                this.currentUser = {
                    id: data.id,
                    userId: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    employeeId: data.employee_id,
                    companyCode: data.company_code,
                    loginTime: new Date().toISOString(),
                };
                this._sessionLoaded = true;
                // Store simulated token for local dev
                localStorage.setItem('sb-local-dev-auth-token', 'true');
                return { success: true, user: this.currentUser };
            }

            // Fallback for DEV mode if the user typed random stuff or specific mock
            if (identifier === 'dev-user') {
                this.currentUser = {
                    id: 'dev-user',
                    userId: 'dev-user',
                    email: 'dev@subix.local',
                    name: 'Dev User',
                    role: 'admin',
                    employeeId: 'DEV-001',
                    companyCode: 'SUBIX',
                    loginTime: new Date().toISOString(),
                };
                this._sessionLoaded = true;
                localStorage.setItem('sb-local-dev-auth-token', 'true');
                return { success: true, user: this.currentUser };
            }

            return { success: false, error: 'Invalid credentials. Check demoData.js' };
        }

        // Production Supabase Auth
        try {
            // 1. Resolve identifier to email
            let email = identifier;
            if (!identifier.includes('@')) {
                const { data } = await supabase.from('users').select('email').eq('employee_id', identifier).single();
                if (data) email = data.email;
            }

            // 2. Sign In
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) return { success: false, error: authError.message };

            await this.loadSession();
            return { success: true, user: this.currentUser };
        } catch (e) {
            return { success: false, error: 'Authentication failed' };
        }
    }
}

export const authService = new AuthService();

