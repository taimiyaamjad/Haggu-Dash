name/haggu-dHaggu Dash

> A dark, data-forward self-hosted management dashboard for [Pterodactyl Panel](https://pterodactyl.io). Control your game servers, nodes, and users from one beautiful command-center interface.

![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20PostgreSQL-00ff88?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-00ff88?style=flat-square)
![Node](https://img.shields.io/badge/node-20%2B-00ff88?style=flat-square)

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Live overview — server counts, node health, and activity feed |
| **Server Management** | List, search, and filter servers; start / stop / restart / kill via power controls |
| **Server Detail** | Real-time CPU & memory charts, live console with command input |
| **Node Overview** | Per-node capacity bars and maintenance-mode indicators |
| **User Management** | Create, edit, and delete Pterodactyl users; mirrors changes to the panel instantly |
| **Server Wizard** | Post-registration guided flow — pick a nest, egg, name, and deploy in seconds |
| **Role-Based Access** | Admins see everything; regular users see only their own servers |
| **Email / Password Auth** | Secure bcrypt-hashed credentials; no OAuth dependencies |
| **Bootstrap Admin** | `admin` / `admin123` lets you log in before any accounts exist; auto-disabled once the first real account is created |
| **Settings Page** | Set Pterodactyl panel URL + API key from the UI; includes live connection test |
| **Activity Log** | Persistent audit trail stored in PostgreSQL |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion, wouter |
| **Backend** | Node.js 24, Express 5, Pino logging |
| **Database** | PostgreSQL 14+ with Drizzle ORM |
| **Auth** | bcryptjs, express-session, PostgreSQL session store |
| **API Contract** | OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas) |
| **Package Manager** | pnpm workspaces (monorepo) |

---

## File Structure

```
haggu-dash/
├── artifacts/
│   ├── api-server/                    # Express 5 API service
│   │   └── src/
│   │       ├── index.ts               # Entry — Express app, session middleware, routes
│   │       ├── lib/
│   │       │   ├── pterodactyl.ts     # Pterodactyl API client (application + client APIs)
│   │       │   └── session.ts         # Session helpers (create / read / clear)
│   │       └── routes/
│   │           ├── index.ts           # Route registration
│   │           ├── auth.ts            # POST /auth/login|register|logout · GET /auth/me
│   │           ├── servers.ts         # GET /servers · GET /servers/:id · POST power/command
│   │           ├── nodes.ts           # GET /nodes
│   │           ├── users.ts           # GET|POST /users · PUT|DELETE /users/:id
│   │           ├── settings.ts        # GET|PUT /settings · POST /settings/test
│   │           ├── eggs.ts            # GET /eggs — nests + eggs for server wizard
│   │           ├── user-servers.ts    # GET|POST /user/servers — user-scoped creation
│   │           ├── dashboard.ts       # GET /dashboard — aggregated stats
│   │           └── activity.ts        # GET|POST /activity
│   └── zendash/                       # React + Vite frontend (displayed as "Haggu Dash")
│       └── src/
│           ├── App.tsx                # Router, auth guard, AdminRoute
│           ├── main.tsx               # React entry, QueryClient setup
│           ├── hooks/
│           │   ├── use-auth.ts        # useAuth — login, register, logout, current user
│           │   └── use-toast.ts       # shadcn toast hook
│           ├── components/
│           │   ├── layout.tsx         # AppLayout — sidebar, role-aware nav, user badge
│           │   ├── ServerWizard.tsx   # Multi-step server creation modal
│           │   └── ui/                # shadcn/ui primitives (button, card, dialog …)
│           └── pages/
│               ├── login.tsx          # Login + registration tabs
│               ├── dashboard.tsx      # Stats cards + activity feed
│               ├── servers.tsx        # Server list with search + power controls
│               ├── server-detail.tsx  # CPU/memory charts, console, power buttons
│               ├── nodes.tsx          # Node list (admin only)
│               ├── users.tsx          # User management table (admin only)
│               ├── settings.tsx       # Panel URL + API key form
│               └── not-found.tsx      # 404 page
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml               # Single source of truth for all API contracts
│   ├── api-client-react/              # Generated React Query hooks (Orval output)
│   ├── api-zod/                       # Generated Zod schemas (Orval output)
│   └── db/
│       └── src/schema/
│           ├── auth.ts                # sessions table
│           ├── local-users.ts         # local_users (email, passwordHash, role, pterodactylUserId)
│           ├── activity.ts            # activity table
│           └── settings.ts            # app_settings (panelUrl, apiKey)
├── scripts/                           # Shared utility scripts
├── pnpm-workspace.yaml                # Workspace catalog + overrides
├── package.json                       # Root dev tooling (TypeScript, ESLint)
└── README.md                          # This file
```

---

## Self-Hosting on a VPS

### Prerequisites

- Linux VPS — Ubuntu 22.04 LTS recommended
- **Node.js 20+** — install via [nvm](https://github.com/nvm-sh/nvm)
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL 14+**
- A running **Pterodactyl Panel** with an Application API key ready

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/taimiyaamjad/haggu-dash.git /opt/haggu-dash
cd /opt/haggu-dash
```

---

### Step 2 — Install dependencies

```bash
pnpm install
```

---

### Step 3 — Create a PostgreSQL database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE haggudash;
CREATE USER haggudash_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE haggudash TO haggudash_user;
\q
```

---

### Step 4 — Configure environment variables

```bash
cp .env.example .env   # or create from scratch
nano .env
```

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://haggudash_user:your_strong_password@localhost:5432/haggudash

# Session signing secret — generate with: openssl rand -hex 32
SESSION_SECRET=replace_this_with_a_64_char_random_string

# Set to production
NODE_ENV=production
PORT=5000
```

---

### Step 5 — Run database migrations

```bash
pnpm --filter @workspace/db run push
```

This creates all four tables: `sessions`, `local_users`, `activity`, `app_settings`.

---

### Step 6 — Build the project

```bash
pnpm run build
```

- API server compiles to `artifacts/api-server/dist/index.js`
- Frontend compiles to `artifacts/zendash/dist/public/`

---

### Step 7 — Start the API server

**Option A — PM2 (recommended)**

```bash
npm install -g pm2

pm2 start artifacts/api-server/dist/index.js \
  --name haggu-api \
  --env production

pm2 save
pm2 startup   # follow the printed command to enable on boot
```

**Option B — systemd**

Create `/etc/systemd/system/haggu-api.service`:

```ini
[Unit]
Description=Haggu Dash API Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/haggu-dash
ExecStart=/usr/bin/node artifacts/api-server/dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=/opt/haggu-dash/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable haggu-api
sudo systemctl start haggu-api
sudo systemctl status haggu-api
```

---

### Step 8 — Configure Nginx

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/haggu-dash
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve frontend static files
    root /opt/haggu-dash/artifacts/zendash/dist/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy all /api requests to Express
    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade        $http_upgrade;
        proxy_set_header   Connection     'upgrade';
        proxy_set_header   Host           $host;
        proxy_set_header   X-Real-IP      $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/haggu-dash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 9 — Enable HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

Certbot automatically configures SSL and sets up auto-renewal via a cron job.

---

### Step 10 — First login and initial setup

1. Visit `https://yourdomain.com` in your browser
2. Log in with the bootstrap credentials: **`admin` / `admin123`**
3. Navigate to **Settings** → enter your Pterodactyl panel URL and Application API key → **Save Settings**
4. Click **Test Connection** to confirm the link is working
5. Switch to the **Create Account** tab → register your permanent admin account
   - The **first account registered is automatically promoted to admin**
   - The `admin`/`admin123` bootstrap is disabled from that point on
6. Log out, log back in with your new credentials — you're done

---

## Authentication Flow

```
First boot  ──→  admin / admin123  ──→  Bootstrap session (admin role)
                                              │
                                     Settings: set panel URL + API key
                                              │
                                     Create Account: register real admin
                                              │
                              ┌───────────────┴──────────────────┐
                              │  First user → auto-promoted ADMIN │
                              └───────────────┬──────────────────┘
                                              │
                        Bootstrap disabled. DB-only auth from here.
                        Subsequent registrations → USER role.
```

### Role Permission Matrix

| Page / Action | Admin | User |
|---|:---:|:---:|
| Dashboard | ✅ | ✅ |
| All Servers | ✅ | ❌ |
| Own Servers | ✅ | ✅ |
| Server Detail (own) | ✅ | ✅ |
| Server Power Controls | ✅ | ✅ (own) |
| Server Console | ✅ | ✅ (own) |
| Nodes page | ✅ | ❌ |
| Users page | ✅ | ❌ |
| Settings | ✅ | ✅ |
| Create Server Wizard | ✅ | ✅ |

---

## Pterodactyl API Key Setup

Haggu Dash uses the **Application API** (not the client API) for server and user management.

1. Log into your Pterodactyl admin panel
2. Go to **Application API** → **Create New**
3. Grant **Read + Write** permissions on: Servers, Nodes, Users, Nests, Eggs
4. Copy the generated key — it begins with `ptla_`
5. Paste it into **Haggu Dash → Settings → Application API Key** → Save

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | — | Random secret for signing cookies (min 32 chars) |
| `NODE_ENV` | — | `development` | Set to `production` for production |
| `PORT` | — | `8080` dev / `5000` prod | API server listen port |

---

## Updating to a New Version

```bash
cd /opt/haggu-dash
git pull origin main
pnpm install
pnpm --filter @workspace/db run push   # only needed if schema changed
pnpm run build
pm2 restart haggu-api                  # or: systemctl restart haggu-api
```

---

## Development Setup

```bash
# Clone and install
git clone https://github.com/yourusername/haggu-dash.git
cd haggu-dash
pnpm install

# Set up local .env (DATABASE_URL + SESSION_SECRET required)
cp .env.example .env

# Push schema to local Postgres
pnpm --filter @workspace/db run push

# Start API server with hot reload
pnpm --filter @workspace/api-server run dev

# Start frontend with Vite HMR (separate terminal)
pnpm --filter @workspace/zendash run dev

# Full TypeScript check
pnpm run typecheck

# Regenerate API hooks after editing openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `admin / admin123` not working | Your panel is configured and a real account already exists — use your registered email/password |
| Can't register | Pterodactyl panel is not configured yet — log in with bootstrap, go to Settings first |
| "Pterodactyl error" on register | The panel API key lacks permissions or the URL is wrong — check Settings → Test Connection |
| Blank page / API 502 | API server isn't running — check `pm2 status` or `systemctl status haggu-api` |
| Session lost on restart | `SESSION_SECRET` changed — set a stable secret in `.env` |
| DB push fails on column conflict | Run `pnpm --filter @workspace/db run push-force` |

---

## License

MIT — free to use, modify, and self-host.

---

*Built for server operators who deserve better tooling.*
