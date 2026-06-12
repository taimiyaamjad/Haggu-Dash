import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { getPteroConfig } from "../lib/pterodactyl";

const router = Router();

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value, updatedAt: new Date() },
    });
}

router.get("/settings", async (req, res): Promise<void> => {
  try {
    const [panelUrl, apiKey] = await Promise.all([
      getSetting("panelUrl"),
      getSetting("apiKey"),
    ]);
    res.json({
      panelUrl: panelUrl ?? null,
      hasApiKey: !!apiKey,
      configured: !!(panelUrl && apiKey),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid settings" });
    return;
  }
  try {
    const { panelUrl, apiKey } = parsed.data;
    if (panelUrl !== undefined) await setSetting("panelUrl", panelUrl);
    if (apiKey !== undefined && apiKey !== "") await setSetting("apiKey", apiKey);
    const [storedPanelUrl, storedApiKey] = await Promise.all([
      getSetting("panelUrl"),
      getSetting("apiKey"),
    ]);
    res.json({
      panelUrl: storedPanelUrl ?? null,
      hasApiKey: !!storedApiKey,
      configured: !!(storedPanelUrl && storedApiKey),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.post("/settings/test", async (req, res): Promise<void> => {
  try {
    const config = await getPteroConfig();
    if (!config) {
      res.status(400).json({ error: "Pterodactyl not configured" });
      return;
    }
    const testRes = await fetch(`${config.panelUrl}/api/application/users?per_page=1`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
    });
    if (testRes.ok) {
      res.json({ success: true, message: "Connection successful", version: null });
    } else {
      const text = await testRes.text().catch(() => testRes.statusText);
      res.json({
        success: false,
        message: `Connection failed: ${testRes.status} ${text.slice(0, 100)}`,
        version: null,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ success: false, message: `Connection error: ${msg}`, version: null });
  }
});

export default router;
