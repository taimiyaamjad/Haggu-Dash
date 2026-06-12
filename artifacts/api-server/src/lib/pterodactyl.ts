import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface PteroConfig {
  panelUrl: string;
  apiKey: string;
}

async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function getPteroConfig(): Promise<PteroConfig | null> {
  const [panelUrl, apiKey] = await Promise.all([
    getSetting("panelUrl"),
    getSetting("apiKey"),
  ]);
  if (!panelUrl || !apiKey) return null;
  return { panelUrl: panelUrl.replace(/\/$/, ""), apiKey };
}

export async function pteroRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getPteroConfig();
  if (!config) {
    throw new Error("Pterodactyl not configured");
  }
  const url = `${config.panelUrl}/api/application${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`Pterodactyl error ${res.status}: ${text}`), {
      status: res.status,
    });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function pteroClientRequest<T>(
  serverIdentifier: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getPteroConfig();
  if (!config) {
    throw new Error("Pterodactyl not configured");
  }
  const url = `${config.panelUrl}/api/client/servers/${serverIdentifier}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw Object.assign(new Error(`Pterodactyl error ${res.status}: ${text}`), {
      status: res.status,
    });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapServer(s: any) {
  const a = s.attributes ?? s;
  return {
    id: a.id,
    externalId: a.external_id ?? null,
    uuid: a.uuid,
    identifier: a.identifier,
    name: a.name,
    description: a.description ?? "",
    suspended: a.suspended ?? false,
    limits: {
      memory: a.limits?.memory ?? 0,
      swap: a.limits?.swap ?? 0,
      disk: a.limits?.disk ?? 0,
      io: a.limits?.io ?? 0,
      cpu: a.limits?.cpu ?? 0,
      threads: a.limits?.threads ?? null,
    },
    featureLimits: {
      databases: a.feature_limits?.databases ?? 0,
      allocations: a.feature_limits?.allocations ?? 0,
      backups: a.feature_limits?.backups ?? 0,
    },
    node: a.node ?? "",
    container: {
      startupCommand: a.container?.startup_command ?? "",
      image: a.container?.image ?? "",
      installed: a.container?.installed === 1 || a.container?.installed === true,
      environment: a.container?.environment ?? {},
    },
    updatedAt: a.updated_at ?? new Date().toISOString(),
    createdAt: a.created_at ?? new Date().toISOString(),
    status: a.status ?? null,
    userId: a.user ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNode(n: any) {
  const a = n.attributes ?? n;
  return {
    id: a.id,
    uuid: a.uuid,
    name: a.name,
    description: a.description ?? null,
    locationId: a.location_id ?? 0,
    fqdn: a.fqdn,
    scheme: a.scheme ?? "https",
    behindProxy: a.behind_proxy ?? false,
    maintenanceMode: a.maintenance_mode ?? false,
    memory: a.memory ?? 0,
    memoryOverallocate: a.memory_overallocate ?? 0,
    disk: a.disk ?? 0,
    diskOverallocate: a.disk_overallocate ?? 0,
    uploadSize: a.upload_size ?? 100,
    daemonListen: a.daemon_listen ?? 8080,
    daemonSftp: a.daemon_sftp ?? 2022,
    daemonBase: a.daemon_base ?? "/var/lib/pterodactyl/volumes",
    createdAt: a.created_at ?? new Date().toISOString(),
    updatedAt: a.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(u: any) {
  const a = u.attributes ?? u;
  return {
    id: a.id,
    externalId: a.external_id ?? null,
    uuid: a.uuid,
    username: a.username,
    email: a.email,
    firstName: a.first_name,
    lastName: a.last_name,
    language: a.language ?? "en",
    rootAdmin: a.root_admin ?? false,
    twoFactor: a["2fa"] ?? false,
    createdAt: a.created_at ?? new Date().toISOString(),
    updatedAt: a.updated_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPagination(meta: any) {
  const p = meta?.pagination ?? {};
  return {
    total: p.total ?? 0,
    count: p.count ?? 0,
    perPage: p.per_page ?? 50,
    currentPage: p.current_page ?? 1,
    totalPages: p.total_pages ?? 1,
  };
}

export async function listServers(page = 1, search?: string, userId?: number) {
  const params = new URLSearchParams({ page: String(page), per_page: "50" });
  if (search) params.set("filter[name]", search);
  if (userId) params.set("filter[user_id]", String(userId));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(`/servers?${params}`);
  return {
    data: (data.data ?? []).map(mapServer),
    meta: mapPagination(data.meta),
  };
}

export async function getServer(serverId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(`/servers/${serverId}`);
  return mapServer(data);
}

export async function listNodes() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(`/nodes?per_page=100`);
  return (data.data ?? []).map(mapNode);
}

export async function listUsers(page = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page), per_page: "50" });
  if (search) params.set("filter[email]", search);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(`/users?${params}`);
  return {
    data: (data.data ?? []).map(mapUser),
    meta: mapPagination(data.meta),
  };
}

export async function getUser(userId: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(`/users/${userId}`);
  return mapUser(data);
}

export async function createUser(body: {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  rootAdmin?: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest("/users", {
    method: "POST",
    body: JSON.stringify({
      email: body.email,
      username: body.username,
      first_name: body.firstName,
      last_name: body.lastName,
      password: body.password,
      root_admin: body.rootAdmin ?? false,
    }),
  });
  return mapUser(data);
}

export async function updateUser(
  userId: number,
  body: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    rootAdmin?: boolean;
  }
) {
  const existing = await getUser(userId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      email: body.email ?? existing.email,
      username: body.username ?? existing.username,
      first_name: body.firstName ?? existing.firstName,
      last_name: body.lastName ?? existing.lastName,
      root_admin: body.rootAdmin ?? existing.rootAdmin,
      ...(body.password ? { password: body.password } : {}),
    }),
  });
  return mapUser(data);
}

export async function deleteUser(userId: number) {
  await pteroRequest(`/users/${userId}`, { method: "DELETE" });
}

export async function sendPowerAction(
  identifier: string,
  signal: "start" | "stop" | "restart" | "kill"
) {
  await pteroClientRequest(identifier, "/power", {
    method: "POST",
    body: JSON.stringify({ signal }),
  });
}

export async function sendCommand(identifier: string, command: string) {
  await pteroClientRequest(identifier, "/command", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

export async function getServerResources(identifier: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroClientRequest(identifier, "/resources");
  const a = data.attributes ?? data;
  const r = a.resources ?? {};
  return {
    currentState: a.current_state ?? "unknown",
    isSuspended: a.is_suspended ?? false,
    resources: {
      memoryBytes: r.memory_bytes ?? 0,
      cpuAbsolute: r.cpu_absolute ?? 0,
      diskBytes: r.disk_bytes ?? 0,
      networkRxBytes: r.network_rx_bytes ?? 0,
      networkTxBytes: r.network_tx_bytes ?? 0,
      uptime: r.uptime ?? 0,
    },
  };
}

export async function listNestsWithEggs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nestsData: any = await pteroRequest("/nests?per_page=100");
  const nests = nestsData.data ?? [];

  const result = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nests.map(async (nest: any) => {
      const na = nest.attributes;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eggsData: any = await pteroRequest(
          `/nests/${na.id}/eggs?per_page=100`
        );
        return {
          id: na.id,
          name: na.name,
          description: na.description ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          eggs: (eggsData.data ?? []).map((e: any) => {
            const ea = e.attributes;
            return {
              id: ea.id,
              name: ea.name,
              dockerImage: ea.docker_image ?? "",
              startup: ea.startup ?? "",
            };
          }),
        };
      } catch {
        return { id: na.id, name: na.name, description: null, eggs: [] };
      }
    })
  );

  return result.filter((n) => n.eggs.length > 0);
}

export async function getEggDetails(nestId: number, eggId: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest(
    `/nests/${nestId}/eggs/${eggId}?include=variables`
  );
  const ea = data.attributes;
  const variables = ea.relationships?.variables?.data ?? [];
  const environment: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const v of variables) {
    const va = v.attributes;
    environment[va.env_variable] = va.default_value ?? "";
  }
  return {
    id: ea.id,
    name: ea.name,
    dockerImage: ea.docker_image ?? "",
    startup: ea.startup ?? "",
    environment,
  };
}

export async function findFreeAllocation(): Promise<{
  nodeId: number;
  allocationId: number;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodesData: any = await pteroRequest("/nodes?per_page=100");
  const nodes = nodesData.data ?? [];

  for (const node of nodes) {
    const nodeId = node.attributes.id;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allocsData: any = await pteroRequest(
        `/nodes/${nodeId}/allocations?per_page=100`
      );
      const allocs = allocsData.data ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const free = allocs.find((a: any) => !a.attributes.assigned);
      if (free) {
        return { nodeId, allocationId: free.attributes.id };
      }
    } catch {
      continue;
    }
  }
  throw new Error(
    "No free allocations found. Ask your admin to add more ports to a node."
  );
}

export async function createPteroServer(params: {
  name: string;
  pterodactylUserId: number;
  nestId: number;
  eggId: number;
  memory?: number;
  cpu?: number;
  disk?: number;
}) {
  const { memory = 2048, cpu = 50, disk = 10240 } = params;

  const [egg, allocation] = await Promise.all([
    getEggDetails(params.nestId, params.eggId),
    findFreeAllocation(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await pteroRequest("/servers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      user: params.pterodactylUserId,
      egg: params.eggId,
      docker_image: egg.dockerImage,
      startup: egg.startup,
      environment: egg.environment,
      limits: {
        memory,
        swap: 0,
        disk,
        io: 500,
        cpu,
        threads: null,
      },
      feature_limits: {
        databases: 0,
        backups: 0,
        allocations: 1,
      },
      allocation: {
        default: allocation.allocationId,
      },
    }),
  });
  return mapServer(data);
}

export { mapServer, mapNode, mapUser };
