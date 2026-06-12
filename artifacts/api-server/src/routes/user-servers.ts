import { Router } from "express";
import { db, localUsersTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getPteroConfig,
  listServers,
  createPteroServer,
} from "../lib/pterodactyl";
const router = Router();

function parseCreateInput(body: unknown): { name: string; nestId: number; eggId: number } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : null;
  const nestId = typeof b.nestId === "number" ? b.nestId : null;
  const eggId = typeof b.eggId === "number" ? b.eggId : null;
  if (!name || !nestId || !eggId || name.length < 1 || name.length > 100) return null;
  return { name, nestId, eggId };
}

router.get("/user/servers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const config = await getPteroConfig();
  if (!config) {
    res.status(503).json({ error: "Pterodactyl not configured" });
    return;
  }

  const userId = parseInt(req.user!.id);
  const [localUser] = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.id, userId));

  const pterodactylUserId = localUser?.pterodactylUserId;
  if (!pterodactylUserId) {
    res.json({ data: [], meta: { total: 0, count: 0, perPage: 50, currentPage: 1, totalPages: 1 } });
    return;
  }

  try {
    const result = await listServers(1, undefined, pterodactylUserId);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list user servers");
    res.status(500).json({ error: "Failed to list servers" });
  }
});

router.post("/user/servers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const config = await getPteroConfig();
  if (!config) {
    res.status(503).json({ error: "Pterodactyl not configured" });
    return;
  }

  const parsed = parseCreateInput(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Invalid input: name, nestId, and eggId are required" });
    return;
  }

  const { name, nestId, eggId } = parsed;

  const userId = parseInt(req.user!.id);
  const [localUser] = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.id, userId));

  if (!localUser?.pterodactylUserId) {
    res.status(400).json({ error: "Your account is not linked to Pterodactyl. Contact an admin." });
    return;
  }

  try {
    const server = await createPteroServer({
      name,
      nestId,
      eggId,
      pterodactylUserId: localUser.pterodactylUserId,
    });

    await db.insert(activityTable).values({
      action: "server_created",
      description: `User ${req.user!.username} created server "${name}"`,
      serverId: server.identifier,
      serverName: server.name,
      userId: req.user!.id,
      userName: req.user!.username,
    }).catch(() => {});

    res.status(201).json(server);
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to create server");
    const msg = err instanceof Error ? err.message : "Failed to create server";
    res.status(500).json({ error: msg });
  }
});

export default router;
