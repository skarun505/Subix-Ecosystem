// ── Configuration ─────────────────────────────────────
const SUPABASE_URL = window.SubixConfig.supabaseUrl;
const SUPABASE_KEY = window.SubixConfig.supabaseKey;

// ── Init Supabase ──────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DOM refs ───────────────────────────────────────────
const resetForm = document.getElementById("reset-form");
const passwordInput = document.getElementById("password-input");
const resetBtn = document.getElementById("reset-btn");
const resetBtnText = document.getElementById("reset-btn-text");
const resetLoader = document.getElementById("reset-loader");
const eyeToggle = document.getElementById("eye-toggle");
const eyeIcon = document.getElementById("eye-icon");

const authCard = document.getElementById("auth-card");
const successScreen = document.getElementById("success-screen");

const errorToast = document.getElementById("error-toast");
const toastMsg = document.getElementById("toast-msg");
const successToast = document.getElementById("success-toast");
const successMessage = document.getElementById("success-message");

// ── Toast logic ────────────────────────────────────────
function showError(msg) {
    if (!errorToast || !toastMsg) return;
    toastMsg.textContent = msg;
    errorToast.style.display = "flex";
    hideSuccess();
}

function hideError() {
    if (errorToast) errorToast.style.display = "none";
}

function showSuccess(msg) {
    if (!successToast || !successMessage) return;
    successMessage.textContent = msg;
    successToast.style.display = "flex";
    hideError();
}

function hideSuccess() {
    if (successToast) successToast.style.display = "none";
}

function markInvalid(el) {
    if (!el) return;
    el.style.borderColor = "var(--accent-pink)";
    el.focus();
    setTimeout(() => {
        el.style.borderColor = "var(--border)";
    }, 3000);
}

// ── Loader toggles ──────────────────────────────────────
function setLoading(isLoading) {
    if (!resetBtn || !resetLoader || !resetBtnText) return;
    resetBtn.disabled = isLoading;
    if (isLoading) {
        resetBtnText.style.opacity = "0";
        resetLoader.style.display = "block";
    } else {
        resetBtnText.style.opacity = "1";
        resetLoader.style.display = "none";
    }
}

// ── Password visibility ────────────────────────────────
if (eyeToggle && eyeIcon && passwordInput) {
    eyeToggle.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";

        if (isPassword) {
            // "Eye open" icon (password visible)
            eyeIcon.innerHTML = `
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor"/>
            `;
        } else {
            // "Eye closed" default
            eyeIcon.innerHTML = `
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    });
}

// ── Check Session Requirements on Load ────────────────
document.addEventListener("DOMContentLoaded", async () => {
    // If we land here, Supabase JS should have picked up the access_token in the URL 
    // and established a session automatically. We verify the session is active.

    // We can also let the auth state change listener catch the newly established session
});

// ── Main Password Update Form ──────────────────────────
if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();
        hideSuccess();

        const pass = passwordInput.value;

        if (!pass || pass.length < 6) {
            showError("Password must be at least 6 characters.");
            markInvalid(passwordInput);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await sb.auth.updateUser({ password: pass });

            if (error) {
                showError("Could not update password: " + error.message);
                markInvalid(passwordInput);
            } else {
                // Success!
                authCard.style.display = "none";
                successScreen.style.display = "flex";
            }
        } catch (err) {
            showError("Something went wrong. Please try again.");
            console.error("Reset error:", err);
        } finally {
            setLoading(false);
        }
    });
}
