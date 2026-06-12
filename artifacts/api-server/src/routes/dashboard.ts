import { Router } from "express";
import { db } from "@workspace/db";
import { activityTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { getPteroConfig, listServers, listNodes, listUsers } from "../lib/pterodactyl";

const router = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  try {
    const config = await getPteroConfig();
    if (!config) {
      res.json({
        totalServers: 0,
        runningServers: 0,
        stoppedServers: 0,
        offlineServers: 0,
        totalNodes: 0,
        totalUsers: 0,
        totalAllocations: 0,
        configured: false,
      });
      return;
    }

    const [servers, nodes, users] = await Promise.allSettled([
      listServers(1),
      listNodes(),
      listUsers(1),
    ]);

    const serverData = servers.status === "fulfilled" ? servers.value : { data: [], meta: { total: 0 } };
    const nodeData = nodes.status === "fulfilled" ? nodes.value : [];
    const userData = users.status === "fulfilled" ? users.value : { meta: { total: 0 } };

    let runningServers = 0;
    let stoppedServers = 0;
    let offlineServers = 0;

    for (const s of serverData.data) {
      const status = (s.status ?? "").toLowerCase();
      if (status === "running") runningServers++;
      else if (status === "stopping" || status === "stopped") stoppedServers++;
      else offlineServers++;
    }

    res.json({
      totalServers: serverData.meta.total,
      runningServers,
      stoppedServers,
      offlineServers,
      totalNodes: nodeData.length,
      totalUsers: userData.meta.total,
      totalAllocations: 0,
      configured: true,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  try {
    const entries = await db
      .select()
      .from(activityTable)
      .orderBy(desc(activityTable.createdAt))
      .limit(50);
    res.json(
      entries.map((e) => ({
        id: e.id,
        action: e.action,
        description: e.description,
        serverId: e.serverId ?? null,
        serverName: e.serverName ?? null,
        userId: e.userId ?? null,
        userName: e.userName ?? null,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get activity");
    res.status(500).json({ error: "Failed to get activity" });
  }
});

export default router;
