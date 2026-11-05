import { parseMoney } from "./format.js";
import { normalizeMerchant } from "./merchant.js";

const pad = (n) => String(n).padStart(2, "0");

/**
 * OFX (Open Financial Exchange) — exported by most Brazilian banks
 * (Nubank, Inter, Itaú, BB, Bradesco, C6...). Works for SGML (v1) and XML (v2).
 */
export function parseOFX(text) {
  const out = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const tag = (block, name) => {
    const m = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"));
    return m ? m[1].trim() : "";
  };
  for (const raw of blocks) {
    const block = raw.split(/<\/STMTTRN>/i)[0];
    const dt = tag(block, "DTPOSTED");
    const amount = parseMoney(tag(block, "TRNAMT"));
    if (!/^\d{8}/.test(dt) || !Number.isFinite(amount)) continue;
    const date = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;
    const description = tag(block, "MEMO") || tag(block, "NAME") || "Transação";
    out.push({
      date,
      amount,
      description,
      merchant: normalizeMerchant(description),
      externalId: tag(block, "FITID") || `${date}|${amount}|${description}`,
    });
  }
  return out;
}

function splitCSVLine(line, sep) {
  const cells = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (ch === sep && !q) { cells.push(cur); cur = ""; }
    else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parseDateCell(s) {
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${y}-${pad(m[2])}-${pad(m[1])}`;
  }
  return null;
}

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Generic CSV: detects separator and the date / description / amount columns by header name.
 * `invertSign`: credit-card CSVs usually list purchases as positive numbers.
 */
export function parseCSV(text, { invertSign = false } = {}) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const first = lines[0];
  const sep = [";", ",", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const header = splitCSVLine(first, sep).map(norm);
  const find = (...names) => header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const iDate = find("data", "date");
  const iDesc = find("descricao", "description", "title", "titulo", "historico", "estabelecimento", "lancamento");
  const iAmount = find("valor", "amount", "quantia", "value");
  if (iDate < 0 || iAmount < 0) throw new Error("Não achei as colunas de data e valor no CSV.");
  const out = [];
  for (const line of lines.slice(1)) {
    const cells = splitCSVLine(line, sep);
    const date = parseDateCell(cells[iDate] || "");
    let amount = parseMoney(cells[iAmount]);
    if (!date || !Number.isFinite(amount)) continue;
    if (invertSign) amount = -amount;
    const description = (iDesc >= 0 ? cells[iDesc] : "") || "Transação";
    out.push({ date, amount, description, merchant: normalizeMerchant(description), externalId: `${date}|${amount}|${description}` });
  }
  return out;
}

export function parseStatement(fileName, text, opts) {
  if (/\.ofx$/i.test(fileName) || /<OFX>|OFXHEADER/i.test(text)) return parseOFX(text);
  return parseCSV(text, opts);
}
