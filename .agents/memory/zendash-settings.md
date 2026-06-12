---
name: ZenDash settings storage
description: Why Pterodactyl credentials are stored in DB, not env vars.
---

Settings (panelUrl, apiKey) live in the `app_settings` PostgreSQL table, not in env vars or config files.

**Why:** The user needs to configure their Pterodactyl connection via the UI settings page at runtime, without needing server access to change env vars or restart. DB storage allows live updates.

**How to apply:** When adding new configurable settings, add them to `app_settings` table. Read via getSetting(key) in the settings route. Never expose the raw apiKey to the browser — only return hasApiKey: boolean.
