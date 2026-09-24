import { describe, expect, it, beforeEach } from "vitest";
import {
  rateLimitCheck,
  rateLimitClientKey,
  resetRateLimitStore,
} from "../auth/rate-limit";

describe("rateLimitCheck", () => {
  beforeEach(() => resetRateLimitStore());

  it("allows under the limit then blocks", () => {
    const key = "ip:1.2.3.4";
    for (let i = 0; i < 5; i++) {
      expect(rateLimitCheck("waitlist", key).ok).toBe(true);
    }
    const blocked = rateLimitCheck("waitlist", key);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
      expect(blocked.detail).toMatch(/waitlist/i);
    }
  });

  it("isolates buckets and clients", () => {
    expect(rateLimitCheck("quote", "u:a").ok).toBe(true);
    expect(rateLimitCheck("agent", "u:a").ok).toBe(true);
    expect(rateLimitCheck("quote", "u:b").ok).toBe(true);
  });

  it("enforces agent_daily at 5 per 24h window", () => {
    const key = "u:did:privy:demo";
    for (let i = 0; i < 5; i++) {
      expect(rateLimitCheck("agent_daily", key).ok).toBe(true);
    }
    const blocked = rateLimitCheck("agent_daily", key);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.detail).toMatch(/agent_daily/i);
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});

describe("rateLimitClientKey", () => {
  it("prefers user id over IP", () => {
    expect(rateLimitClientKey({ userId: "did:privy:x", ip: "1.1.1.1" })).toBe(
      "u:did:privy:x",
    );
    expect(rateLimitClientKey({ userId: null, ip: "9.9.9.9" })).toBe(
      "ip:9.9.9.9",
    );
    expect(rateLimitClientKey({})).toBe("anon:unknown");
  });
});
