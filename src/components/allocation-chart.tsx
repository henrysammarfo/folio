/** Soft allocation chart from live holdings weights — not fake price history. */
export function AllocationChart({
  parts,
}: {
  parts: { label: string; value: number; color: string }[];
}) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total <= 0) {
    return (
      <div className="fx-alloc fx-alloc-empty" aria-hidden>
        <div className="fx-alloc-bar" />
      </div>
    );
  }
  return (
    <div className="fx-alloc" role="img" aria-label="Holdings allocation">
      <div className="fx-alloc-bar">
        {parts.map((p) => (
          <span
            key={p.label}
            style={{
              width: `${(p.value / total) * 100}%`,
              background: p.color,
            }}
            title={`${p.label} ${((p.value / total) * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <ul className="fx-alloc-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} aria-hidden />
            <span>{p.label}</span>
            <b>{((p.value / total) * 100).toFixed(0)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PALETTE = ["#0EA5C9", "#0B1220", "#5B8DEF", "#2BB673", "#F0A202"];

export function paletteFor(i: number): string {
  return PALETTE[i % PALETTE.length]!;
}
