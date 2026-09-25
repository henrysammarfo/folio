/**
 * Venue identity marks — real logos preferred over letter pills (Henry shot gap).
 */
import type { VenueId } from "@/lib/adapters/multi-venue";

const LABEL: Record<VenueId, string> = {
  jupiter: "Jupiter",
  "free-tape": "Free tape",
  raydium: "Raydium",
  solami: "Solami",
};

/** Compact brand mark for markets venue pills. */
export function VenueLogo({
  id,
  size = 14,
}: {
  id: VenueId;
  size?: number;
}) {
  const title = LABEL[id] ?? id;
  if (id === "jupiter") {
    return (
      <svg
        className="fx-venue-logo"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden
        title={title}
      >
        <circle cx="16" cy="16" r="16" fill="#00D18C" />
        <path
          d="M8.5 16.8c2.4 2.8 6.1 4.6 10.2 4.6 1.6 0 3.1-.3 4.5-.8L20.8 12c-1.1.4-2.3.6-3.5.6-3.1 0-5.9-1.2-7.9-3.1L8.5 16.8z"
          fill="#fff"
        />
      </svg>
    );
  }
  if (id === "raydium") {
    return (
      <svg
        className="fx-venue-logo"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden
        title={title}
      >
        <circle cx="16" cy="16" r="16" fill="#C4A4FF" />
        <path
          d="M10 21.5 16 8l6 13.5h-3.2L16 14.2l-2.8 7.3H10z"
          fill="#1a1028"
        />
      </svg>
    );
  }
  if (id === "solami") {
    return (
      <svg
        className="fx-venue-logo"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden
        title={title}
      >
        <circle cx="16" cy="16" r="16" fill="#111827" />
        <path
          d="M9 18.2c2.8 2.4 6.4 2.4 9.2 0l1.6 1.6c-3.8 3.2-9 3.2-12.8 0L9 18.2zm0-4.4 1.6-1.6c3.8-3.2 9-3.2 12.8 0L21.8 13.8c-2.8-2.4-6.4-2.4-9.2 0L9 13.8z"
          fill="#67E8F9"
        />
      </svg>
    );
  }
  // free-tape (GeckoTerminal)
  return (
    <svg
      className="fx-venue-logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      title={title}
    >
      <circle cx="16" cy="16" r="16" fill="#8B5CF6" />
      <circle cx="16" cy="16" r="6.5" fill="#fff" />
      <circle cx="16" cy="16" r="3" fill="#8B5CF6" />
    </svg>
  );
}

export function venueShortLabel(id: VenueId): string {
  return LABEL[id] ?? id;
}
