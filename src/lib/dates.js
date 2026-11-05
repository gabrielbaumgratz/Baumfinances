export const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
export const MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
export const WEEKDAYS = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];

const pad = (n) => String(n).padStart(2, "0");

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISO(new Date());

/** Parse 'YYYY-MM-DD' as a local date (no timezone shift). */
export function fromISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
export const isoMonthKey = (iso) => iso.slice(0, 7);

export function addMonths({ y, m }, delta) {
  const t = y * 12 + m + delta;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}

export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

/** ISO date for a given day of month, clamped (day 31 in February -> 28/29). */
export const dayInMonth = (y, m, day) => `${y}-${pad(m + 1)}-${pad(Math.min(day, daysInMonth(y, m)))}`;

export function relativeDay(iso, ref = today()) {
  const diff = Math.round((fromISO(iso) - fromISO(ref)) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  const d = fromISO(iso);
  const base = `${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
  if (diff > 1 && diff < 7) return `${WEEKDAYS[d.getDay()]}, ${base}`;
  return base;
}

export const shortDate = (iso) => {
  const d = fromISO(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

export const daysUntil = (iso, ref = today()) => Math.round((fromISO(iso) - fromISO(ref)) / 86400000);
