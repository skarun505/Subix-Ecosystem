import { authService } from '../core/auth.js';

export function renderLogin(onLogin) {
  const container = document.createElement('div');
  container.className = 'login-container';
  container.style.cssText = `
    display: flex;
    min-height: 100vh;
    background: #050505;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  `;

  // Dynamic greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingIcon = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';

  container.innerHTML = `
    <!-- Left Panel - Branding & Features -->
    <div class="login-left-panel" style="
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4rem;
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, rgba(204, 255, 0, 0.06) 0%, #050505 40%, rgba(0, 210, 255, 0.04) 100%);
    ">
      <!-- Animated Particle Canvas -->
      <canvas id="particle-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;"></canvas>

      <!-- Accent Line -->
      <div style="position: absolute; left: 0; top: 20%; width: 3px; height: 120px; background: linear-gradient(to bottom, transparent, #ccff00, transparent); border-radius: 2px;"></div>

      <div style="position: relative; z-index: 2; max-width: 540px;">
        <!-- Logo -->
        <div style="margin-bottom: 3.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <div style="
              width: 42px; height: 42px;
              background: linear-gradient(135deg, #ccff00, #a3cc00);
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 800; font-size: 1.2rem; color: #000;
              box-shadow: 0 4px 12px rgba(204, 255, 0, 0.2);
            ">S</div>
            <div>
              <div style="font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; letter-spacing: -0.5px;">Subix <span style="color: var(--primary-lime, #ccff00);">HRMS</span></div>
            </div>
          </div>
          <div style="font-size: 0.7rem; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-left: 56px;">Enterprise Workforce Platform</div>
        </div>

        <!-- Headline -->
        <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 700; line-height: 1.08; margin-bottom: 1.25rem; color: #fff;">
          Your People,<br/>
          <span style="background: linear-gradient(135deg, #ccff00 0%, #00d2ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Empowered.</span>
        </h1>

        <p style="font-size: 1.05rem; color: rgba(255,255,255,0.45); line-height: 1.75; margin-bottom: 3rem; max-width: 420px;">
          One platform to manage attendance, payroll, performance, and the entire employee lifecycle — built for growing teams.
        </p>

        <!-- Rotating Feature Showcase -->
        <div id="feature-showcase" style="
          padding: 1.5rem;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          min-height: 110px;
          transition: opacity 0.4s ease;
        ">
          <!-- Content injected by JS -->
        </div>

        <!-- Feature Dots (progress indicator) -->
        <div id="feature-dots" style="display: flex; gap: 6px; margin-top: 1rem; margin-left: 0.25rem;">
          <div class="feature-dot active" data-index="0" style="width: 24px; height: 3px; border-radius: 2px; background: #ccff00; transition: all 0.3s; cursor: pointer;"></div>
          <div class="feature-dot" data-index="1" style="width: 12px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.15); transition: all 0.3s; cursor: pointer;"></div>
          <div class="feature-dot" data-index="2" style="width: 12px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.15); transition: all 0.3s; cursor: pointer;"></div>
          <div class="feature-dot" data-index="3" style="width: 12px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.15); transition: all 0.3s; cursor: pointer;"></div>
        </div>

        <!-- Trust Badges -->
        <div style="display: flex; align-items: center; gap: 1.75rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.35); font-weight: 500;">256-bit Encrypted</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.35); font-weight: 500;">Secure Login</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.35); font-weight: 500;">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel - Login Form -->
    <div class="login-right-panel" style="
      width: 480px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem;
      background: #0a0a0a;
      border-left: 1px solid rgba(255,255,255,0.05);
      position: relative;
    ">
      <!-- Corner accent -->
      <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle at top right, rgba(204, 255, 0, 0.03) 0%, transparent 70%); pointer-events: none;"></div>

      <div style="max-width: 360px; margin: 0 auto; width: 100%; position: relative; z-index: 1;">
        <!-- Greeting -->
        <div style="margin-bottom: 2.5rem;">
          <div style="font-size: 0.85rem; color: rgba(255,255,255,0.35); margin-bottom: 0.75rem;">${greetingIcon} ${greeting}</div>
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.75rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;">Welcome Back</h2>
          <p style="font-size: 0.88rem; color: rgba(255,255,255,0.35);">Sign in to your workspace</p>
        </div>

        <!-- Login Form -->
        <form id="login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <label for="identifier" style="display: block; font-size: 0.78rem; font-weight: 500; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem;">Employee ID or Email</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              placeholder="e.g. EMP001 or john@company.com"
              required
              autofocus
              style="width: 100%; padding: 0.85rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; font-size: 0.92rem; outline: none; transition: all 0.25s ease;"
            />
          </div>

          <div>
            <label for="password" style="display: block; font-size: 0.78rem; font-weight: 500; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem;">Password</label>
            <div style="position: relative;">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                style="width: 100%; padding: 0.85rem 1rem; padding-right: 44px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; font-size: 0.92rem; outline: none; transition: all 0.25s ease;"
              />
              <button type="button" id="toggle-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.25); padding: 4px; transition: color 0.2s;" aria-label="Toggle password visibility">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>

          <div>
            <label for="companyCode" style="display: block; font-size: 0.78rem; font-weight: 500; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem;">Company Code</label>
            <input
              type="text"
              id="companyCode"
              name="companyCode"
              placeholder="Your organization code"
              required
              style="width: 100%; padding: 0.85rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; font-size: 0.92rem; outline: none; transition: all 0.25s ease;"
            />
          </div>

          <!-- Remember Me + Forgot Password Row -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -0.25rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
              <input type="checkbox" id="remember-me" style="
                appearance: none; -webkit-appearance: none;
                width: 16px; height: 16px;
                border: 1.5px solid rgba(255,255,255,0.15);
                border-radius: 4px;
                background: rgba(255,255,255,0.03);
                cursor: pointer;
                position: relative;
                transition: all 0.2s;
              " />
              <span style="font-size: 0.78rem; color: rgba(255,255,255,0.4);">Remember me</span>
            </label>
            <a href="#" id="forgot-password" style="font-size: 0.78rem; color: rgba(204, 255, 0, 0.5); text-decoration: none; transition: color 0.2s;">Forgot password?</a>
          </div>

          <div id="error-message" style="display: none; padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 10px; color: #f87171; font-size: 0.83rem; display: none;"></div>

          <button type="submit" id="login-submit-btn" style="
            width: 100%;
            padding: 0.9rem;
            background: linear-gradient(135deg, #ccff00, #a8d900);
            color: #000;
            font-weight: 700;
            font-size: 0.9rem;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(204, 255, 0, 0.15);
            margin-top: 0.25rem;
            position: relative;
            overflow: hidden;
          ">
            Sign In
          </button>
        </form>

        <!-- Separator -->
        <div style="display: flex; align-items: center; gap: 1rem; margin: 1.75rem 0;">
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.05);"></div>
          <span style="font-size: 0.65rem; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.12em;">Quick Access</span>
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.05);"></div>
        </div>

        <!-- Quick Access Role Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <button class="demo-login-btn" data-id="HR001" data-pass="hr123" data-code="COMP001" style="
            padding: 0.65rem 0.75rem;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            text-align: left;
            transition: all 0.25s ease;
          ">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #ccff00;"></div>
              <span style="font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.7);">HR Admin</span>
            </div>
          </button>

          <button class="demo-login-btn" data-id="ADMIN" data-pass="admin123" data-code="COMP001" style="
            padding: 0.65rem 0.75rem;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            text-align: left;
            transition: all 0.25s ease;
          ">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #a855f7;"></div>
              <span style="font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.7);">Super Admin</span>
            </div>
          </button>

          <button class="demo-login-btn" data-id="M001" data-pass="manager123" data-code="COMP001" style="
            padding: 0.65rem 0.75rem;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            text-align: left;
            transition: all 0.25s ease;
          ">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #00d2ff;"></div>
              <span style="font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.7);">Manager</span>
            </div>
          </button>

          <button class="demo-login-btn" data-id="E001" data-pass="emp123" data-code="COMP001" style="
            padding: 0.65rem 0.75rem;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            text-align: left;
            transition: all 0.25s ease;
          ">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></div>
              <span style="font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.7);">Employee</span>
            </div>
          </button>
        </div>

        <!-- Footer -->
        <div style="margin-top: 2.5rem; text-align: center;">
          <p style="font-size: 0.68rem; color: rgba(255,255,255,0.15); line-height: 1.6;">
            Need help? Contact <a href="mailto:support@subix.io" style="color: rgba(204, 255, 0, 0.4); text-decoration: none;">support@subix.io</a>
          </p>
          <p style="font-size: 0.62rem; color: rgba(255,255,255,0.1); margin-top: 0.4rem;">
            Subix HRMS v2.0 · © ${new Date().getFullYear()} <a href="https://www.subix.io/" target="_blank" style="color: rgba(255,255,255,0.15); text-decoration: none;">Subix Technologies</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // ==========================================
  // Feature Showcase — Rotating Content
  // ==========================================
  const features = [
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      color: '#ccff00',
      title: 'Employee Lifecycle',
      desc: 'From onboarding to exit — manage the complete employee journey with automated workflows and real-time status tracking.',
    },
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      color: '#00d2ff',
      title: 'Smart Attendance',
      desc: 'Biometric integration, shift management, and automatic overtime calculation. Track attendance across multiple locations.',
    },
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      color: '#a855f7',
      title: 'Payroll Engine',
      desc: 'Automated salary processing with PF, ESI, TDS compliance. Generate payslips and manage reimbursements effortlessly.',
    },
    {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      color: '#10b981',
      title: 'Performance & Goals',
      desc: 'Set OKRs, run 360° reviews, and track appraisal cycles. Data-driven insights to grow your team\'s potential.',
    },
  ];

  let currentFeature = 0;
  const showcase = container.querySelector('#feature-showcase');
  const dots = container.querySelectorAll('.feature-dot');

  function renderFeature(index) {
    const f = features[index];
    showcase.style.opacity = '0';
    setTimeout(() => {
      showcase.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: ${f.color}10; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${f.color}20;">
            ${f.icon}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: #fff; margin-bottom: 0.35rem;">${f.title}</div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); line-height: 1.6;">${f.desc}</div>
          </div>
        </div>
      `;
      showcase.style.opacity = '1';
    }, 300);

    dots.forEach((dot, i) => {
      dot.style.width = i === index ? '24px' : '12px';
      dot.style.background = i === index ? f.color : 'rgba(255,255,255,0.15)';
    });
  }

  renderFeature(0);

  // Auto-rotate every 4 seconds
  let featureInterval = setInterval(() => {
    currentFeature = (currentFeature + 1) % features.length;
    renderFeature(currentFeature);
  }, 4000);

  // Click dots to jump
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(featureInterval);
      currentFeature = parseInt(dot.dataset.index);
      renderFeature(currentFeature);
      featureInterval = setInterval(() => {
        currentFeature = (currentFeature + 1) % features.length;
        renderFeature(currentFeature);
      }, 4000);
    });
  });

  // ==========================================
  // Particle Animation
  // ==========================================
  const canvas = container.querySelector('#particle-canvas');
  const ctx = canvas.getContext('2d');
  let animId;

  function resizeCanvas() {
    const panel = canvas.parentElement;
    canvas.width = panel.offsetWidth;
    canvas.height = panel.offsetHeight;
  }
  resizeCanvas();

  const particles = [];
  const particleCount = 40;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.05,
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(204, 255, 0, ${p.opacity})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(204, 255, 0, ${0.03 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // Resize handler
  window.addEventListener('resize', resizeCanvas);

  // ==========================================
  // Form & Interaction Logic
  // ==========================================
  const form = container.querySelector('#login-form');
  const errorMessage = container.querySelector('#error-message');

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('#login-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';
    submitBtn.style.opacity = '0.7';

    const identifier = container.querySelector('#identifier').value.trim();
    const password = container.querySelector('#password').value;
    const companyCode = container.querySelector('#companyCode').value.trim();

    try {
      const result = await authService.login(identifier, password, companyCode);
      if (result.success) {
        // Remember me
        if (container.querySelector('#remember-me').checked) {
          localStorage.setItem('hrms_remember', JSON.stringify({ identifier, companyCode }));
        } else {
          localStorage.removeItem('hrms_remember');
        }
        errorMessage.style.display = 'none';
        cancelAnimationFrame(animId);
        clearInterval(featureInterval);
        onLogin(result.user);
      } else {
        errorMessage.textContent = result.error;
        errorMessage.style.display = 'block';
      }
    } catch (err) {
      errorMessage.textContent = 'Connection error. Please try again.';
      errorMessage.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
      submitBtn.style.opacity = '1';
    }
  });

  // Restore remembered credentials
  const remembered = localStorage.getItem('hrms_remember');
  if (remembered) {
    try {
      const { identifier, companyCode } = JSON.parse(remembered);
      container.querySelector('#identifier').value = identifier || '';
      container.querySelector('#companyCode').value = companyCode || '';
      container.querySelector('#remember-me').checked = true;
    } catch (_) { /* ignore */ }
  }

  // Demo login buttons
  container.querySelectorAll('.demo-login-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const pass = btn.dataset.pass;
      const code = btn.dataset.code;

      container.querySelector('#identifier').value = id;
      container.querySelector('#password').value = pass;
      container.querySelector('#companyCode').value = code;

      const submitBtn = form.querySelector('#login-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing In...';
      submitBtn.style.opacity = '0.7';

      try {
        const result = await authService.login(id, pass, code);
        if (result.success) {
          cancelAnimationFrame(animId);
          clearInterval(featureInterval);
          onLogin(result.user);
        } else {
          errorMessage.textContent = result.error;
          errorMessage.style.display = 'block';
        }
      } catch (err) {
        errorMessage.textContent = 'Connection error. Please try again.';
        errorMessage.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        submitBtn.style.opacity = '1';
      }
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.05)';
      btn.style.borderColor = 'rgba(255,255,255,0.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.02)';
      btn.style.borderColor = 'rgba(255,255,255,0.05)';
    });
  });

  // Forgot password
  container.querySelector('#forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your registered email:');
    const companyCode = prompt('Enter your company code:');
    if (email && companyCode) {
      try {
        const result = await authService.resetPassword(email, companyCode);
        alert(result.success ? result.message : result.error);
      } catch (err) { alert('Connection error.'); }
    }
  });

  // Password toggle
  const toggleBtn = container.querySelector('#toggle-password');
  const passwordInput = container.querySelector('#password');
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  });

  // Input focus effects
  container.querySelectorAll('input[type="text"], input[type="password"]').forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = 'rgba(204, 255, 0, 0.35)';
      input.style.boxShadow = '0 0 0 3px rgba(204, 255, 0, 0.04)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(255,255,255,0.08)';
      input.style.boxShadow = 'none';
    });
  });

  // Checkbox style
  const checkbox = container.querySelector('#remember-me');
  checkbox.addEventListener('change', () => {
    checkbox.style.background = checkbox.checked ? '#ccff00' : 'rgba(255,255,255,0.03)';
    checkbox.style.borderColor = checkbox.checked ? '#ccff00' : 'rgba(255,255,255,0.15)';
  });

  // Submit button hover
  const mainBtn = container.querySelector('#login-submit-btn');
  mainBtn.addEventListener('mouseenter', () => {
    mainBtn.style.boxShadow = '0 6px 30px rgba(204, 255, 0, 0.3)';
    mainBtn.style.transform = 'translateY(-1px)';
  });
  mainBtn.addEventListener('mouseleave', () => {
    mainBtn.style.boxShadow = '0 4px 20px rgba(204, 255, 0, 0.15)';
    mainBtn.style.transform = 'translateY(0)';
  });

  return container;
}
