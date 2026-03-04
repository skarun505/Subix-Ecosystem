/**
 * ═══════════════════════════════════════════════════════
 *  SUBIX ACCOUNTS — Sign Up Script
 *  accounts.subix.in/signup  |  signup.js
 * ═══════════════════════════════════════════════════════
 */

// ── Configuration ──────────────────────────────────────
const SUPABASE_URL = window.SubixConfig.supabaseUrl;
const SUPABASE_KEY = window.SubixConfig.supabaseKey;

// ── Init Supabase ───────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DOM refs ────────────────────────────────────────────
const signupForm = document.getElementById("signup-form");
const nameInput = document.getElementById("name-input");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const confirmInput = document.getElementById("confirm-input");
const termsCheck = document.getElementById("terms-check");
const signupBtn = document.getElementById("signup-btn");
const googleBtn = document.getElementById("google-btn");
const eyeToggle = document.getElementById("eye-toggle");
const eyeIcon = document.getElementById("eye-icon");

const errorToast = document.getElementById("error-toast");
const toastMsg = document.getElementById("toast-msg");
const successToast = document.getElementById("success-toast");
const successMsg = document.getElementById("success-msg");

const strengthWrap = document.getElementById("strength-wrap");
const strengthFill = document.getElementById("strength-fill");
const strengthLabel = document.getElementById("strength-label");
const matchIcon = document.getElementById("match-icon");

const verifyScreen = document.getElementById("verify-screen");
const verifyEmailDisplay = document.getElementById("verify-email-display");
const resendBtn = document.getElementById("resend-btn");
const signupMain = document.getElementById("signup-main");

// ── Helpers ─────────────────────────────────────────────

function showError(msg) {
    toastMsg.textContent = msg;
    errorToast.setAttribute("aria-hidden", "false");
    successToast.setAttribute("aria-hidden", "true");
    clearTimeout(showError._t);
    showError._t = setTimeout(() => errorToast.setAttribute("aria-hidden", "true"), 7000);
}

function showSuccess(msg) {
    successMsg.textContent = msg;
    successToast.setAttribute("aria-hidden", "false");
    errorToast.setAttribute("aria-hidden", "true");
    clearTimeout(showSuccess._t);
    showSuccess._t = setTimeout(() => successToast.setAttribute("aria-hidden", "true"), 7000);
}

function setLoading(btn, loading) {
    if (loading) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

/** Mark input field as invalid */
function markInvalid(input) {
    input.classList.add("invalid");
    input.addEventListener("input", () => input.classList.remove("invalid"), { once: true });
}

/** Determine redirect URL from ?next= query param, localStorage fallback, or default fallback */
function getRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    let next = params.get("next");

    if (next) {
        localStorage.setItem('subix_next_url', next);
    } else {
        next = localStorage.getItem('subix_next_url');
    }

    try {
        if (next) {
            const decodedNext = decodeURIComponent(next);
            // Safety check: ensure it's not trying to redirect to the accounts/login page itself to avoid loops
            if (decodedNext.split('?')[0].includes(window.location.hostname)) {
                return "https://leados.subix.in/dashboard";
            }

            const parsed = new URL(decodedNext);
            if (parsed.hostname.endsWith(".subix.in") || parsed.hostname === "subix.in") {
                return parsed.href;
            }
        }
    } catch (_) { }
    return "https://leados.subix.in/dashboard";
}

/** SSO Handoff Helper */
function getHandoffUrl(url, session) {
    if (!session || !url) return url;
    const cleanUrl = url.split('#')[0];
    const ssoHash = `#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=${session.expires_in}&token_type=bearer`;
    return cleanUrl + ssoHash;
}

// ── Session Check (redirect if already logged in) ───────
(async () => {
    try {
        const { data } = await sb.auth.getSession();
        if (data.session) {
            const target = getRedirectUrl();
            const currentUrlBase = window.location.origin + window.location.pathname;

            // Only redirect if different from current page to avoid loops
            if (target && !target.includes(currentUrlBase)) {
                window.location.replace(getHandoffUrl(target, data.session));
            }
        }
    } catch (e) {
        console.warn("Session check failed:", e.message);
    }
})();

// ── Password Strength Meter ─────────────────────────────
function getPasswordStrength(pw) {
    if (!pw) return { score: 0, label: "", cls: "" };

    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { score, label: "Weak", cls: "weak" };
    if (score <= 3) return { score, label: "Fair", cls: "fair" };
    return { score, label: "Strong", cls: "strong" };
}

passwordInput.addEventListener("input", () => {
    const pw = passwordInput.value;
    const res = getPasswordStrength(pw);

    if (!pw) {
        strengthWrap.classList.remove("visible");
        return;
    }

    strengthWrap.classList.add("visible");
    strengthFill.className = `strength-fill ${res.cls}`;
    strengthLabel.className = `strength-label ${res.cls}`;
    strengthLabel.textContent = res.label;

    // Also re-check confirm match
    updateMatchIcon();
});

// ── Confirm Password Match Icon ─────────────────────────
function updateMatchIcon() {
    const pw = passwordInput.value;
    const cfm = confirmInput.value;

    if (!cfm) {
        matchIcon.textContent = "";
        return;
    }
    if (pw === cfm) {
        matchIcon.textContent = "✓";
        matchIcon.style.color = "#ccff00";
        confirmInput.classList.remove("invalid");
    } else {
        matchIcon.textContent = "✕";
        matchIcon.style.color = "#ff6b6b";
    }
}

confirmInput.addEventListener("input", updateMatchIcon);

// ── Password Visibility Toggle ──────────────────────────
const eyeOpenSvg = `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`;
const eyeCloseSvg = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

eyeToggle.addEventListener("click", () => {
    const isPw = passwordInput.type === "password";
    passwordInput.type = isPw ? "text" : "password";
    eyeIcon.innerHTML = isPw ? eyeCloseSvg : eyeOpenSvg;
    eyeToggle.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
});

// ── Show Verification Screen ────────────────────────────
function showVerifyScreen(email) {
    verifyEmailDisplay.textContent = email;
    verifyScreen.setAttribute("aria-hidden", "false");
    signupMain.setAttribute("aria-hidden", "true");
    signupMain.style.opacity = "0";
    signupMain.style.pointerEvents = "none";
}

// ── Resend Verification Email ───────────────────────────
let lastEmail = "";

resendBtn.addEventListener("click", async () => {
    if (!lastEmail) return;

    resendBtn.disabled = true;
    resendBtn.textContent = "Sending…";

    try {
        const { error } = await sb.auth.resend({
            type: "signup",
            email: lastEmail,
        });
        resendBtn.textContent = error
            ? "Failed to resend. Try again."
            : "✓ Email resent! Check your inbox.";
    } catch {
        resendBtn.textContent = "Something went wrong.";
    }

    // Re-enable after 30s
    setTimeout(() => {
        resendBtn.disabled = false;
        resendBtn.innerHTML = `Didn't receive it? <span class="resend-link">Resend email</span>`;
    }, 30000);
});

// ── Sign Up Form Submit ─────────────────────────────────
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const agreed = termsCheck.checked;

    // ── Validation ──────────────────────────────────────
    let valid = true;

    if (!name || name.length < 2) {
        markInvalid(nameInput);
        valid = false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markInvalid(emailInput);
        valid = false;
    }

    const strength = getPasswordStrength(password);
    if (!password || password.length < 8) {
        markInvalid(passwordInput);
        valid = false;
    } else if (strength.cls === "weak") {
        markInvalid(passwordInput);
        showError("Password is too weak. Add uppercase letters, numbers, or symbols.");
        return;
    }

    if (password !== confirm) {
        markInvalid(confirmInput);
        valid = false;
    }

    if (!agreed) {
        showError("Please accept the Terms of Service and Privacy Policy to continue.");
        return;
    }

    if (!valid) {
        showError("Please fill in all fields correctly.");
        return;
    }

    setLoading(signupBtn, true);
    lastEmail = email;

    try {
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    display_name: name.split(" ")[0],
                },
                emailRedirectTo: "https://accounts.subix.in",
            },
        });

        if (error) {
            // Friendly messages
            const msg = error.message.includes("already registered")
                ? "This email is already registered. Try signing in instead."
                : error.message.includes("Password should")
                    ? "Password must be at least 8 characters."
                    : error.message;

            showError(msg);
        } else if (data.user) {
            // Check if email confirmation is required
            if (data.user.identities && data.user.identities.length === 0) {
                // Already registered but unconfirmed
                showError("This email is already registered. Please check your inbox for a confirmation link.");
            } else if (!data.session) {
                // Email confirmation required — show verify screen
                showVerifyScreen(email);
            } else {
                // Email confirmation disabled — directly logged in
                showSuccess("Account created! Redirecting…");
                setTimeout(() => window.location.replace(getHandoffUrl(getRedirectUrl(), data.session)), 1000);
            }
        }
    } catch (err) {
        showError("Something went wrong. Please try again.");
        console.error("Signup error:", err);
    } finally {
        setLoading(signupBtn, false);
    }
});

// ── Google OAuth Sign Up ────────────────────────────────
googleBtn.addEventListener("click", async () => {
    setLoading(googleBtn, true);

    try {
        const { error } = await sb.auth.signInWithOAuth({
            provider: "google",
            options: {
                // IMPORTANT: Do not include window.location.search to prevent Google 500 errors.
                redirectTo: window.location.origin + window.location.pathname,
                queryParams: {
                    access_type: "offline",
                    prompt: "select_account",
                },
            },
        });

        if (error) {
            showError("Google sign-up failed: " + error.message);
            setLoading(googleBtn, false);
        }
    } catch (err) {
        showError("Something went wrong with Google sign-up.");
        setLoading(googleBtn, false);
    }
});
