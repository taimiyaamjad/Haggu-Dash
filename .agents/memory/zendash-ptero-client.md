---
name: ZenDash Pterodactyl client split
description: Two request helpers for the two Pterodactyl API namespaces.
---

artifacts/api-server/src/lib/pterodactyl.ts has two fetch helpers:
- pteroRequest(path) — hits /api/application{path} (admin: list servers, users, nodes)
- pteroClientRequest(identifier, path) — hits /api/client/servers/{identifier}{path} (power, commands, resources)

**Why:** Pterodactyl separates admin operations (application API) from per-server runtime operations (client API). They use the same API key but different base paths and different response shapes.

**How to apply:** Use pteroRequest for CRUD on servers/users/nodes. Use pteroClientRequest for start/stop/restart/kill and console commands.
