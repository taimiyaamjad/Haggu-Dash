import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, localUsersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  setSessionCookie,
  type SessionData,
} from "../lib/auth";
import { getSetting } from "./settings";
import { pteroRequest } from "../lib/pterodactyl";
import {
  GetCurrentAuthUserResponse,
  LoginWithPasswordBody,
  RegisterAccountBody,
  LogoutSessionResponse,
} from "@workspace/api-zod";

const BOOTSTRAP_USER = "admin";
const BOOTSTRAP_PASS = "admin123";
const BOOTSTRAP_ID = "bootstrap-admin";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginWithPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  const { email, password } = parsed.data;

  const panelUrl = await getSetting("panelUrl");
  const apiKey = await getSetting("apiKey");
  const isPterodactylConfigured = !!(panelUrl && apiKey);

  if (!isPterodactylConfigured) {
    if (email === BOOTSTRAP_USER && password === BOOTSTRAP_PASS) {
      const sessionData: SessionData = {
        user: {
          id: BOOTSTRAP_ID,
          email: "admin@zendash.local",
          username: "admin",
          firstName: "Admin",
          lastName: "",
          role: "admin",
        },
      };
      const sid = await createSession(sessionData);
      setSessionCookie(res, sid);
      res.json(sessionData.user);
      return;
    }
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const [localUser] = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.email, email));

  if (!localUser) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, localUser.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: String(localUser.id),
      email: localUser.email,
      username: localUser.username,
      firstName: localUser.firstName,
      lastName: localUser.lastName,
      role: localUser.role,
    },
  };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json(sessionData.user);
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = RegisterAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input. Please check all fields." });
    return;
  }

  const { email, username, password, firstName, lastName } = parsed.data;

  const panelUrl = await getSetting("panelUrl");
  const apiKey = await getSetting("apiKey");
  if (!panelUrl || !apiKey) {
    res.status(503).json({
      error:
        "Pterodactyl panel is not configured. Log in with admin/admin123 to set it up first.",
    });
    return;
  }

  const existing = await db
    .select()
    .from(localUsersTable)
    .where(or(eq(localUsersTable.email, email), eq(localUsersTable.username, username)));

  if (existing.length > 0) {
    const conflict = existing[0].email === email ? "Email" : "Username";
    res.status(400).json({ error: `${conflict} is already taken.` });
    return;
  }

  let pterodactylUserId: number | undefined;
  try {
    const pteroUser = await pteroRequest<{
      attributes: { id: number };
    }>(`/users`, {
      method: "POST",
      body: JSON.stringify({
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        password,
        root_admin: false,
      }),
    });
    pterodactylUserId = pteroUser.attributes.id;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: `Pterodactyl error: ${msg}` });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [newUser] = await db
    .insert(localUsersTable)
    .values({
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      role: "user",
      pterodactylUserId,
    })
    .returning();

  const sessionData: SessionData = {
    user: {
      id: String(newUser.id),
      email: newUser.email,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    },
  };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json(sessionData.user);
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json(LogoutSessionResponse.parse({ success: true }));
});

export default router;
