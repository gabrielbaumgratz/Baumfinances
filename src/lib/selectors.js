import { addMonths, dayInMonth, daysInMonth, isoMonthKey, monthKey, today, daysUntil, fromISO } from "./dates.js";

const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);

export const txInMonth = (txs, { y, m }) => {
  const key = monthKey(y, m);
  return txs.filter((t) => isoMonthKey(t.date) === key);
};

export function accountBalance(account, txs, upTo = today()) {
  return (account.initial || 0) + sum(txs.filter((t) => t.accountId === account.id && t.date <= upTo), (t) => t.amount);
}

export function totalBalance(state, upTo = today()) {
  return sum(state.accounts.filter((a) => !a.hidden), (a) => accountBalance(a, state.transactions, upTo));
}

export function monthSummary(txs) {
  const income = sum(txs.filter((t) => t.amount > 0), (t) => t.amount);
  const expense = -sum(txs.filter((t) => t.amount < 0), (t) => t.amount);
  return { income, expense, net: income - expense };
}

/** Each active recurring item for a month, with its due date and the transaction that paid it (if any). */
export function fixedForMonth(state, ym) {
  const key = monthKey(ym.y, ym.m);
  return state.fixed
    .filter((f) => f.active !== false && (!f.startMonth || f.startMonth <= key))
    .map((f) => {
      const paidTx = state.transactions.find((t) => t.fixedId === f.id && isoMonthKey(t.date) === key);
      return { item: f, due: dayInMonth(ym.y, ym.m, f.day || 1), paidTx };
    })
    .sort((a, b) => a.due.localeCompare(b.due));
}

export const signedFixed = (f) => (f.kind === "income" ? 1 : -1) * Math.abs(f.amount);

/**
 * Projected balance at the end of the month:
 * balance today + pending recurring items + confirmed plans not done yet (this month).
 * "maybe" plans are returned separately so the UI can show a range.
 */
export function projection(state, ym, ref = today()) {
  const end = dayInMonth(ym.y, ym.m, 31);
  const base = totalBalance(state, ref);
  const futureTx = sum(state.transactions.filter((t) => t.date > ref && t.date <= end && !state.accounts.find((a) => a.id === t.accountId)?.hidden), (t) => t.amount);
  const pendingFixed = sum(
    fixedForMonth(state, ym).filter((x) => !x.paidTx && x.due >= ref.slice(0, 8) + "01"),
    (x) => signedFixed(x.item),
  );
  const open = state.plans.filter((p) => !p.done && p.date >= ref.slice(0, 8) + "01" && p.date <= end);
  const sure = -sum(open.filter((p) => p.certainty !== "maybe"), (p) => Math.abs(p.amount));
  const maybe = -sum(open.filter((p) => p.certainty === "maybe"), (p) => Math.abs(p.amount));
  const expected = base + futureTx + pendingFixed + sure;
  return { base, pendingFixed, sure, maybe, expected, worst: expected + maybe };
}

export function byCategory(txs, categories) {
  const map = new Map();
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const c = map.get(t.categoryId) || { id: t.categoryId, total: 0, count: 0 };
    c.total += -t.amount;
    c.count += 1;
    map.set(t.categoryId, c);
  }
  return [...map.values()]
    .map((c) => ({ ...c, category: categories.find((x) => x.id === c.id) || { id: c.id, name: "Sem categoria", icon: "dots" } }))
    .sort((a, b) => b.total - a.total);
}

/** Where did I spend: total, number of visits and average ticket per merchant. */
export function byMerchant(txs) {
  const map = new Map();
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const name = (t.merchant || t.description || "Sem nome").trim();
    const key = name.toLowerCase();
    const m = map.get(key) || { name, total: 0, count: 0, last: t.date, categoryId: t.categoryId };
    m.total += -t.amount;
    m.count += 1;
    if (t.date > m.last) m.last = t.date;
    map.set(key, m);
  }
  return [...map.values()].map((m) => ({ ...m, avg: m.total / m.count })).sort((a, b) => b.total - a.total);
}

export function byAccount(txs, accounts) {
  return accounts
    .map((a) => {
      const own = txs.filter((t) => t.accountId === a.id);
      return { account: a, ...monthSummary(own) };
    })
    .filter((x) => x.income || x.expense);
}

export function byDay(txs, { y, m }) {
  const days = Array.from({ length: daysInMonth(y, m) }, (_, i) => ({ day: i + 1, total: 0 }));
  for (const t of txs) if (t.amount < 0) days[fromISO(t.date).getDate() - 1].total += -t.amount;
  return days;
}

export function lastMonths(state, ym, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const p = addMonths(ym, i - n + 1);
    return { ...p, ...monthSummary(txInMonth(state.transactions, p)) };
  });
}

/** Things coming up in the next `days` days: unpaid recurring bills and open plans. */
export function upcoming(state, days = 30, ref = today()) {
  const d = fromISO(ref);
  const ym = { y: d.getFullYear(), m: d.getMonth() };
  const items = [];
  for (const p of [ym, addMonths(ym, 1)]) {
    for (const x of fixedForMonth(state, p)) {
      const dd = daysUntil(x.due, ref);
      if (!x.paidTx && dd <= days && (dd >= -5 || p === ym)) {
        items.push({ type: "fixed", id: x.item.id + x.due, date: x.due, name: x.item.name, amount: signedFixed(x.item), ref: x.item, overdue: dd < 0 });
      }
    }
  }
  for (const p of state.plans) {
    const dd = daysUntil(p.date, ref);
    if (!p.done && dd <= days) items.push({ type: "plan", id: p.id, date: p.date, name: p.name, amount: -Math.abs(p.amount), ref: p, overdue: dd < 0, maybe: p.certainty === "maybe" });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function budgetUsage(state, ym) {
  const cats = byCategory(txInMonth(state.transactions, ym), state.categories);
  return state.categories
    .filter((c) => c.budget > 0)
    .map((c) => ({ category: c, budget: c.budget, spent: cats.find((x) => x.id === c.id)?.total || 0 }));
}
