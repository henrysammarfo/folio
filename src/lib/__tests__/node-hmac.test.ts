import { describe, expect, it } from "vitest";
import {
  getNodeCrypto,
  hmacSha256Base64Url,
  timingSafeEqualUtf8,
} from "../auth/node-hmac";

describe("node-hmac", () => {
  it("loads Node crypto without static import / require", () => {
    const crypto = getNodeCrypto();
    expect(typeof crypto.createHmac).toBe("function");
    expect(typeof crypto.timingSafeEqual).toBe("function");
  });

  it("signs stable base64url HMACs", () => {
    const a = hmacSha256Base64Url("test-secret-16chars", "payload");
    const b = hmacSha256Base64Url("test-secret-16chars", "payload");
    expect(a).toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("timing-safe compares equal utf8", () => {
    expect(timingSafeEqualUtf8("abc", "abc")).toBe(true);
    expect(timingSafeEqualUtf8("abc", "abd")).toBe(false);
    expect(timingSafeEqualUtf8("abc", "ab")).toBe(false);
  });
});
