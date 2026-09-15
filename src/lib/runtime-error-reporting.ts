/**
 * Runtime error reporter for FOLIO (no third-party editor telemetry).
 */
export function reportRuntimeError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const err =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown error");
  console.error("[FOLIO]", err.message, context, err.stack);
}