/**
 * Mint short-lived Supabase-compatible HS256 JWTs with `sub` = Privy DID.
 * Fail-closed without SUPABASE_JWT_SECRET — never invents end-user authz.
 *
 * Project JWT secret: Supabase Dashboard → Project Settings → API → JWT Secret.
 * Used with SUPABASE_ANON_KEY so PostgREST RLS (auth.jwt() ->> 'sub') authorizes.
 */

import { createHmac } from "node:crypto";
import { errResult, okResult, type AdapterResult } from "../adapters/types";

export type SupabaseUserJwt = {
  token: string;
  expiresAt: string;
  /** Always "user-jwt" when ok — callers label service-role separately. */
  path: "user-jwt";
};

function b64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function jwtSecret(): string | null {
  const s = process.env["SUPABASE_JWT_SECRET"]?.trim();
  return s && s.length >= 16 ? s : null;
}

export function isSupabaseUserJwtConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    Boolean(env["SUPABASE_URL"]?.trim()) &&
    Boolean(env["SUPABASE_ANON_KEY"]?.trim()) &&
    (env["SUPABASE_JWT_SECRET"]?.trim().length ?? 0) >= 16
  );
}

/**
 * Mint HS256 JWT for PostgREST with role=authenticated and sub=Privy DID.
 * TTL default 5 minutes — short-lived server-side only (never exposed to browser).
 */
export function mintSupabaseUserJwt(
  userId: string,
  ttlSec = 300,
): AdapterResult<SupabaseUserJwt> {
  const source = "folio.supabase-user-jwt";
  const secret = jwtSecret();
  if (!secret) {
    return errResult(
      source,
      "supabase_jwt_secret_missing",
      "SUPABASE_JWT_SECRET (≥16) required to mint user JWTs for RLS. Service-role remains labeled fallback until set.",
    );
  }
  const sub = userId?.trim();
  if (!sub) {
    return errResult(
      source,
      "supabase_jwt_user_missing",
      "Privy subject required for JWT sub claim.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.max(30, Math.min(ttlSec, 3600));
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payload = b64urlJson({
    sub,
    role: "authenticated",
    aud: "authenticated",
    iat: now,
    exp,
  });
  const data = `${header}.${payload}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return okResult("mainnet-read", source, {
    token: `${data}.${sig}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    path: "user-jwt",
  });
}

/** Resolve REST auth headers: prefer user-JWT + anon; else service-role (labeled). */
export function resolveSupabaseRestAuth(userId: string): AdapterResult<{
  url: string;
  apikey: string;
  authorization: string;
  path: "user-jwt" | "service-role";
}> {
  const source = "folio.supabase-rest-auth";
  const url = process.env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  if (!url) {
    return errResult(source, "supabase_url_missing", "SUPABASE_URL required.");
  }

  if (isSupabaseUserJwtConfigured()) {
    const anon = process.env["SUPABASE_ANON_KEY"]!.trim();
    const jwt = mintSupabaseUserJwt(userId);
    if (!jwt.ok) return jwt;
    return okResult("mainnet-read", source, {
      url,
      apikey: anon,
      authorization: `Bearer ${jwt.data.token}`,
      path: "user-jwt",
    });
  }

  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!serviceKey) {
    return errResult(
      source,
      "supabase_keys_missing",
      "Need SUPABASE_JWT_SECRET+ANON (preferred) or SUPABASE_SERVICE_ROLE_KEY (labeled fallback).",
    );
  }
  return okResult("mainnet-read", source, {
    url,
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    path: "service-role",
  });
}
