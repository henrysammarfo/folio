/** Single source for broadcast arming — false only when explicitly unpaused. */
export function isBroadcastPaused(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env["BROADCAST_PAUSED"] !== "false";
}
