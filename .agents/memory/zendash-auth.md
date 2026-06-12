---
name: ZenDash auth system
description: Email/password auth with bootstrap mode and Pterodactyl mirroring on registration.
---

ZenDash uses a custom email/password auth system — Replit Auth (OIDC) was removed entirely.

**Bootstrap mode:** When Pterodactyl is not yet configured (no panelUrl/apiKey in app_settings), hardcoded credentials `admin / admin123` bypass the DB and create a session. This lets the admin set up the panel before any real accounts exist.

**Normal mode:** After Pterodactyl is configured, email/password is verified against the `local_users` table (bcryptjs hash). Registration also calls the Pterodactyl API to create the user there (`POST /api/application/users`), linking via `pterodactyl_user_id`.

**Why:** The user wanted self-hosted accounts not tied to Replit OAuth. Pterodactyl mirroring ensures new ZenDash accounts also exist on the game panel.

**How to apply:**
- Session helpers live in `artifacts/api-server/src/lib/auth.ts` (createSession, getSession, clearSession, setSessionCookie).
- Auth routes: POST /auth/login, POST /auth/register, POST /auth/logout, GET /auth/user.
- Frontend hook: `artifacts/zendash/src/hooks/use-auth.ts` — wraps `useGetCurrentAuthUser()` and exposes `login()`, `register()`, `logout()`.
- `@workspace/replit-auth-web` has been removed from zendash package.json and both tsconfig references.
