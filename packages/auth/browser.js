/**
 * @subix/auth — Browser Bundle (for vanilla JS apps)
 * ====================================================
 * Include AFTER Supabase CDN and packages/config/browser.js:
 * 
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="../../packages/config/browser.js"></script>
 *   <script src="../../packages/auth/browser.js"></script>
 * 
 * Then use: window.SubixAuth.signIn(email, password)
 */

(function () {
    const config = window.SubixConfig;
    if (!config) {
        console.error('❌ SubixAuth: SubixConfig not found. Load packages/config/browser.js first!');
        return;
    }

    // Create Supabase client
    let client = null;
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            client = supabase.createClient(config.supabaseUrl, config.supabaseKey);
        } else {
            console.error('❌ SubixAuth: Supabase SDK not loaded. Add the CDN script first.');
            return;
        }
    } catch (e) {
        console.error('❌ SubixAuth: Failed to initialize Supabase:', e);
        return;
    }

    window.SubixAuth = {
        client,

        async signIn(email, password) {
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        },

        async signUp(email, password, metadata = {}) {
            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: { data: metadata },
            });
            if (error) throw error;
            return data;
        },

        async signOut() {
            const { error } = await client.auth.signOut();
            if (error) throw error;
        },

        async getUser() {
            const { data: { user }, error } = await client.auth.getUser();
            if (error) throw error;
            return user;
        },

        async getSession() {
            const { data: { session }, error } = await client.auth.getSession();
            if (error) throw error;
            return session;
        },

        onAuthChange(callback) {
            const { data: { subscription } } = client.auth.onAuthStateChange(callback);
            return () => subscription.unsubscribe();
        },

        async resetPassword(email) {
            const { error } = await client.auth.resetPasswordForEmail(email, {
                redirectTo: `${config.authUrl}/reset-password`,
            });
            if (error) throw error;
        },

        async updatePassword(newPassword) {
            const { error } = await client.auth.updateUser({ password: newPassword });
            if (error) throw error;
        },

        async requireAuth() {
            const session = await this.getSession();
            if (!session) {
                const returnTo = encodeURIComponent(window.location.href);
                window.location.href = `${config.authUrl}?redirect=${returnTo}`;
                return null;
            }
            return session;
        },

        async signInWithProvider(provider) {
            const { data, error } = await client.auth.signInWithOAuth({
                provider,
                options: { redirectTo: window.location.origin },
            });
            if (error) throw error;
            return data;
        },
    };

    console.log('✅ SubixAuth initialized');
})();
