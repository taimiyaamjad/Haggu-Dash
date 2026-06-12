import { Router } from "express";
import { db } from "@workspace/db";
import { activityTable } from "@workspace/db";
import { CreateActivityEntryBody } from "@workspace/api-zod";

const router = Router();

router.post("/activity", async (req, res): Promise<void> => {
  const parsed = CreateActivityEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid activity data" });
    return;
  }
  try {
    const [entry] = await db
      .insert(activityTable)
      .values({
        action: parsed.data.action,
        description: parsed.data.description,
        serverId: parsed.data.serverId ?? null,
        serverName: parsed.data.serverName ?? null,
        userId: parsed.data.userId ?? null,
        userName: parsed.data.userName ?? null,
      })
      .returning();
    res.status(201).json({
      id: entry.id,
      action: entry.action,
      description: entry.description,
      serverId: entry.serverId ?? null,
      serverName: entry.serverName ?? null,
      userId: entry.userId ?? null,
      userName: entry.userName ?? null,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to log activity");
    res.status(500).json({ error: "Failed to log activity" });
  }
});

export default router;
