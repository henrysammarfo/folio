/** Single source for broadcast arming — false only when explicitly unpaused. */
export function isBroadcastPaused(): boolean {
  return process.env["BROADCAST_PAUSED"] !== "false";
}
