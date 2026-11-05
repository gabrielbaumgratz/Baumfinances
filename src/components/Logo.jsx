/** baum = "árvore" em alemão. The mark: a round canopy over a trunk, inside a soft square. */
export function Mark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="var(--ink)" />
      <circle cx="32" cy="26" r="13" fill="var(--brand-fill)" />
      <rect x="29" y="34" width="6" height="18" rx="3" fill="var(--bg)" />
    </svg>
  );
}

export default function Logo({ size = 30 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Mark size={size} />
      <span style={{ fontWeight: 700, fontSize: size * 0.72, letterSpacing: "-0.05em" }}>baum</span>
    </span>
  );
}
