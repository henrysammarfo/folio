/** Public social + contact links — update Folio X handle when claimed. */
export const SOCIALS = {
  /** Prefer Folio brand handle once claimed; fallback founder until then. */
  x: "https://x.com/henrysammarfo",
  xHandle: "@henrysammarfo",
  /** Set to Folio brand when available, e.g. https://x.com/tryfolio */
  xFolio: null as string | null,
  github: "https://github.com/henrysammarfo/folio",
  githubOrg: "https://github.com/henrysammarfo",
  linkedin: "https://www.linkedin.com/in/henrysammarfo",
  demo: "https://folio-tawny-one.vercel.app",
  stocklana: "https://hackathons.solana.com/hackathons/stocklana",
  colosseum: "https://colosseum.com/worldsfair",
} as const;

export function primaryXUrl(): string {
  return SOCIALS.xFolio ?? SOCIALS.x;
}

export function primaryXHandle(): string {
  if (SOCIALS.xFolio) {
    try {
      return `@${new URL(SOCIALS.xFolio).pathname.replace(/^\//, "")}`;
    } catch {
      return SOCIALS.xHandle;
    }
  }
  return SOCIALS.xHandle;
}
