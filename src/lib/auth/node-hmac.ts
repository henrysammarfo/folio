/**
 * Lazy Node crypto accessors — never statically import `node:crypto`.
 * Client Vite graphs that touch auth modules must not crash on module evaluate;
 * HMAC helpers throw if invoked outside Node.
 *
 * Prefer `process.getBuiltinModule("crypto")` (Node 20.16+ / 22) so Vitest ESM
 * works without `require`. Fall back to createRequire / eval require for older runtimes.
 */

type NodeCrypto = typeof import("node:crypto");

export function getNodeCrypto(): NodeCrypto {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("node:crypto is server-only");
  }

  const getBuiltin = (
    process as NodeJS.Process & {
      getBuiltinModule?: (id: string) => unknown;
    }
  ).getBuiltinModule;
  if (typeof getBuiltin === "function") {
    const mod = getBuiltin("crypto") ?? getBuiltin("node:crypto");
    if (mod) return mod as NodeCrypto;
  }

  try {
    // CJS / some bundlers expose require
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
    return (0, eval)("require")("node:crypto") as NodeCrypto;
  } catch {
    // ESM without getBuiltinModule — last resort
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
    const { createRequire } = (0, eval)("require")("node:module") as typeof import("node:module");
    return createRequire(import.meta.url)("node:crypto") as NodeCrypto;
  }
}

export function hmacSha256Base64Url(secret: string, payload: string): string {
  const { createHmac } = getNodeCrypto();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function timingSafeEqualUtf8(a: string, b: string): boolean {
  const { timingSafeEqual } = getNodeCrypto();
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
