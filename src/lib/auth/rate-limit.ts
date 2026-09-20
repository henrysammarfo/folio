/**
 * In-memory sliding-window rate limits for desk mutations / hot paths.
 * Per-process only — honest for single Node / serverless instance; not a global CDN WAF.
 * Upstash/Redis deferred until UPSTASH_* keys exist (do not invent a distributed store).
 */

export type RateLimitBucket =
  | "quote"
  | "execute"
  | "agent"
  | "waitlist";

type WindowCfg = { limit: number; windowMs: number };

const BUCKETS: Record<RateLimitBucket, WindowCfg> = {
  quote: { limit: 40, windowMs: 60_000 },
  execute: { limit: 12, windowMs: 60_000 },
  agent: { limit: 12, windowMs: 60_000 },
  waitlist: { limit: 5, windowMs: 60 * 60_000 },
};

type Hit = { at: number };

const store = new Map<string, Hit[]>();

/** Test/reset helper — clears all buckets. */
export function resetRateLimitStore(): void {
  store.clear();
}

export function rateLimitCheck(
  bucket: RateLimitBucket,
  clientKey: string,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number; detail: string } {
  const cfg = BUCKETS[bucket];
  const key = `${bucket}:${clientKey}`;
  const cutoff = now - cfg.windowMs;
  const prev = store.get(key) ?? [];
  const alive = prev.filter((h) => h.at > cutoff);
  if (alive.length >= cfg.limit) {
    const oldest = alive[0]!.at;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + cfg.windowMs - now) / 1000),
    );
    store.set(key, alive);
    return {
      ok: false,
      retryAfterSec,
      detail: `Too many ${bucket} requests — try again in ~${retryAfterSec}s.`,
    };
  }
  alive.push({ at: now });
  store.set(key, alive);
  return { ok: true };
}

/** Build a stable client key from session user id and/or IP. */
export function rateLimitClientKey(opts: {
  userId?: string | null;
  ip?: string | null;
}): string {
  const uid = opts.userId?.trim();
  if (uid) return `u:${uid}`;
  const ip = opts.ip?.trim();
  if (ip) return `ip:${ip}`;
  return "anon:unknown";
}
