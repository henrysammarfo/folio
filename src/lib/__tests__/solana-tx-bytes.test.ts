import { describe, expect, it } from "vitest";
import { base64ToBytes, bytesToBase64 } from "../solana-tx-bytes";

describe("solana-tx-bytes", () => {
  it("round-trips UTF-8 payload", () => {
    const raw = new TextEncoder().encode("folio-order-bytes");
    const b64 = bytesToBase64(raw);
    expect(b64.length).toBeGreaterThan(8);
    expect(Array.from(base64ToBytes(b64))).toEqual(Array.from(raw));
  });
});
