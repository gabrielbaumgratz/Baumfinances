import { useMemo, useState } from "react";
import { useStore, useHide } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { addMonths, MONTHS, MONTHS_SHORT, today, relativeDay } from "../lib/dates.js";
import { byAccount, byCategory, byDay, byMerchant, lastMonths, monthSummary, txInMonth } from "../lib/selectors.js";
import { fmt } from "../lib/format.js";
import Money from "../components/Money.jsx";
import MonthSwitcher from "../components/MonthSwitcher.jsx";
import TxRow from "../components/TxRow.jsx";
import { Dot, Empty, Meter, SectionHead, Seg } from "../components/ui.jsx";

const cap = (s) => s[0].toUpperCase() + s.slice(1);

export default function Insights() {
  const { state } = useStore();
  const hide = useHide();
  const d = new Date();
  const [ym, setYm] = useState({ y: d.getFullYear(), m: d.getMonth() });
  const [catFilter, setCatFilter] = useState("");

  const data = useMemo(() => {
    const txs = txInMonth(state.transactions, ym).filter((t) => t.date <= today());
    const sum = monthSummary(txs);
    const prevSum = monthSummary(txInMonth(state.transactions, addMonths(ym, -1)));
    const days = byDay(txs, ym);
    const isCur = ym.y === d.getFullYear() && ym.m === d.getMonth();
    return {
      txs, sum, prevSum, days, isCur,
      elapsed: isCur ? d.getDate() : days.length,
      biggest: txs.filter((t) => t.amount < 0).sort((a, b) => a.amount - b.amount)[0],
      cats: byCategory(txs, state.categories),
      merchants: byMerchant(txs),
      accounts: byAccount(txs, state.accounts),
      months: lastMonths(state, ym, 6),
    };
  }, [state, ym]); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = data.prevSum.expense ? ((data.sum.expense - data.prevSum.expense) / data.prevSum.expense) * 100 : null;
  const prevName = MONTHS[addMonths(ym, -1).m].toLowerCase();

  return (
    <div className="page">
      <header className="top">
        <h1>Análise</h1>
        <div className="spacer" />
        <MonthSwitcher ym={ym} onChange={(v) => { setYm(v); setCatFilter(""); }} />
      </header>

      {data.txs.length === 0 ? (
        <Empty title={`Sem lançamentos em ${MONTHS[ym.m].toLowerCase()}`} text="Quando houver lançamentos, a análise aparece aqui." />
      ) : (
        <div className="stack">
          <div className="figures four">
            <div>
              <div className="label">Saídas</div>
              <div className="v"><Money value={data.sum.expense} /></div>
              {delta !== null && !hide && <div className="d">{Math.abs(Math.round(delta))}% {delta > 0 ? "acima" : "abaixo"} de {prevName}</div>}
            </div>
            <div><div className="label">Entradas</div><div className="v pos"><Money value={data.sum.income} /></div><div className="d">Saldo do mês <Money value={data.sum.net} /></div></div>
            <div><div className="label">Média diária</div><div className="v"><Money value={data.sum.expense / Math.max(1, data.elapsed)} /></div><div className="d">{data.elapsed} dias</div></div>
            <div><div className="label">Maior gasto</div><div className="v"><Money value={data.biggest ? -data.biggest.amount : 0} /></div><div className="d" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.biggest?.merchant || "Nenhum"}</div></div>
          </div>

          <section>
            <SectionHead title="Saídas por dia" />
            <DayBars days={data.days} hide={hide} />
          </section>

          <div className="cols">
            <section>
              <SectionHead title="Por categoria">{catFilter && <button onClick={() => setCatFilter("")}>Limpar filtro</button>}</SectionHead>
              <div className="list">
                {data.cats.map((c) => {
                  const p = (c.total / data.sum.expense) * 100;
                  const on = catFilter === c.id;
                  return (
                    <button key={c.id} className="item" style={{ display: "block", opacity: catFilter && !on ? 0.45 : 1 }} onClick={() => setCatFilter(on ? "" : c.id)} aria-pressed={on}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <span className="t">{c.category.name}</span>
                        <span className="v"><Money value={c.total} /></span>
                      </div>
                      <Meter value={p} />
                      <div className="m row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                        <span>{c.count} {c.count === 1 ? "lançamento" : "lançamentos"}</span><span>{Math.round(p)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="stack">
              <Merchants list={catFilter ? data.merchants.filter((m) => m.categoryId === catFilter) : data.merchants} txs={data.txs} />
              {data.accounts.length > 0 && (
                <section>
                  <SectionHead title="Por conta" />
                  <div className="list">
                    {data.accounts.map(({ account, income, expense }) => (
                      <div key={account.id} className="item">
                        <Dot color={account.color} />
                        <div className="body"><div className="t">{account.name}</div><div className="m">{account.bank}</div></div>
                        <div className="v"><Money value={-expense} signed />{income > 0 && <small className="pos"><Money value={income} signed /></small>}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <section>
            <SectionHead title="Saídas nos últimos 6 meses" />
            <MonthBars months={data.months} cur={ym} hide={hide} />
          </section>
        </div>
      )}
    </div>
  );
}

function DayBars({ days, hide }) {
  const [on, setOn] = useState(null);
  const max = Math.max(1, ...days.map((x) => x.total));
  return (
    <>
      <div className="bars" role="list" onMouseLeave={() => setOn(null)}>
        {days.map((x) => (
          <div key={x.day} role="listitem" tabIndex={0} className={`b${on === x.day ? " on" : ""}`} aria-label={`Dia ${x.day}: ${fmt(x.total)}`}
            onMouseEnter={() => setOn(x.day)} onFocus={() => setOn(x.day)} onBlur={() => setOn(null)} onClick={() => setOn(on === x.day ? null : x.day)}>
            <i style={{ height: `${(x.total / max) * 100}%` }} />
            {on === x.day && <span className="tip">Dia {x.day}: {hide ? "oculto" : fmt(x.total)}</span>}
          </div>
        ))}
      </div>
      <div className="axis"><span>1</span><span>10</span><span>20</span><span>{days.length}</span></div>
    </>
  );
}

function MonthBars({ months, cur, hide }) {
  const [on, setOn] = useState(null);
  const max = Math.max(1, ...months.map((x) => x.expense));
  return (
    <div className="months" role="list">
      {months.map((x, i) => {
        const isCur = x.y === cur.y && x.m === cur.m;
        return (
          <div key={i} role="listitem" tabIndex={0} className={`c${isCur ? " on" : ""}`} aria-label={`${MONTHS[x.m]}: ${fmt(x.expense)}`}
            onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}>
            {on === i && <span className="tip">{hide ? "oculto" : fmt(x.expense)}</span>}
            <i style={{ height: `${(x.expense / max) * 85}%` }} />
            <span>{cap(MONTHS_SHORT[x.m])}</span>
          </div>
        );
      })}
    </div>
  );
}

function Merchants({ list, txs }) {
  const [sort, setSort] = useState("total");
  const [open, setOpen] = useState(null);
  const ui = useUI();
  const ref = today();
  const sorted = [...list].sort((a, b) => (sort === "count" ? b.count - a.count || b.total - a.total : b.total - a.total)).slice(0, 12);
  return (
    <section>
      <SectionHead title="Estabelecimentos" />
      <div style={{ marginBottom: 12 }}>
        <Seg value={sort} onChange={setSort} label="Ordenar por" options={[{ value: "total", label: "Maior valor" }, { value: "count", label: "Mais frequentes" }]} />
      </div>
      <div className="list">
        {sorted.map((m) => {
          const isOpen = open === m.name;
          return (
            <div key={m.name}>
              <button className="item" onClick={() => setOpen(isOpen ? null : m.name)} aria-expanded={isOpen}>
                <div className="body">
                  <div className="t">{m.name}</div>
                  <div className="m">{m.count} {m.count === 1 ? "vez" : "vezes"} no mês, média de <Money value={m.avg} /></div>
                </div>
                <div className="v"><Money value={m.total} /></div>
              </button>
              {isOpen && (
                <div style={{ paddingLeft: 16, borderLeft: "2px solid var(--line-strong)" }}>
                  {txs.filter((t) => t.amount < 0 && (t.merchant || t.description || "").trim().toLowerCase() === m.name.toLowerCase())
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((t) => <TxRow key={t.id} tx={t} date={cap(relativeDay(t.date, ref))} onClick={() => ui.open("tx", { item: t })} />)}
                </div>
              )}
            </div>
          );
        })}
        {!sorted.length && <Empty title="Nenhum estabelecimento" />}
      </div>
    </section>
  );
}
