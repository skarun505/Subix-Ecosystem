# 🔐 Subix — Login Page Design Specification

> A complete reference document for designing and building the Subix Login page, aligned with the existing brand identity.

---

## 1. 🎨 Colour Palette

The login page uses **Subix's core dark + neon acid palette** for a consistent, premium feel.

### Background & Surface

| Role                  | Hex         | Usage                                      |
| :-------------------- | :---------- | :----------------------------------------- |
| **Page Background**   | `#050505`   | Full-page background (ultra dark)          |
| **Card / Panel**      | `#111111`   | Login card background                      |
| **Surface Highlight** | `#1a1a1a`   | Input fields, focused states               |
| **Border**            | `#333333`   | Card borders, input borders                |
| **Hover Border**      | `#555555`   | Focused input border, interactive elements |

### Text

| Role             | Hex       | Usage                                    |
| :--------------- | :-------- | :--------------------------------------- |
| **Text Main**    | `#ffffff`  | Labels, headings, button text            |
| **Text Muted**   | `#888888`  | Placeholder text, helper text, subtext   |
| **Error Text**   | `#ff4d4d`  | Validation error messages                |
| **Success Text** | `#ccff00`  | Success confirmation messages            |

### Accent & Action Colours (Neon)

| Role                   | Hex        | Usage                                          |
| :--------------------- | :--------- | :--------------------------------------------- |
| **Primary Lime**       | `#ccff00`  | Primary CTA button, active states, logo        |
| **Primary Lime Hover** | `#b3e600`  | CTA button hover background                    |
| **Accent Purple**      | `#9d4edd`  | Decorative glows, gradient blobs, dividers     |
| **Accent Cyan**        | `#00f3ff`  | Decorative glows, tech detail icons            |
| **Accent Pink**        | `#ff007f`  | Gradient orbs / ambient background lighting    |

### Gradients

| Name                    | Value                                                   | Usage                              |
| :---------------------- | :------------------------------------------------------ | :--------------------------------- |
| **Glow Blob — Left**    | Radial from `#9d4edd` → transparent                     | Ambient background decoration      |
| **Glow Blob — Right**   | Radial from `#00f3ff` → transparent                     | Ambient background decoration      |
| **Button Gradient**     | `linear-gradient(135deg, #ccff00, #b3e600)`             | Primary login button (optional)    |
| **Divider Gradient**    | `linear-gradient(90deg, transparent, #333, transparent)` | OR divider line between SSO & form|

---

## 2. 🔤 Typography

### Fonts to Import (Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Element                | Font            | Weight | Size      | Letter Spacing | Usage                              |
| :--------------------- | :-------------- | :----- | :-------- | :------------- | :--------------------------------- |
| **Page Brand Logo**    | Space Grotesk   | 700    | `1.8rem`  | `-1px`         | "Subix" brand name in top-left     |
| **Card Heading**       | Space Grotesk   | 700    | `2rem`    | `-0.03em`      | "Welcome back"                     |
| **Card Subheading**    | Inter           | 400    | `1rem`    | `0`            | "Sign in to your Subix account"    |
| **Form Labels**        | Inter           | 500    | `0.9rem`  | `0`            | "Email", "Password"                |
| **Input Text**         | Inter           | 400    | `1rem`    | `0`            | User-typed value inside inputs     |
| **Placeholder Text**   | Inter           | 300    | `1rem`    | `0`            | "you@example.com"                  |
| **Helper / Error Text**| Inter           | 400    | `0.8rem`  | `0`            | "Password must be 8+ characters"   |
| **Button Text**        | Space Grotesk   | 600    | `1rem`    | `0`            | "Sign In"                          |
| **Link Text**          | Inter           | 500    | `0.9rem`  | `0`            | "Forgot password?", "Sign up"      |
| **Divider OR Text**    | Inter           | 400    | `0.8rem`  | `0.1em`        | "OR CONTINUE WITH"                 |

---

## 3. 📐 Layout & Structure

The login page follows a **Split-Screen** or **Centred Card** layout.

### Recommended Layout: Centred Card with Ambient Glow

```
┌──────────────────────────────────────────────────┐
│  [Background: #050505 + noise texture overlay]   │
│    [Purple Glow Blob — top-left]                  │
│    [Cyan Glow Blob — bottom-right]                │
│                                                  │
│            ┌──────────────────────┐              │
│            │  [Logo: SUBIX]       │              │
│            │  Welcome back        │              │
│            │  Sign in to your     │              │
│            │  Subix account       │              │
│            │                      │              │
│            │  [Email Input]       │              │
│            │  [Password Input]    │              │
│            │  [Forgot Password?]  │              │
│            │  [Sign In Button]    │              │
│            │  ─── OR ───          │              │
│            │  [Google SSO Btn]    │              │
│            │                      │              │
│            │  Don't have an       │              │
│            │  account? [Sign Up]  │              │
│            └──────────────────────┘              │
└──────────────────────────────────────────────────┘
```

### Card Dimensions (Desktop)
- **Width:** `420px` (fixed) — centered horizontally + vertically
- **Padding:** `3rem`
- **Border:** `1px solid #333333`
- **Border Radius:** `24px`
- **Background:** `rgba(17, 17, 17, 0.85)` with `backdrop-filter: blur(20px)`
- **Box Shadow:** `0 0 60px rgba(157, 78, 221, 0.08), 0 0 80px rgba(0, 243, 255, 0.05)`

---

## 4. 🧩 Required Components

### 4.1 Logo / Brand Mark
- Display the **Subix SVG logo** or text mark at the top of the card
- Align: **Left** (matches the navbar style on other pages)
- Height: `40px`

### 4.2 Page Heading
- Text: **"Welcome back"**
- Font: Space Grotesk, 700, `2rem`
- Color: `#ffffff`
- Margin bottom: `0.3rem`

### 4.3 Subheading
- Text: **"Sign in to continue to Subix"**
- Font: Inter, 400, `1rem`
- Color: `#888888`
- Margin bottom: `2rem`

### 4.4 Form Inputs

#### Email Input
- Label: `Email Address`
- Type: `email`
- Placeholder: `you@example.com`
- Autocomplete: `email`
- Required: `true`

#### Password Input
- Label: `Password`
- Type: `password`
- Placeholder: `Enter your password`
- Autocomplete: `current-password`
- Required: `true`
- Include a **show/hide password toggle icon** (eye icon — right-aligned inside the input)

#### Input Styling
```css
/* Input Fields */
background: #1a1a1a;
border: 1px solid #333333;
border-radius: 10px;
padding: 0.85rem 1rem;
color: #ffffff;
font-family: 'Inter', sans-serif;
font-size: 1rem;
width: 100%;
transition: border-color 0.3s;

/* Focus State */
outline: none;
border-color: #ccff00;
box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.08);
```

### 4.5 Forgot Password Link
- Text: `Forgot password?`
- Position: **right-aligned**, below the password input
- Color: `#888888` | Hover: `#ccff00`
- Font: Inter, 500, `0.85rem`

### 4.6 Primary CTA Button — Sign In
- Text: `Sign In`
- Background: `#ccff00`
- Text Color: `#000000`
- Font: Space Grotesk, 600, `1rem`
- Border Radius: `10px`
- Padding: `0.9rem 1.5rem`
- Width: `100%`
- Hover: background `#b3e600`, `transform: scale(1.02)`
- Transition: `all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)`
- State: Loading spinner inside button when submitting

### 4.7 OR Divider
- HTML: A horizontal rule with centered text `OR CONTINUE WITH`
- Style: Gradient fading lines on each side

```html
<div class="divider">
  <span>OR CONTINUE WITH</span>
</div>
```

### 4.8 Social Sign-In Button (Google)
- Icon: Google SVG Logo (coloured)
- Text: `Sign in with Google`
- Background: `#1a1a1a`
- Border: `1px solid #333333`
- Text Color: `#ffffff`
- Border Radius: `10px`
- Width: `100%`
- Hover: border-color `#555555`, background `#222222`

### 4.9 Sign Up Redirect Link
- Placement: Bottom of the card
- Text: `Don't have an account?` followed by **`Sign up`** (lime accent link)
- Color of link: `#ccff00` | Hover: `#b3e600` with underline

### 4.10 Error State Banner (Inline)
- Shown when login fails
- Background: `rgba(255, 77, 77, 0.1)`
- Border: `1px solid rgba(255, 77, 77, 0.3)`
- Border Radius: `8px`
- Text: `#ff4d4d`
- Icon: ⚠️ or an inline error icon on the left

---

## 5. ✨ Visual Effects & Animations

| Effect                     | Description                                                              |
| :------------------------- | :----------------------------------------------------------------------- |
| **Noise Texture**          | Subtle SVG noise overlay on body (same as existing site, `opacity: 0.05`) |
| **Ambient Glow Blobs**     | 2 soft radial blobs (purple + cyan) at opposite corners of the page      |
| **Card Entrance Animation**| Card fades in + slides up on page load (`opacity: 0 → 1`, `translateY(20px → 0)`) |
| **Input Focus Glow**       | `box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.08)` on focus                 |
| **Button Hover Scale**     | `transform: scale(1.02)` on primary button hover                         |
| **Error Shake Animation**  | `@keyframes shake` applied to form on failed login                       |
| **Cursor Glow (optional)** | A subtle radial gradient that follows the cursor (advanced)              |

---

## 6. 📱 Responsive Behaviour

| Breakpoint         | Behaviour                                                                 |
| :----------------- | :------------------------------------------------------------------------ |
| **Desktop ≥ 768px**| Centred card, `420px` wide, full viewport height centred                  |
| **Mobile < 768px** | Card becomes full-width with `1rem` horizontal margin, padding `2rem`     |
| **Inputs**         | Always `width: 100%` of the card                                          |
| **Blobs**          | Reduced opacity / size on mobile to avoid clutter                         |

---

## 7. 🔒 Security & UX Requirements

- [ ] `autocomplete="email"` and `autocomplete="current-password"` on inputs
- [ ] Show/Hide password toggle (accessibility compliant with `aria-label`)
- [ ] Rate limiting messaging — show locked message after 5 failed attempts
- [ ] "Remember me" checkbox (optional)
- [ ] HTTPS enforced (handled by `.htaccess` — already present in project)
- [ ] Form `action` POST or handled via JS fetch to your backend
- [ ] CSRF token if using server-side rendering
- [ ] Input sanitisation on the backend

---

## 8. ♿ Accessibility Checklist

- [ ] All form inputs have associated `<label for="">` elements
- [ ] Buttons have descriptive `aria-label` if icon-only
- [ ] Error messages are linked to inputs via `aria-describedby`
- [ ] Colour contrast ratio ≥ 4.5:1 for all text (lime `#ccff00` on black `#111` = ✅ passes)
- [ ] Keyboard navigable (Tab order: Email → Password → Sign In → SSO → Sign Up)
- [ ] Focus ring visible on all interactive elements

---

## 9. 📁 Suggested File

| File              | Purpose                          |
| :---------------- | :------------------------------- |
| `login.html`      | Login page markup                |
| `style.css`       | Add login-specific styles here   |
| `script.js`       | Add form validation & toggle logic |

---

## 10. 🧪 Quick Colour Reference Card

```
Background:   #050505  ████  (Ultra Dark)
Card:         #111111  ████  (Surface)
Input BG:     #1a1a1a  ████  (Surface Highlight)
Border:       #333333  ████
Text Main:    #ffffff  ████  (White)
Text Muted:   #888888  ████  (Grey)
Primary CTA:  #ccff00  ████  (Acid Lime)
CTA Hover:    #b3e600  ████
Accent 1:     #9d4edd  ████  (Purple)
Accent 2:     #00f3ff  ████  (Cyan)
Accent 3:     #ff007f  ████  (Pink)
Error:        #ff4d4d  ████  (Red)
```

---

*Document generated for Subix Login Page — Feb 2026*
