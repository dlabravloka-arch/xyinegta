import { status as mcStatus } from 'minecraft-server-util';

export type ServerStatus = {
  online: boolean;
  host: string;
  port: number;
  players?: { online: number; max: number; sample?: { name: string }[] };
  version?: string;
  motd?: string;
  latencyMs?: number;
  error?: string;
};

const cache: { value: ServerStatus | null; expiresAt: number } = {
  value: null,
  expiresAt: 0,
};

const CACHE_MS = 15_000;

export async function getServerStatus(): Promise<ServerStatus> {
  const host = process.env.MC_HOST || 'localhost';
  const port = Number(process.env.MC_PORT || 25565);

  const now = Date.now();
  if (cache.value && cache.expiresAt > now) return cache.value;

  let result: ServerStatus;
  try {
    const r = await mcStatus(host, port, { timeout: 3000, enableSRV: true });
    result = {
      online: true,
      host,
      port,
      players: {
        online: r.players.online,
        max: r.players.max,
        sample: r.players.sample?.map((p) => ({ name: p.name })),
      },
      version: r.version.name,
      motd: r.motd.clean,
      latencyMs: r.roundTripLatency,
    };
  } catch (e) {
    result = {
      online: false,
      host,
      port,
      error: e instanceof Error ? e.message : 'unknown',
    };
  }

  cache.value = result;
  cache.expiresAt = now + CACHE_MS;
  return result;
}
