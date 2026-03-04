/**
 * @subix/auth — Shared Authentication Module
 * ============================================
 * Provides unified Supabase Auth for all Subix products.
 * 
 * Usage:
 *   import { supabase, signIn, signUp, signOut, getUser, onAuthChange } from '@subix/auth';
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey, appUrls } from '@subix/config';

// ─── Supabase Client (Singleton) ────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Auth Functions ─────────────────────────────────────────

/**
 * Sign in with email & password
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

/**
 * Sign up with email & password
 */
export async function signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata, // e.g. { full_name, phone, company }
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get the currently authenticated user
 */
export async function getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

/**
 * Get the current session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

/**
 * Listen for auth state changes (login, logout, token refresh)
 * @returns {function} unsubscribe function
 */
export function onAuthChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            callback(event, session);
        }
    );
    return () => subscription.unsubscribe();
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrls.accounts}/reset-password`,
    });
    if (error) throw error;
}

/**
 * Update user password (after reset link)
 */
export async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) throw error;
}

/**
 * Redirect to login if not authenticated
 * (useful as a guard in product apps)
 */
export async function requireAuth(redirectUrl) {
    const session = await getSession();
    if (!session) {
        const returnTo = encodeURIComponent(window.location.href);
        window.location.href = `${appUrls.accounts}?redirect=${returnTo}`;
        return null;
    }
    return session;
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export async function signInWithProvider(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: window.location.origin,
        },
    });
    if (error) throw error;
    return data;
}
