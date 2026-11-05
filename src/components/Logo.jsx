import { APP } from "../config.js";

/** Marca: um fio de prumo. Linha vertical e o peso na ponta. */
export function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#183020" />
      <path d="M16 6v12" stroke="#f3f6f2" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 17.5l3.6 4.6a4.5 4.5 0 1 1-7.2 0z" fill="#f3f6f2" />
    </svg>
  );
}

export default function Logo({ size = 26 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Mark size={size} />
      <span style={{ fontWeight: 600, fontSize: size * 0.68, letterSpacing: "-0.03em" }}>{APP.name}</span>
    </span>
  );
}
