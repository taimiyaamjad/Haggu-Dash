import { Router } from "express";
import { listNodes, getPteroConfig } from "../lib/pterodactyl";

const router = Router();

router.get("/nodes", async (req, res): Promise<void> => {
  const config = await getPteroConfig();
  if (!config) {
    res.status(503).json({ error: "Pterodactyl not configured. Visit Settings to add your API key." });
    return;
  }
  try {
    const nodes = await listNodes();
    res.json(nodes);
  } catch (err) {
    req.log.error({ err }, "Failed to list nodes");
    res.status(500).json({ error: "Failed to list nodes" });
  }
});

export default router;
