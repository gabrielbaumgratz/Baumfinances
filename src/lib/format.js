const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlShort = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

export const fmt = (v) => brl.format(v || 0);
export const fmtShort = (v) => (Math.abs(v) >= 10000 ? brlShort.format(v) : brl.format(v || 0));
export const fmtSigned = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + brl.format(Math.abs(v || 0));

/** Parses "1.234,56", "1234.56", "R$ 12,3", "-50" into a number (NaN if invalid). */
export function parseMoney(input) {
  if (typeof input === "number") return input;
  if (input == null) return NaN;
  let s = String(input).replace(/R\$|\s/g, "").trim();
  if (!s) return NaN;
  const neg = /^-|^\(.*\)$|-$/.test(s);
  s = s.replace(/[()\-+]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma && lastComma !== -1) s = s.replace(/,/g, "");
  else if (lastComma === -1 && (s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return neg ? -n : n;
}

export const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 && !/^[a-z]\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
