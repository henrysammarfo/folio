/**
 * Operator wall access — Account stays consumer-only unless FOLIO_OPS=1.
 * Never invent ops access from roles alone (owners can be end users).
 */

export function isFolioOpsEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env["FOLIO_OPS"]?.trim() === "1";
}
