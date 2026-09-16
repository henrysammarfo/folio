/**
 * Lazy Node crypto accessors — never statically import `node:crypto`.
 * Client Vite graphs that touch auth modules must not crash on module evaluate;
 * HMAC helpers throw if invoked outside Node.
 */

type NodeCrypto = typeof import("node:crypto");

export function getNodeCrypto(): NodeCrypto {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("node:crypto is server-only");
  }
  // Avoid static `import "node:crypto"` so browser bundles can parse auth modules.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
  return (0, eval)("require")("node:crypto") as NodeCrypto;
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
