/** One quiet status line — replaces ModeBadge piles on consumer pages. */
export function DeskStatusLine({
  items,
}: {
  items: Array<{ label: string; tone?: "live" | "warn" | "muted" }>;
}) {
  return (
    <ul className="desk-status-line" aria-label="Status">
      {items.map((item) => (
        <li key={item.label} data-tone={item.tone ?? "muted"}>
          <span className="desk-status-dot" aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
