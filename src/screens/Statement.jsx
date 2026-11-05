import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { monthSummary, txInMonth } from "../lib/selectors.js";
import { relativeDay, today, fromISO } from "../lib/dates.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import TxRow from "../components/TxRow.jsx";
import MonthSwitcher from "../components/MonthSwitcher.jsx";
import { Empty } from "../components/ui.jsx";

const strip = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Statement({ sub, go }) {
  const { state } = useStore();
  const ui = useUI();
  const d = new Date();
  const [ym, setYm] = useState({ y: d.getFullYear(), m: d.getMonth() });
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [catId, setCatId] = useState("");
  const accId = state.accounts.some((a) => a.id === sub) ? sub : "";

  const filtered = useMemo(() => {
    const nq = strip(q.trim());
    return txInMonth(state.transactions, ym)
      .filter((t) => (!accId || t.accountId === accId) && (!catId || t.categoryId === catId))
      .filter((t) => (kind === "in" ? t.amount > 0 : kind === "out" ? t.amount < 0 : true))
      .filter((t) => !nq || strip(`${t.merchant} ${t.description} ${t.note}`).includes(nq))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, ym, accId, catId, kind, q]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const t of filtered) m.set(t.date, [...(m.get(t.date) || []), t]);
    return [...m.entries()];
  }, [filtered]);

  const sum = monthSummary(filtered);
  const usedCats = [...new Set(txInMonth(state.transactions, ym).map((t) => t.categoryId))];
  const ref = today();

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <header className="top">
        <h1>Extrato</h1>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => ui.open("import")} aria-label="Importar extrato"><Icon name="upload" /></button>
      </header>

      <div className="stack" style={{ gap: 12 }}>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <MonthSwitcher ym={ym} onChange={setYm} />
          <div className="spacer" />
          <div className="num" style={{ fontSize: "0.88rem", color: "var(--muted)", textAlign: "right" }}>
            <span className="pos"><Money value={sum.income} /></span> entrou · <Money value={sum.expense} /> saiu
          </div>
        </div>

        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder="Buscar por lugar, descrição ou nota" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        </div>

        <div className="chips" role="group" aria-label="Filtros">
          {[["all", "Tudo"], ["out", "Saídas"], ["in", "Entradas"]].map(([v, l]) => (
            <button key={v} className="chip" aria-pressed={kind === v} onClick={() => setKind(v)}>{l}</button>
          ))}
          <span style={{ width: 1, background: "var(--line-strong)", margin: "6px 2px" }} />
          {state.accounts.map((a) => (
            <button key={a.id} className="chip" aria-pressed={accId === a.id} onClick={() => go("extrato", accId === a.id ? "" : a.id)}>
              <span className="dot" style={{ background: a.color }} />{a.name}
            </button>
          ))}
        </div>
        {usedCats.length > 1 && (
          <div className="chips" role="group" aria-label="Categorias">
            {usedCats.map((id) => {
              const c = state.categories.find((x) => x.id === id);
              return (
                <button key={id} className="chip" aria-pressed={catId === id} onClick={() => setCatId(catId === id ? "" : id)}>
                  <Icon name={c?.icon} size={16} />{c?.name || "Sem categoria"}
                </button>
              );
            })}
          </div>
        )}

        <section className="card card-flat">
          {groups.length ? (
            <div className="list">
              {groups.map(([date, items]) => (
                <div key={date}>
                  <div className="day-head">
                    <span>{(() => { const r = relativeDay(date, ref); return r[0].toUpperCase() + r.slice(1); })()}{date > ref && " · agendado"}</span>
                    <Money value={items.reduce((s, t) => s + t.amount, 0)} signed />
                  </div>
                  {items.map((t) => <TxRow key={t.id} tx={t} onClick={() => ui.open("tx", { item: t })} />)}
                </div>
              ))}
            </div>
          ) : (
            <Empty icon="search" title="Nenhum lançamento" text={q || accId || catId || kind !== "all" ? "Tenta tirar algum filtro." : `Nada registrado em ${fromISO(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}-01`).toLocaleDateString("pt-BR", { month: "long" })}.`} />
          )}
        </section>
      </div>
    </div>
  );
}
