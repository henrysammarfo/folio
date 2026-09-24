/**
 * Resolve client IP for rate limits — prefers X-Forwarded-For behind Vercel.
 * Safe outside a request (tests / scripts) → null.
 */

import { getRequestIP } from "@tanstack/react-start/server";

export function readClientIp(): string | null {
  try {
    return (
      getRequestIP({ xForwardedFor: true }) ?? getRequestIP() ?? null
    );
  } catch {
    return null;
  }
}
