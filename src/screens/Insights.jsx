import { useMemo, useState } from "react";
import { useStore, useHide, useLookup } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { addMonths, MONTHS, MONTHS_SHORT, today, relativeDay } from "../lib/dates.js";
import { byAccount, byCategory, byDay, byMerchant, lastMonths, monthSummary, txInMonth } from "../lib/selectors.js";
import { fmt } from "../lib/format.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import MonthSwitcher from "../components/MonthSwitcher.jsx";
import TxRow from "../components/TxRow.jsx";
import { AccChip, CatIcon, Empty, Meter, Seg } from "../components/ui.jsx";

export default function Insights() {
  const { state } = useStore();
  const hide = useHide();
  const d = new Date();
  const [ym, setYm] = useState({ y: d.getFullYear(), m: d.getMonth() });
  const [catFilter, setCatFilter] = useState("");

  const data = useMemo(() => {
    const txs = txInMonth(state.transactions, ym).filter((t) => t.date <= today());
    const prev = txInMonth(state.transactions, addMonths(ym, -1));
    const sum = monthSummary(txs);
    const prevSum = monthSummary(prev);
    const days = byDay(txs, ym);
    const isCur = ym.y === d.getFullYear() && ym.m === d.getMonth();
    const elapsed = isCur ? d.getDate() : days.length;
    const biggest = txs.filter((t) => t.amount < 0).sort((a, b) => a.amount - b.amount)[0];
    return {
      txs, sum, prevSum, days, elapsed, biggest, isCur,
      cats: byCategory(txs, state.categories),
      merchants: byMerchant(txs),
      accounts: byAccount(txs, state.accounts),
      months: lastMonths(state, ym, 6),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ym]);

  const delta = data.prevSum.expense ? ((data.sum.expense - data.prevSum.expense) / data.prevSum.expense) * 100 : null;
  const merchants = catFilter ? data.merchants.filter((m) => m.categoryId === catFilter) : data.merchants;

  return (
    <div className="page">
      <header className="top">
        <h1>Análise</h1>
        <div className="spacer" />
        <MonthSwitcher ym={ym} onChange={(v) => { setYm(v); setCatFilter(""); }} />
      </header>

      {data.txs.length === 0 ? (
        <section className="card"><Empty icon="chart" title={`Sem dados em ${MONTHS[ym.m].toLowerCase()}`} text="Quando tiver lançamentos, aqui aparece pra onde seu dinheiro foi." /></section>
      ) : (
        <div className="stack">
          <div className="kpis">
            <div className="kpi">
              <div className="k">Gastou</div>
              <div className="v"><Money value={data.sum.expense} /></div>
              {delta !== null && !hide && (
                <div className="d" style={{ color: delta > 0 ? "var(--danger)" : "var(--pos)" }}>
                  {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}% vs {MONTHS_SHORT[addMonths(ym, -1).m]}
                  {data.isCur && <span style={{ color: "var(--muted)" }}> (mês em curso)</span>}
                </div>
              )}
            </div>
            <div className="kpi">
              <div className="k">Recebeu</div>
              <div className="v pos"><Money value={data.sum.income} /></div>
              <div className="d">sobrou <Money value={data.sum.net} /></div>
            </div>
            <div className="kpi">
              <div className="k">Média por dia</div>
              <div className="v"><Money value={data.sum.expense / Math.max(1, data.elapsed)} /></div>
              <div className="d">em {data.elapsed} dias</div>
            </div>
            <div className="kpi">
              <div className="k">Maior gasto</div>
              <div className="v"><Money value={data.biggest ? -data.biggest.amount : 0} /></div>
              <div className="d" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.biggest?.merchant || "—"}</div>
            </div>
          </div>

          <section className="card">
            <div className="card-title"><h2>Gastos por dia</h2></div>
            <DayBars days={data.days} today={data.isCur ? d.getDate() : null} hide={hide} />
          </section>

          <div className="grid-2">
            <section className="card">
              <div className="card-title"><h2>Por categoria</h2><span className="hint">toque pra filtrar os lugares</span></div>
              <div className="stack" style={{ gap: 4 }}>
                {data.cats.map((c) => {
                  const p = (c.total / data.sum.expense) * 100;
                  const on = catFilter === c.id;
                  return (
                    <button key={c.id} className="item" style={{ padding: "10px 8px", minHeight: 0, boxShadow: "none", background: on ? "var(--surface-2)" : undefined }}
                      onClick={() => setCatFilter(on ? "" : c.id)} aria-pressed={on}>
                      <CatIcon cat={c.category} size={38} />
                      <div className="main-col">
                        <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                          <span className="title" style={{ fontSize: "0.92rem" }}>{c.category.name}</span>
                          <span className="num" style={{ fontWeight: 600, fontSize: "0.92rem" }}><Money value={c.total} /></span>
                        </div>
                        <Meter value={p} />
                        <div className="meta" style={{ marginTop: 4, justifyContent: "space-between" }}>
                          <span>{c.count} {c.count === 1 ? "lançamento" : "lançamentos"}</span>
                          <span>{Math.round(p)}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="stack">
              <Merchants list={merchants} filter={catFilter ? data.cats.find((c) => c.id === catFilter)?.category : null} onClear={() => setCatFilter("")} txs={data.txs} />

              {data.accounts.length > 0 && (
                <section className="card card-flat">
                  <div className="card-title" style={{ padding: "14px 14px 0" }}><h2>Por conta</h2></div>
                  <div className="list">
                    {data.accounts.map(({ account, income, expense }) => (
                      <div key={account.id} className="item">
                        <AccChip acc={account} size={38} />
                        <div className="main-col">
                          <div className="title">{account.name}</div>
                          <div className="meta">{account.bank}</div>
                        </div>
                        <div className="amt">
                          <Money value={-expense} signed />
                          {income > 0 && <small className="pos"><Money value={income} signed /></small>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <section className="card">
            <div className="card-title"><h2>Últimos 6 meses</h2><span className="hint">gastos</span></div>
            <MonthBars months={data.months} cur={ym} hide={hide} />
          </section>
        </div>
      )}
    </div>
  );
}

function DayBars({ days, today: td, hide }) {
  const [on, setOn] = useState(null);
  const max = Math.max(1, ...days.map((x) => x.total));
  return (
    <>
      <div className="bars" role="list" onMouseLeave={() => setOn(null)}>
        {days.map((x) => (
          <div key={x.day} role="listitem" tabIndex={0}
            className={`b${on === x.day ? " on" : ""}${td === x.day ? " today" : ""}`}
            aria-label={`Dia ${x.day}: ${fmt(x.total)}`}
            onMouseEnter={() => setOn(x.day)} onFocus={() => setOn(x.day)} onBlur={() => setOn(null)} onClick={() => setOn(on === x.day ? null : x.day)}>
            <i style={{ height: `${(x.total / max) * 100}%` }} />
            {on === x.day && <span className="tip">Dia {x.day} · {hide ? "R$ ••••" : fmt(x.total)}</span>}
          </div>
        ))}
      </div>
      <div className="bar-axis"><span>1</span><span>10</span><span>20</span><span>{days.length}</span></div>
    </>
  );
}

function MonthBars({ months, cur, hide }) {
  const [on, setOn] = useState(null);
  const max = Math.max(1, ...months.map((x) => x.expense));
  return (
    <div className="col-bars" role="list">
      {months.map((x, i) => {
        const isCur = x.y === cur.y && x.m === cur.m;
        return (
          <div key={i} role="listitem" tabIndex={0} className={`c${isCur ? " on" : ""}`} aria-label={`${MONTHS[x.m]}: ${fmt(x.expense)}`}
            onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
            {on === i && <span className="tip">{hide ? "R$ ••••" : fmt(x.expense)}</span>}
            {(isCur || on === i) && !hide && <em className="num">{Math.round(x.expense).toLocaleString("pt-BR")}</em>}
            <i style={{ height: `${(x.expense / max) * 82}%` }} />
            <span>{MONTHS_SHORT[x.m]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Merchants({ list, filter, onClear, txs }) {
  const [sort, setSort] = useState("total");
  const [open, setOpen] = useState(null);
  const ui = useUI();
  const sorted = [...list].sort((a, b) => (sort === "count" ? b.count - a.count || b.total - a.total : b.total - a.total)).slice(0, 12);
  const ref = today();
  return (
    <section className="card card-flat">
      <div className="card-title" style={{ padding: "14px 14px 0", flexWrap: "wrap" }}>
        <h2>Onde você gastou</h2>
        {filter && <button className="chip" aria-pressed="true" style={{ minHeight: 30, fontSize: "0.8rem" }} onClick={onClear}>{filter.name}<Icon name="x" size={14} /></button>}
      </div>
      <div style={{ padding: "0 14px 8px" }}>
        <Seg value={sort} onChange={setSort} label="Ordenar" options={[{ value: "total", label: "Mais gasto" }, { value: "count", label: "Mais vezes" }]} />
      </div>
      <div className="list">
        {sorted.map((m) => {
          const isOpen = open === m.name;
          return (
            <div key={m.name}>
              <button className="item" onClick={() => setOpen(isOpen ? null : m.name)} aria-expanded={isOpen}>
                <div className="ico-tile"><Icon name="store" /></div>
                <div className="main-col">
                  <div className="title">{m.name}</div>
                  <div className="meta"><b style={{ color: "var(--ink)", fontWeight: 600 }}>{m.count}×</b><span>no mês · média <Money value={m.avg} /></span></div>
                </div>
                <div className="amt"><Money value={m.total} /></div>
              </button>
              {isOpen && (
                <div style={{ background: "var(--surface-2)", borderRadius: 14, margin: "0 6px 6px" }}>
                  {txs.filter((t) => (t.merchant || t.description || "").trim().toLowerCase() === m.name.toLowerCase() && t.amount < 0)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((t) => <TxRow key={t.id} tx={t} showDate={relativeDay(t.date, ref)} onClick={() => ui.open("tx", { item: t })} />)}
                </div>
              )}
            </div>
          );
        })}
        {!sorted.length && <Empty icon="store" title="Nada aqui" />}
      </div>
    </section>
  );
}
