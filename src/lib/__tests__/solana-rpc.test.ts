import { describe, expect, it } from "vitest";
import {
  PUBLIC_SOLANA_MAINNET_RPC,
  resolveSolanaRpcUrl,
} from "../adapters/solana-rpc";

describe("resolveSolanaRpcUrl", () => {
  it("prefers SOLANA_RPC_URL when set", () => {
    const resolved = resolveSolanaRpcUrl({
      SOLANA_RPC_URL: "https://example-rpc.test",
    } as NodeJS.ProcessEnv);
    expect(resolved).toEqual({
      url: "https://example-rpc.test",
      publicFallback: false,
    });
  });

  it("falls back to public mainnet when unset", () => {
    const resolved = resolveSolanaRpcUrl({} as NodeJS.ProcessEnv);
    expect(resolved).toEqual({
      url: PUBLIC_SOLANA_MAINNET_RPC,
      publicFallback: true,
    });
  });

  it("treats blank SOLANA_RPC_URL as unset", () => {
    const resolved = resolveSolanaRpcUrl({
      SOLANA_RPC_URL: "  ",
    } as NodeJS.ProcessEnv);
    expect(resolved.publicFallback).toBe(true);
    expect(resolved.url).toBe(PUBLIC_SOLANA_MAINNET_RPC);
  });
});
