import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { monthSummary, txInMonth } from "../lib/selectors.js";
import { relativeDay, today, MONTHS } from "../lib/dates.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import TxRow from "../components/TxRow.jsx";
import MonthSwitcher from "../components/MonthSwitcher.jsx";
import { Dot, Empty } from "../components/ui.jsx";

const strip = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const cap = (s) => s[0].toUpperCase() + s.slice(1);

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
  const filtering = q || accId || catId || kind !== "all";

  return (
    <div className="page narrow">
      <header className="top">
        <h1>Extrato</h1>
        <div className="spacer" />
        <button className="btn sm ghost" onClick={() => ui.open("import")}><Icon name="upload" size={16} />Importar</button>
      </header>

      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", marginBottom: 16, marginLeft: -10 }}>
        <MonthSwitcher ym={ym} onChange={setYm} />
        <div className="figures" style={{ gridTemplateColumns: "auto auto", borderTop: 0 }}>
          <div style={{ paddingTop: 0 }}><div className="label">Entradas</div><div className="v pos"><Money value={sum.income} /></div></div>
          <div style={{ paddingTop: 0 }}><div className="label">Saídas</div><div className="v"><Money value={sum.expense} /></div></div>
        </div>
      </div>

      <div className="search" style={{ marginBottom: 12 }}>
        <Icon name="search" size={16} />
        <input className="input" type="search" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar lançamentos" />
      </div>

      <div className="chips" role="group" aria-label="Filtros" style={{ marginBottom: 8 }}>
        {[["all", "Todos"], ["out", "Saídas"], ["in", "Entradas"]].map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={kind === v} onClick={() => setKind(v)}>{l}</button>
        ))}
        {state.accounts.map((a) => (
          <button key={a.id} className="chip" aria-pressed={accId === a.id} onClick={() => go("extrato", accId === a.id ? "" : a.id)}>
            <Dot color={a.color} />{a.name}
          </button>
        ))}
      </div>
      {usedCats.length > 1 && (
        <div className="chips" role="group" aria-label="Categorias" style={{ marginBottom: 24 }}>
          {usedCats.map((id) => (
            <button key={id} className="chip" aria-pressed={catId === id} onClick={() => setCatId(catId === id ? "" : id)}>
              {state.categories.find((x) => x.id === id)?.name || "Sem categoria"}
            </button>
          ))}
        </div>
      )}

      {groups.length ? (
        <div>
          {groups.map(([date, items]) => (
            <div key={date}>
              <div className="group-head">
                <span>{cap(relativeDay(date, ref))}{date > ref ? ", agendado" : ""}</span>
                <span className="num"><Money value={items.reduce((s, t) => s + t.amount, 0)} signed /></span>
              </div>
              {items.map((t) => <TxRow key={t.id} tx={t} onClick={() => ui.open("tx", { item: t })} />)}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="Nenhum lançamento" text={filtering ? "Nenhum resultado para os filtros escolhidos." : `Nada registrado em ${MONTHS[ym.m].toLowerCase()}.`} />
      )}
    </div>
  );
}
