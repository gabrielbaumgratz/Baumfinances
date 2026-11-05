import { titleCase } from "./format.js";

const PREFIXES = [
  /^compra (no|com) (cart[aã]o de )?(d[eé]bito|cr[eé]dito)\s*[-:]?\s*/i,
  /^compra\s*[-:]\s*/i,
  /^pagamento (de boleto|efetuado)\s*[-:]?\s*/i,
  /^transfer[eê]ncia (enviada|recebida)( pelo pix)?\s*[-:]?\s*/i,
  /^pix (enviado|recebido)\s*[-:]?\s*/i,
  /^d[eé]bito autom[aá]tico\s*[-:]?\s*/i,
  /^(pg|pag)\s*\*\s*/i,
];

/** Extracts a clean, human merchant name from a raw bank description. */
export function normalizeMerchant(raw = "") {
  let s = String(raw).trim();
  for (const re of PREFIXES) s = s.replace(re, "");
  s = s
    .replace(/\b(ifd|ifood)\*/i, "iFood ")
    .replace(/\*/g, " ")
    .replace(/\s+-\s+.*$/, "") // drop trailing " - CPF/agência" chunks
    .replace(/\b\d{2}\/\d{2}\b/g, "") // dates
    .replace(/\bparcela\s*\d+\/\d+\b/i, "")
    .replace(/\b\d{6,}\b/g, "") // long ids
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!s) return titleCase(String(raw).trim()) || "Sem nome";
  return /[a-z]/.test(s) && /[A-Z]/.test(s) ? s : titleCase(s);
}
