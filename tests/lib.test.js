import { describe, expect, it } from "vitest";
import { parseMoney } from "../src/lib/format.js";
import { parseOFX, parseCSV } from "../src/lib/importers.js";
import { normalizeMerchant } from "../src/lib/merchant.js";
import { guessCategory, DEFAULT_CATEGORIES } from "../src/lib/categories.js";
import { addMonths, dayInMonth } from "../src/lib/dates.js";
import { byMerchant, fixedForMonth, monthSummary, projection, totalBalance, upcoming } from "../src/lib/selectors.js";
import { demoState } from "../src/lib/demo.js";

describe("parseMoney", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1234.56", 1234.56],
    ["R$ 12,30", 12.3],
    ["-50", -50],
    ["1,234.56", 1234.56],
    ["1.000.000", 1000000],
    ["(20,00)", -20],
    ["abc", NaN],
  ])("%s -> %s", (input, expected) => expect(parseMoney(input)).toEqual(expected));
});

describe("dates", () => {
  it("wraps months", () => {
    expect(addMonths({ y: 2026, m: 11 }, 1)).toEqual({ y: 2027, m: 0 });
    expect(addMonths({ y: 2026, m: 0 }, -1)).toEqual({ y: 2025, m: 11 });
  });
  it("clamps day of month", () => expect(dayInMonth(2026, 1, 31)).toBe("2026-02-28"));
});

describe("importers", () => {
  it("parses SGML OFX", () => {
    const ofx = `OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261103000000[-3:BRT]<TRNAMT>-42.90<FITID>abc1<MEMO>Compra no débito - IFOOD *RESTAURANTE
</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261105<TRNAMT>1500.00<FITID>abc2<MEMO>Transferência recebida pelo Pix - PREFEITURA
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    const r = parseOFX(ofx);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ date: "2026-11-03", amount: -42.9, externalId: "abc1" });
    expect(r[1]).toMatchObject({ date: "2026-11-05", amount: 1500 });
  });

  it("parses CSV with ; and BR numbers", () => {
    const csv = `Data;Descrição;Valor\n03/11/2026;Uber *trip;-23,40\n04/11/2026;"Mercado, BH";-186,20`;
    const r = parseCSV(csv);
    expect(r.map((x) => x.amount)).toEqual([-23.4, -186.2]);
    expect(r[1].description).toBe("Mercado, BH");
  });

  it("parses card CSV with inverted sign", () => {
    const csv = `date,title,amount\n2026-11-03,Spotify,21.90`;
    expect(parseCSV(csv, { invertSign: true })[0].amount).toBe(-21.9);
  });

  it("throws on unknown CSV", () => expect(() => parseCSV("a;b\n1;2")).toThrow());
});

describe("merchant + category", () => {
  it("normalizes", () => {
    expect(normalizeMerchant("Compra no débito - SUPERMERCADO EPA")).toBe("Supermercado Epa");
    expect(normalizeMerchant("UBER *TRIP 123456789")).toBe("Uber Trip");
  });
  it("guesses by keyword", () => {
    expect(guessCategory({ merchant: "Uber Trip" }, DEFAULT_CATEGORIES)).toBe("transporte");
    expect(guessCategory({ merchant: "Fulano", amount: 100 }, DEFAULT_CATEGORIES)).toBe("renda");
  });
  it("learns from history", () => {
    const history = [{ merchant: "Loja X", categoryId: "presentes" }];
    expect(guessCategory({ merchant: "loja x" }, DEFAULT_CATEGORIES, history)).toBe("presentes");
  });
});

describe("selectors", () => {
  const ref = "2026-11-15";
  const s = demoState(ref);
  const ym = { y: 2026, m: 10 };

  it("counts merchant visits", () => {
    const m = byMerchant(s.transactions.filter((t) => t.date.startsWith("2026-11")));
    const uber = m.find((x) => x.name === "Uber");
    expect(uber.count).toBe(3);
  });

  it("fixed paid status", () => {
    const f = fixedForMonth(s, ym);
    expect(f.find((x) => x.item.name === "Aluguel").paidTx).toBeTruthy();
    expect(f.find((x) => x.item.name === "Academia").paidTx).toBeFalsy();
  });

  it("projection subtracts pending fixed and sure plans", () => {
    const p = projection(s, ym, ref);
    expect(p.base).toBeCloseTo(totalBalance(s, ref));
    expect(p.pendingFixed).toBeCloseTo(-89.9);
    expect(p.sure).toBeCloseTo(-150);
    expect(p.expected).toBeCloseTo(p.base - 89.9 - 150);
  });

  it("upcoming lists unpaid and plans", () => {
    const u = upcoming(s, 30, ref);
    expect(u.some((x) => x.name === "Academia")).toBe(true);
    expect(u.some((x) => x.name === "Aluguel" && x.date === "2026-12-10")).toBe(true);
  });

  it("summary", () => {
    expect(monthSummary([{ amount: 10 }, { amount: -4 }])).toEqual({ income: 10, expense: 4, net: 6 });
  });
});

import { deriveKey, newSalt, open, seal } from "../src/lib/vault.js";
import { normalize } from "../src/lib/store.jsx";

describe("vault", () => {
  it("round-trips with the right PIN and rejects a wrong one", async () => {
    const salt = newSalt();
    const key = await deriveKey("482913", salt, 1000);
    const secret = { merchant: "Supermercado secreto" };
    const v = await seal(key, salt, secret, 1000);
    expect(atob(v.ct)).not.toContain("secreto");
    expect(await open(key, v)).toEqual(secret);
    const wrong = await deriveKey("000001", salt, 1000);
    await expect(open(wrong, v)).rejects.toBeTruthy();
  });
});

describe("normalize", () => {
  it("rejects garbage and drops invalid rows", () => {
    expect(() => normalize(null)).toThrow();
    expect(() => normalize({ transactions: "x" })).toThrow();
    const n = normalize({ transactions: [{ id: "1", date: "2026-01-01", amount: -5 }, { id: "2", date: "bad", amount: 1 }, null] });
    expect(n.transactions).toHaveLength(1);
    expect(n.settings.theme).toBe("system");
  });
});

import { buildBackup, decryptBackup, inspectBackup } from "../src/lib/backup.js";

describe("backup", () => {
  const state = { transactions: [{ id: "1", date: "2026-01-01", amount: -10, merchant: "Farmácia sigilosa" }], accounts: [] };
  it("plain backup round-trips", async () => {
    expect(inspectBackup(await buildBackup(state)).data).toEqual(state);
  });
  it("encrypted backup hides content and needs the password", async () => {
    const text = await buildBackup(state, "senha-forte-123");
    expect(text).not.toContain("sigilosa");
    const r = inspectBackup(text);
    expect(r.encrypted).toBe(true);
    expect(await decryptBackup(r.json, "senha-forte-123")).toEqual(state);
    await expect(decryptBackup(r.json, "errada")).rejects.toBeTruthy();
  });
  it("rejects unknown files", () => expect(() => inspectBackup('{"x":1}')).toThrow());
});
