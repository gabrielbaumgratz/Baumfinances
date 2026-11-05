import { emptyState } from "./store.jsx";
import { addMonths, dayInMonth, today, fromISO } from "./dates.js";
import { uid } from "./id.js";

/** Example data relative to the current date, so the app looks alive on first run. */
export function demoState(ref = today()) {
  const s = emptyState();
  const d = fromISO(ref);
  const cur = { y: d.getFullYear(), m: d.getMonth() };
  const day = d.getDate();

  const nu = { id: uid(), name: "Conta principal", bank: "Nubank", type: "checking", color: "#6250d6", initial: 1850 };
  const inter = { id: uid(), name: "Reserva", bank: "Inter", type: "savings", color: "#eb6834", initial: 4200 };
  const card = { id: uid(), name: "Cartão", bank: "C6 Bank", type: "credit", color: "#0e0f0c", initial: 0 };
  s.accounts = [nu, inter, card];

  s.fixed = [
    { id: uid(), name: "Estágio", amount: 1500, kind: "income", categoryId: "renda", accountId: nu.id, day: 5, active: true },
    { id: uid(), name: "Aluguel", amount: 800, kind: "expense", categoryId: "moradia", accountId: nu.id, day: 10, active: true },
    { id: uid(), name: "Internet", amount: 110, kind: "expense", categoryId: "contas", accountId: nu.id, day: 15, active: true },
    { id: uid(), name: "Spotify", amount: 21.9, kind: "expense", categoryId: "assinaturas", accountId: card.id, day: 12, active: true },
    { id: uid(), name: "Academia", amount: 89.9, kind: "expense", categoryId: "saude", accountId: nu.id, day: 20, active: true },
  ];

  const tx = [];
  const add = (p, dd, amount, merchant, categoryId, accountId, note = "", extra = {}) =>
    tx.push({ id: uid(), date: dayInMonth(p.y, p.m, dd), amount, merchant, description: merchant, categoryId, accountId, note, ...extra });

  const pattern = [
    [2, -38.5, "Padaria Pão Quente", "mercado", card.id],
    [3, -23.4, "Uber", "transporte", card.id, "Chuva, não deu pra ir de ônibus"],
    [4, -186.2, "Supermercado BH", "mercado", nu.id, "Compra do mês"],
    [6, -42.9, "iFood", "comida", card.id],
    [8, -18.0, "Uber", "transporte", card.id],
    [9, -54.0, "Drogaria Araujo", "saude", nu.id],
    [11, -39.9, "iFood", "comida", card.id, "Preguiça de cozinhar"],
    [13, -129.9, "Shopee", "compras", card.id, "Suporte de monitor"],
    [14, -16.5, "Uber", "transporte", card.id],
    [16, -67.0, "Cinema", "lazer", card.id, "Aniversário da Ana"],
    [18, -95.3, "Supermercado BH", "mercado", nu.id],
    [21, -31.0, "Padaria Pão Quente", "mercado", card.id],
    [23, -44.9, "iFood", "comida", card.id],
    [25, -12.0, "Uber", "transporte", card.id],
    [27, -60.0, "Barbearia do Zé", "pessoal", nu.id],
  ];

  for (let back = 3; back >= 0; back--) {
    const p = addMonths(cur, -back);
    for (const f of s.fixed) {
      if (back === 0 && f.day > day) continue;
      add(p, f.day, f.kind === "income" ? f.amount : -f.amount, f.name, f.categoryId, f.accountId, "", { fixedId: f.id });
    }
    for (const [dd, v, m, c, a, note] of pattern) {
      if (back === 0 && dd > day) continue;
      const jitter = back === 0 ? 1 : 0.8 + ((dd * 7 + back * 13) % 40) / 100;
      add(p, dd, Math.round(v * jitter * 100) / 100, m, c, a, back === 0 ? note : "");
    }
  }
  s.transactions = tx;

  const nextM = addMonths(cur, 1);
  s.plans = [
    { id: uid(), name: "Presente de aniversário da mãe", amount: 150, date: dayInMonth(cur.y, cur.m, Math.min(day + 6, 28)), categoryId: "presentes", certainty: "sure", done: false },
    { id: uid(), name: "Show no Mineirão", amount: 280, date: dayInMonth(nextM.y, nextM.m, 18), categoryId: "lazer", certainty: "maybe", done: false, note: "Se sobrar grana" },
    { id: uid(), name: "Rematrícula PUC", amount: 450, date: dayInMonth(nextM.y, nextM.m, 8), categoryId: "educacao", certainty: "sure", done: false },
  ];

  s.wishes = [
    { id: uid(), name: "Monitor ultrawide", price: 1899, saved: 650, priority: 1, link: "", note: "Pra programar melhor" },
    { id: uid(), name: "Teclado mecânico", price: 420, saved: 420, priority: 2, link: "" },
    { id: uid(), name: "Viagem pra Ouro Preto", price: 900, saved: 120, priority: 3, link: "" },
  ];

  s.categories = s.categories.map((c) => ({ ...c, budget: { comida: 150, mercado: 400, transporte: 100, lazer: 120 }[c.id] || 0 }));
  return s;
}
