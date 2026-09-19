#!/usr/bin/env npx tsx
/**
 * Fail if client-facing files embed secret VALUES.
 * Env var *names* and server-only process.env reads are OK.
 * Public Privy App ID is OK.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [
  join(process.cwd(), "src/components"),
  join(process.cwd(), "src/routes"),
];

/** Literal secret-looking values — not identifier names. */
const BAD =
  /(sk-[a-zA-Z0-9]{20,}|vcp_[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,})/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

let failed = false;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    if (BAD.test(text)) {
      console.error(`frontend secret value: ${file}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("frontend secrets scan: clean (no embedded secret values in UI)");
