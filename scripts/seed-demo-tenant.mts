/**
 * Bootstrap folio-demo tenant via service-role (no secrets printed).
 * Usage: npx tsx scripts/seed-demo-tenant.mts
 */
import { applyDotEnv } from "./load-dotenv.ts";
applyDotEnv();

async function main() {
  const url = (process.env["SUPABASE_URL"] ?? "").replace(/\/$/, "");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!url || !key) {
    console.log("missing SUPABASE_URL / SERVICE_ROLE");
    process.exit(1);
  }
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  };

  const tRes = await fetch(`${url}/rest/v1/tenants?on_conflict=slug`, {
    method: "POST",
    headers,
    body: JSON.stringify({ slug: "folio-demo", display_name: "FOLIO demo desk" }),
  });
  const tBody = await tRes.text();
  console.log("tenant upsert", tRes.status, tBody.slice(0, 180).replace(/\n/g, " "));

  const list = await fetch(`${url}/rest/v1/tenants?select=id,slug,display_name&slug=eq.folio-demo`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const tenants = (await list.json()) as Array<{ id: string; slug: string }>;
  console.log(
    "folio-demo",
    list.status,
    Array.isArray(tenants) && tenants[0]
      ? `id=${tenants[0].id.slice(0, 8)}… slug=${tenants[0].slug}`
      : String(tenants).slice(0, 120),
  );

  const members = await fetch(
    `${url}/rest/v1/tenant_members?select=user_id,role&limit=5`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
    },
  );
  const m = (await members.json()) as unknown[];
  console.log("member_rows", members.status, Array.isArray(m) ? m.length : "err");
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
