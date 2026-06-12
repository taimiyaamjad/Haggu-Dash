# ZenDash

A sleek, self-hosted server management dashboard for Pterodactyl Panel. Manage game servers, nodes, and users from one dark, data-forward command center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080 dev / 5000 prod)
- `pnpm --filter @workspace/zendash run dev` — run the frontend (port 25882)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, shadcn/ui, Recharts, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (OpenID Connect / PKCE) via `@workspace/replit-auth-web`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — DB schema (auth.ts, activity.ts, settings.ts)
- `artifacts/api-server/src/lib/pterodactyl.ts` — Pterodactyl API client
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/zendash/src/pages/` — React pages (Dashboard, Servers, Nodes, Users, Settings)
- `README.md` — VPS self-hosting guide

## Architecture decisions

- Settings (Pterodactyl panel URL + API key) are stored in the `app_settings` DB table, not environment variables, so they can be updated via the UI at runtime without restart.
- Pterodactyl proxied through our backend — the API key is never exposed to the browser.
- Auth uses Replit Auth (OIDC PKCE) — no custom login forms, no local passwords.
- All Pterodactyl API responses are normalized/mapped in `lib/pterodactyl.ts` before being returned to clients — keeps the API contract stable even if Pterodactyl changes its shape.
- Activity log is stored in PostgreSQL for persistence and audit purposes.

## Product

ZenDash lets operators manage their Pterodactyl panel from a beautiful command-center UI:
- Dashboard with server counts, node status, and activity feed
- Server list with search, status badges, and power controls (start/stop/restart/kill)
- Server detail with real-time CPU/memory charts, command console
- Node overview with capacity and maintenance status
- User management with create/edit/delete
- Settings page for API key + connection test

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any `openapi.yaml` change, always run codegen before starting the frontend.
- The `@workspace/replit-auth-web` lib must be in both root `tsconfig.json` references AND the zendash `tsconfig.json` references.
- Pterodactyl client API (used for power/command) uses a different base path than application API — see `pterodactyl.ts` (`pteroClientRequest` vs `pteroRequest`).
- DB push can fail if columns conflict — use `pnpm --filter @workspace/db run push-force` in that case.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `README.md` for full VPS self-hosting instructions
