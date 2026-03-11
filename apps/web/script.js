document.addEventListener('DOMContentLoaded', () => {
    // Select elements (handle potential nulls since these classes might not exist on all pages)
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.getElementById('mobileMenu');

    // Only proceed if mobile elements exist
    if (mobileToggle && mobileMenu) {

        // Populate mobile menu with links from desktop nav, if empty
        const desktopLinks = document.querySelector('.nav-links:not(.mobile-menu)');
        const desktopCta = document.querySelector('.nav-cta-slot');

        if (desktopLinks && mobileMenu.children.length === 0) {
            mobileMenu.innerHTML = desktopLinks.innerHTML;

            // Add the CTA/Profile slot to the mobile menu as the last item
            if (desktopCta) {
                const li = document.createElement('li');
                li.innerHTML = desktopCta.innerHTML;
                mobileMenu.appendChild(li);
            }
        }

        // Toggle functionality
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');

            // Optional: Toggle icon
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (mobileMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Ticker animation clone (if ticker exists)
    const tickerWrap = document.querySelector('.ticker-wrap .container');
    if (tickerWrap) {
        const clone = tickerWrap.cloneNode(true);
        tickerWrap.parentElement.appendChild(clone);

        // Add basic infinite scroll logic via CSS animation in JS for simplicity or rely on CSS
        // For this "Gen Z" vibe, let's add a quicker, smoother marquee style via CSS injection
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
            }
            .ticker-wrap { display: flex; gap: 4rem; width: 100%; max-width: 100%; overflow: hidden; }
            .ticker-wrap > div { flex-shrink: 0; animation: marquee 20s linear infinite; padding-right: 4rem; }
        `;
        document.head.appendChild(style);
    }

    // Scroll Reveal Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom, .process-card, .card').forEach(el => {
        // Add default reveal class if none present
        if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right') && !el.classList.contains('reveal-zoom')) {
            el.classList.add('reveal');
        }
        observer.observe(el);
    });


    // FAQ Toggle
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            // Add click listener
            question.addEventListener('click', (e) => {
                
                const isActive = item.classList.contains('active');

                // Close all other items first
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                });

                // Toggle current item based on state BEFORE the close loop
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + "px";
                } else {
                    item.classList.remove('active');
                    answer.style.maxHeight = null;
                }
            });
        }
    });

});


// --- Global Auth Profile & Modals ---
const AUTH_KEY = 'sb-xrlqmngxxtbjxrkliypa-auth-token';

// Security check: if the hash contains access tokens but we are not on the login page, Subix Auth JS hasn't parsed it!
// Bounce them to the login page so Supabase can natively parse and securely store the token in localStorage.
if (window.location.hash.includes("access_token") || window.location.hash.includes("type=recovery")) {
    window.location.replace("/login" + window.location.search + window.location.hash);
} else {
    // If the hash had an access token previously but Supabase cleared it, or if it has another hash,
    // let's ensure we enforce strict URL sanitation if they already have an active session
    if (window.location.hash.includes("access_token")) {
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}

// --- Global Auth Profile & Modals (Subix SSO) ---
(async () => {
    const _SB_URL = window.SubixConfig.supabaseUrl;
    const _SB_KEY = window.SubixConfig.supabaseKey;
    if (!window.supabase || !_SB_URL) return;

    const sb = window.supabase.createClient(_SB_URL, _SB_KEY);

    // Bounce hash tokens to login for parsing if necessary (viva handoff legacy)
    if (window.location.hash.includes("access_token")) {
        // Supabase will handle parsing this if we are on the right domain, 
        // but for now let's just let it be or clean it
    }

    // SSO Check: Wait up to 3s for session from cookie
    let session = null;
    const startTime = Date.now();
    while (Date.now() - startTime < 3000) {
        const { data } = await sb.auth.getSession();
        if (data.session) {
            session = data.session;
            break;
        }
        await new Promise(r => setTimeout(r, 500));
    }

    if (session) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const email = user.email;
        const name = meta.full_name || meta.name || email.split('@')[0];
        const displayChar = name.charAt(0).toUpperCase();

        // Render Profile Widget
        const signInLinks = document.querySelectorAll('a[href="login"], .cta-btn[href="login"]');
        signInLinks.forEach(link => {
            const container = link.parentElement;
            container.style.position = 'relative';
            container.innerHTML = `
                <div class="profile-widget" style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: #111; padding: 0.5rem 1rem; border-radius: 50px; border: 1px solid #333; transition: background 0.2s;">
                    <div style="width: 30px; height: 30px; background: #ccff00; color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
                        ${displayChar}
                    </div>
                    <span style="font-weight: 500; font-size: 0.9rem; color: #fff;">${name}</span>
                    <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 5px; color: #888;"></i>
                </div>
                <div class="profile-dropdown" style="display: none; position: absolute; top: calc(100% + 10px); right: 0; background: #0a0a0a; border: 1px solid #333; border-radius: 12px; padding: 1rem; width: max-content; min-width: 250px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 9999; text-align: left;">
                    <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; background: #ccff00; color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">
                            ${displayChar}
                        </div>
                        <div>
                            <p style="margin: 0; font-weight: 600; font-size: 1rem; color: #fff;">${name}</p>
                            <p style="margin: 0; font-size: 0.8rem; color: #888;">${email}</p>
                        </div>
                    </div>
                    <div style="border-top: 1px solid #222; margin: 1rem 0;"></div>
                    <a href="https://accounts.subix.in" style="display: block; padding: 0.5rem; color: #ddd; text-decoration: none; border-radius: 6px; font-size: 0.9rem;">
                        <i class="fas fa-user-circle" style="width: 20px;"></i> Manage Account
                    </a>
                    <button class="logout-btn" style="width: 100%; text-align: left; background: transparent; border: none; padding: 0.5rem; color: #ff5555; cursor: pointer; border-radius: 6px; font-size: 0.9rem; margin-top: 0.5rem;">
                        <i class="fas fa-sign-out-alt" style="width: 20px;"></i> Logout
                    </button>
                </div>
            `;

            const widget = container.querySelector('.profile-widget');
            const dropdown = container.querySelector('.profile-dropdown');
            const logoutBtn = container.querySelector('.logout-btn');

            let timeout;
            container.addEventListener('mouseenter', () => {
                clearTimeout(timeout);
                dropdown.style.display = 'block';
            });
            container.addEventListener('mouseleave', () => {
                timeout = setTimeout(() => {
                    dropdown.style.display = 'none';
                }, 300);
            });

            logoutBtn.addEventListener('click', async () => {
                await sb.auth.signOut();
                window.location.replace('https://accounts.subix.in?logout=true');
            });
        });

        // Welcome Popup
        if (!localStorage.getItem('subix_welcome_shown')) {
            localStorage.setItem('subix_welcome_shown', 'true');
            const modalHtml = `
                    <div id="subix-genz-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 100000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.4s ease;">
                        <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 20px; padding: 3rem; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); transform: translateY(20px); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <div style="font-size: 4rem; margin-bottom: 1rem;">🔥</div>
                            <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 2rem; margin-bottom: 1rem; color: #fff;">Vibe Check: <span style="color: #ccff00;">Passed.</span></h2>
                            <p style="color: #aaa; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
                                Absolute W! Thank you for registering. You now have the ultimate access key to pull up on <strong>all our products</strong>! Welcome to the Subix ecosystem. 🚀 
                            </p>
                            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                                <a href="https://leados.subix.in" style="background: #111; border: 1px solid #222; padding: 1rem; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; text-decoration: none; color: #fff; transition: all 0.3s;">
                                    <span>LeadOS</span> <i class="fas fa-arrow-right"></i>
                                </a>
                                <a href="https://hrms.subix.in" style="background: #111; border: 1px solid #222; padding: 1rem; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; text-decoration: none; color: #fff; transition: all 0.3s;">
                                    <span>HRMS</span> <i class="fas fa-arrow-right"></i>
                                </a>
                            </div>
                            <button id="close-modal-btn" style="background: #ccff00; color: #000; border: none; padding: 1rem 2rem; border-radius: 50px; font-weight: bold; font-size: 1rem; cursor: pointer; width: 100%;">
                                Let's Cook
                            </button>
                        </div>
                    </div>
                `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById('subix-genz-modal');
            const closeBtn = document.getElementById('close-modal-btn');
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.querySelector('div').style.transform = 'translateY(0)';
            }, 100);
            closeBtn.addEventListener('click', () => {
                modal.style.opacity = '0';
                modal.querySelector('div').style.transform = 'translateY(20px)';
                setTimeout(() => modal.remove(), 400);
            });
        }
    }
})();
