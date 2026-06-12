# ZenDash

**ZenDash** is a sleek, self-hosted server management dashboard for [Pterodactyl Panel](https://pterodactyl.io). It provides a beautiful dark UI for managing game servers, nodes, and users — all from one command center.

---

## Features

- **Dashboard** — live overview of server counts, node status, and recent activity
- **Server Management** — list, filter, start, stop, restart, and kill servers; view real-time resource usage (CPU, memory, disk)
- **Console Commands** — send console commands directly from the web UI
- **Node Overview** — view all Pterodactyl nodes and their specifications
- **User Management** — create, edit, and delete Pterodactyl users with admin privileges
- **Settings** — configure your Pterodactyl panel URL and API key with a live connection test
- **OAuth Authentication** — secure login via Replit Auth (OpenID Connect / PKCE)
- **Activity Log** — audit trail of all power actions, commands, and user changes

---

## Requirements

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+
- A Pterodactyl Panel installation with an Application API key

---

## Self-Hosting on a VPS

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/zendash.git
cd zendash
```

### 2. Install dependencies

```bash
npm install -g pnpm
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/zendash

# Session secret — use a long random string
SESSION_SECRET=replace-with-a-long-random-secret-string

# Node environment
NODE_ENV=production

# Ports (assigned automatically by Replit; set manually for VPS)
PORT=5000
BASE_PATH=/
```

Generate a secure `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set up PostgreSQL

```bash
# Create the database
createdb zendash

# Push the Drizzle schema
pnpm --filter @workspace/db run push
```

### 5. Build the frontend

```bash
pnpm --filter @workspace/zendash run build
```

### 6. Build the API server

```bash
pnpm --filter @workspace/api-server run build
```

### 7. Start the API server

```bash
NODE_ENV=production PORT=5000 node --enable-source-maps artifacts/api-server/dist/index.mjs
```

### 8. Serve the frontend

You can serve the built frontend (`artifacts/zendash/dist/public/`) with any static file server. The simplest approach is to use Nginx as a reverse proxy.

---

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Serve the React frontend
    root /path/to/zendash/artifacts/zendash/dist/public;
    index index.html;

    # SPA fallback — all non-API routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Express server
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Get a free TLS certificate with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## PM2 Process Manager (recommended)

Use PM2 to keep ZenDash running in the background and auto-restart on crashes:

```bash
npm install -g pm2

# Start the API server
pm2 start "node --enable-source-maps artifacts/api-server/dist/index.mjs" \
  --name zendash-api \
  --env production

# Save the PM2 process list and configure startup
pm2 save
pm2 startup
```

To view logs:
```bash
pm2 logs zendash-api
```

---

## Connecting to Pterodactyl

1. Log into your Pterodactyl admin panel
2. Go to **Admin → Application API**
3. Create a new key with the following permissions:
   - **Users** — Read, Write
   - **Nodes** — Read
   - **Allocations** — Read
   - **Servers** — Read, Write
4. Copy the generated API key
5. Open ZenDash → **Settings**
6. Enter your panel URL (e.g. `https://panel.yourdomain.com`) and paste the API key
7. Click **Test Connection** to verify

---

## OAuth Authentication

ZenDash uses Replit Auth (OpenID Connect with PKCE) for authentication. This provides secure, zero-configuration OAuth without custom login forms.

For VPS deployments using the Replit-hosted version of ZenDash, authentication is handled automatically. If you fork and deploy independently, update the OIDC configuration in `artifacts/api-server/src/lib/auth.ts` to point to your chosen OIDC provider.

---

## Development

```bash
# Start the API server in development mode
pnpm --filter @workspace/api-server run dev

# Start the frontend dev server
pnpm --filter @workspace/zendash run dev

# Regenerate API types after spec changes
pnpm --filter @workspace/api-spec run codegen

# Typecheck all packages
pnpm run typecheck

# Push DB schema changes
pnpm --filter @workspace/db run push
```

---

## Architecture

```
artifacts/
├── api-server/          # Express 5 backend
│   └── src/
│       ├── lib/
│       │   ├── auth.ts         # OIDC session management
│       │   ├── logger.ts       # Pino structured logging
│       │   └── pterodactyl.ts  # Pterodactyl API client
│       ├── middlewares/
│       │   └── authMiddleware.ts
│       └── routes/
│           ├── auth.ts         # Login/callback/logout
│           ├── settings.ts     # Panel URL + API key
│           ├── dashboard.ts    # Summary stats + activity
│           ├── servers.ts      # Server management
│           ├── nodes.ts        # Node info
│           ├── users.ts        # User management
│           └── activity.ts     # Activity log
└── zendash/             # React + Vite frontend
    └── src/pages/
        ├── Dashboard.tsx
        ├── Servers.tsx
        ├── ServerDetail.tsx
        ├── Nodes.tsx
        ├── Users.tsx
        └── Settings.tsx

lib/
├── api-spec/openapi.yaml       # Source of truth for all API contracts
├── api-client-react/           # Generated React Query hooks
├── api-zod/                    # Generated Zod validation schemas
├── db/                         # Drizzle ORM schema + client
└── replit-auth-web/            # useAuth() hook for the browser

Database tables:
├── users                       # Auth user sessions
├── sessions                    # OIDC session storage
├── activity                    # Audit log
└── app_settings                # Panel URL + API key (encrypted at rest via PG)
```

---

## Security Notes

- **API keys** are stored in the database, not in environment variables at runtime. Ensure your PostgreSQL instance is secured.
- **Sessions** are stored server-side in PostgreSQL, not in JWTs — revocation is immediate.
- **Auth cookies** are `httpOnly`, `secure`, and `sameSite: lax` — not accessible to client-side JavaScript.
- For production, always run behind HTTPS (use Nginx + Let's Encrypt as shown above).
- Restrict your Pterodactyl API key to the minimum required permissions.

---

## License

MIT
