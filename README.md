# 🚀 Subix Ecosystem

> Monorepo for all Subix products — powered by **pnpm workspaces** + **Turborepo**

## 📁 Architecture

```
subix/
│
├── apps/
│   ├── web/          ← subix.in (marketing site)
│   ├── accounts/     ← accounts.subix.in (login/signup/reset)
│   ├── leados/       ← leados.subix.in (lead management)
│   └── hrms/         ← hrms.subix.in (HR management)
│
├── packages/
│   ├── auth/         ← shared Supabase auth logic
│   ├── db/           ← shared DB types & queries
│   ├── ui/           ← shared components (buttons, nav, toasts, modals)
│   └── config/       ← shared env configs
│
├── package.json      ← root (pnpm workspaces)
├── pnpm-workspace.yaml
└── turbo.json
```

## 🛠️ Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9 (`npm install -g pnpm`)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/subix.git
cd subix

# Install all dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Development

```bash
# Run ALL apps in parallel
pnpm dev

# Run a specific app
pnpm dev:web       # subix.in        → http://localhost:3000
pnpm dev:accounts  # accounts        → http://localhost:3001
pnpm dev:leados    # LeadOS          → http://localhost:3002
pnpm dev:hrms      # HRMS            → http://localhost:3003
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build:hrms
```

## 📦 Shared Packages

| Package | Description | Usage |
|---------|-------------|-------|
| `@subix/config` | Supabase URL, keys, app URLs | `import { supabaseUrl } from '@subix/config'` |
| `@subix/auth` | Sign in, sign up, sign out, OAuth | `import { signIn, requireAuth } from '@subix/auth'` |
| `@subix/db` | CRUD helpers for Supabase tables | `import { getRecords, insertRecord } from '@subix/db'` |
| `@subix/ui` | Buttons, modals, toasts, navbar | `import { showToast, SubixModal } from '@subix/ui'` |

### For Vanilla JS Apps (non-module)

```html
<!-- Load shared config -->
<script src="../../packages/config/browser.js"></script>

<!-- Load Supabase SDK + shared auth -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../packages/auth/browser.js"></script>

<!-- Load shared UI tokens -->
<link rel="stylesheet" href="../../packages/ui/styles/tokens.css">
```

## 🌐 Deployment

Each app in `apps/` can be deployed independently:

| App | Domain | Platform |
|-----|--------|----------|
| `apps/web` | subix.in | Vercel / Hostinger |
| `apps/accounts` | accounts.subix.in | Vercel |
| `apps/leados` | leados.subix.in | Vercel |
| `apps/hrms` | hrms.subix.in | Vercel |

## 📄 License

Private — Subix Technologies
