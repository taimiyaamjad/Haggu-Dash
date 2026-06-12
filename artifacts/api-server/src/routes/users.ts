import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getPteroConfig,
} from "../lib/pterodactyl";
import { db } from "@workspace/db";
import { activityTable } from "@workspace/db";
import {
  ListPterodactylUsersQueryParams,
  GetPterodactylUserParams,
  CreatePterodactylUserBody,
  UpdatePterodactylUserParams,
  UpdatePterodactylUserBody,
  DeletePterodactylUserParams,
} from "@workspace/api-zod";

const router = Router();

async function logActivity(action: string, description: string) {
  await db.insert(activityTable).values({ action, description }).catch(() => {});
}

router.get("/users", async (req, res): Promise<void> => {
  const config = await getPteroConfig();
  if (!config) {
    res.status(503).json({ error: "Pterodactyl not configured. Visit Settings to add your API key." });
    return;
  }
  const parsed = ListPterodactylUsersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const search = parsed.success ? parsed.data.search : undefined;
  try {
    const result = await listUsers(page, search ?? undefined);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreatePterodactylUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user data" });
    return;
  }
  try {
    const user = await createUser(parsed.data);
    await logActivity("user.create", `Created user ${user.username} (${user.email})`);
    res.status(201).json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to create user");
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const parsed = GetPterodactylUserParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    const user = await getUser(parsed.data.userId);
    res.json(user);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.patch("/users/:userId", async (req, res): Promise<void> => {
  const paramsParsed = UpdatePterodactylUserParams.safeParse(req.params);
  const bodyParsed = UpdatePterodactylUserBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const user = await updateUser(paramsParsed.data.userId, bodyParsed.data);
    await logActivity("user.update", `Updated user ${user.username} (${user.email})`);
    res.json(user);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:userId", async (req, res): Promise<void> => {
  const parsed = DeletePterodactylUserParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  try {
    await deleteUser(parsed.data.userId);
    await logActivity("user.delete", `Deleted user ID ${parsed.data.userId}`);
    res.status(204).end();
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.status === 404) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
