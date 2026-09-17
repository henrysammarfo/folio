/**
 * Apply local `.env` over empty/missing process.env entries.
 * Node `--env-file` and Vite dotenv do NOT override existing empty strings —
 * cloud agents often ship BITQUERY_*='' placeholders that shadow real .env values.
 * Never logs values. Safe no-op when `.env` is absent (Vercel).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export function applyDotEnv(path = resolve(process.cwd(), ".env")): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    const cur = process.env[key];
    if (cur == null || cur.trim() === "") {
      process.env[key] = val;
    }
  }
}
