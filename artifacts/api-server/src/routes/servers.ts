import { Router } from "express";
import {
  listServers,
  getServer,
  sendPowerAction,
  sendCommand,
  getServerResources,
  getPteroConfig,
} from "../lib/pterodactyl";
import { db, localUsersTable, activityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListServersQueryParams,
  GetServerParams,
  SendServerPowerActionParams,
  SendServerPowerActionBody,
  SendServerCommandParams,
  SendServerCommandBody,
  GetServerResourcesParams,
} from "@workspace/api-zod";

const router = Router();

async function logActivity(
  action: string,
  description: string,
  extra?: { serverId?: string; serverName?: string; userId?: string; userName?: string }
) {
  await db.insert(activityTable).values({
    action,
    description,
    serverId: extra?.serverId ?? null,
    serverName: extra?.serverName ?? null,
    userId: extra?.userId ?? null,
    userName: extra?.userName ?? null,
  });
}

router.get("/servers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const config = await getPteroConfig();
  if (!config) {
    res.status(503).json({ error: "Pterodactyl not configured. Visit Settings to add your API key." });
    return;
  }

  const parsed = ListServersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const search = parsed.success ? parsed.data.search : undefined;

  const isAdmin = req.user?.role === "admin";

  if (!isAdmin) {
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
      const result = await listServers(page, search ?? undefined, pterodactylUserId);
      res.json(result);
    } catch (err) {
      req.log.error({ err }, "Failed to list user servers");
      res.status(500).json({ error: "Failed to list servers" });
    }
    return;
  }

  try {
    const result = await listServers(page, search ?? undefined);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list servers");
    res.status(500).json({ error: "Failed to list servers" });
  }
});

router.get("/servers/:serverId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const parsed = GetServerParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid server ID" });
    return;
  }
  try {
    const server = await getServer(parsed.data.serverId);
    const isAdmin = req.user?.role === "admin";
    if (!isAdmin) {
      const userId = parseInt(req.user!.id);
      const [localUser] = await db.select().from(localUsersTable).where(eq(localUsersTable.id, userId));
      if (server.userId !== localUser?.pterodactylUserId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }
    res.json(server);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    req.log.error({ err }, "Failed to get server");
    res.status(500).json({ error: "Failed to get server" });
  }
});

router.post("/servers/:serverId/power", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const paramsParsed = SendServerPowerActionParams.safeParse(req.params);
  const bodyParsed = SendServerPowerActionBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { serverId } = paramsParsed.data;
  const { signal } = bodyParsed.data;
  try {
    await sendPowerAction(serverId, signal);
    await logActivity(
      "power",
      `Power action "${signal}" sent to server ${serverId}`,
      { serverId, userId: req.user?.id, userName: req.user?.username }
    ).catch(() => {});
    res.status(204).end();
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    req.log.error({ err }, "Failed to send power action");
    res.status(500).json({ error: "Failed to send power action" });
  }
});

router.post("/servers/:serverId/command", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const paramsParsed = SendServerCommandParams.safeParse(req.params);
  const bodyParsed = SendServerCommandBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { serverId } = paramsParsed.data;
  const { command } = bodyParsed.data;
  try {
    await sendCommand(serverId, command);
    await logActivity(
      "command",
      `Command sent to server ${serverId}: ${command.slice(0, 80)}`,
      { serverId, userId: req.user?.id, userName: req.user?.username }
    ).catch(() => {});
    res.status(204).end();
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    req.log.error({ err }, "Failed to send command");
    res.status(500).json({ error: "Failed to send command" });
  }
});

router.get("/servers/:serverId/resources", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const parsed = GetServerResourcesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid server ID" });
    return;
  }
  try {
    const resources = await getServerResources(parsed.data.serverId);
    res.json(resources);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "Server not found" });
      return;
    }
    req.log.error({ err }, "Failed to get server resources");
    res.status(500).json({ error: "Failed to get server resources" });
  }
});

export default router;
