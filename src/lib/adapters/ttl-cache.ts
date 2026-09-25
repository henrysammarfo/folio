/** Tiny process-local TTL cache for live adapters (serverless-friendly, short TTL). */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  storedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
/** In-flight dedupe — 1k concurrent users share one upstream fetch per key. */
const inflight = new Map<string, Promise<unknown>>();

export function cacheGet<T>(key: string): { value: T; ageMs: number } | null {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) return null;
  return { value: hit.value, ageMs: Date.now() - hit.storedAt };
}

/**
 * Stale read for rate-limit fallback — returns entries past TTL while age ≤ maxStaleMs.
 * Does not invent values; only returns what was previously stored from a live ok response.
 */
export function cacheGetStale<T>(
  key: string,
  maxStaleMs: number,
): { value: T; ageMs: number; stale: boolean } | null {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  const ageMs = Date.now() - hit.storedAt;
  if (ageMs > maxStaleMs) {
    store.delete(key);
    return null;
  }
  return { value: hit.value, ageMs, stale: Date.now() > hit.expiresAt };
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  const now = Date.now();
  store.set(key, { value, storedAt: now, expiresAt: now + ttlMs });
}

/**
 * Single-flight: concurrent callers with the same key await one producer.
 * Producer is responsible for cacheSet on success.
 */
export async function cacheSingleflight<T>(
  key: string,
  produce: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = produce().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

/** Test helper — do not use in production paths. */
export function cacheClearForTests(): void {
  store.clear();
  inflight.clear();
}
