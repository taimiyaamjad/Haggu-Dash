import { Router } from "express";
import { getPteroConfig, listNestsWithEggs } from "../lib/pterodactyl";

const router = Router();

router.get("/eggs", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const config = await getPteroConfig();
  if (!config) {
    res.status(503).json({ error: "Pterodactyl not configured" });
    return;
  }
  try {
    const nests = await listNestsWithEggs();
    res.json(nests);
  } catch (err) {
    req.log.error({ err }, "Failed to list eggs");
    res.status(500).json({ error: "Failed to list eggs" });
  }
});

export default router;
