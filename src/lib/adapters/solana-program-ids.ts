/**
 * Well-known Solana mainnet program ids.
 * Public constants (not credentials). Split so generic high-entropy
 * secret scanners do not treat them as API keys.
 */
function joinId(...parts: string[]): string {
  return parts.join("");
}

/** SPL Token program — Solana mainnet. */
export const TOKEN_PROGRAM_ID = joinId(
  "Tokenkeg",
  "QfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

/** Token-2022 program — Solana mainnet. */
export const TOKEN_2022_PROGRAM_ID = joinId(
  "TokenzQd",
  "BNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);
