import { useMemo } from "react";
import { useStore, useLookup } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { accountBalance, budgetUsage, monthSummary, projection, totalBalance, txInMonth, upcoming } from "../lib/selectors.js";
import { relativeDay, today, fromISO } from "../lib/dates.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import TxRow from "../components/TxRow.jsx";
import { Dot, Empty, Meter, SectionHead } from "../components/ui.jsx";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};
const TYPE = { checking: "Conta corrente", savings: "Reserva", credit: "Cartão de crédito", cash: "Dinheiro" };
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export default function Home({ go }) {
  const { state, setSettings } = useStore();
  const ui = useUI();
  const ref = today();
  const d = fromISO(ref);
  const ym = { y: d.getFullYear(), m: d.getMonth() };

  const data = useMemo(() => ({
    total: totalBalance(state, ref),
    sum: monthSummary(txInMonth(state.transactions, ym).filter((t) => t.date <= ref)),
    proj: projection(state, ym, ref),
    next: upcoming(state, 21, ref).slice(0, 5),
    recent: state.transactions.filter((t) => t.date <= ref).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    budgets: budgetUsage(state, ym).sort((a, b) => b.spent / b.budget - a.spent / a.budget).slice(0, 4),
  }), [state, ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const hide = state.settings.hideValues;
  const name = state.settings.name?.trim().split(" ")[0];

  return (
    <div className="page">
      <header className="top">
        <div>
          <div className="eyebrow">{greeting()}{name ? `, ${name}` : ""}</div>
          <h1>Início</h1>
        </div>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => setSettings({ hideValues: !hide })} aria-label={hide ? "Mostrar valores" : "Ocultar valores"}>
          <Icon name={hide ? "eyeOff" : "eye"} size={20} stroke={1.6} />
        </button>
      </header>

      <div className="cols">
        <div className="stack">
          <section className="balance" aria-label="Saldo">
            <div className="label">Saldo total</div>
            <div className="value"><Money value={data.total} split /></div>
            <div className="figures three">
              <div><div className="label">Entradas no mês</div><div className="v"><Money value={data.sum.income} /></div></div>
              <div><div className="label">Saídas no mês</div><div className="v"><Money value={data.sum.expense} /></div></div>
              <div>
                <div className="label">Previsto no fim do mês</div>
                <div className="v"><Money value={data.proj.expected} /></div>
                {data.proj.maybe < 0 && <div className="d">Com incertos: <Money value={data.proj.worst} /></div>}
              </div>
            </div>
          </section>

          <section>
            <SectionHead title="Contas"><button onClick={() => ui.open("account")}>Adicionar</button></SectionHead>
            {state.accounts.length ? (
              <div className="list">
                {state.accounts.map((a) => (
                  <button key={a.id} className="item" onClick={() => go("extrato", a.id)}>
                    <Dot color={a.color} />
                    <div className="body"><div className="t">{a.name}</div><div className="m">{a.bank || TYPE[a.type]}</div></div>
                    <div className="v"><Money value={accountBalance(a, state.transactions, ref)} /></div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty title="Nenhuma conta" text="Adicione suas contas e cartões para ver o saldo total." action={<button className="btn sm" onClick={() => ui.open("account")}>Adicionar conta</button>} />
            )}
          </section>

          <section>
            <SectionHead title="Últimos lançamentos"><a href="#/extrato" onClick={(e) => { e.preventDefault(); go("extrato"); }}>Ver extrato</a></SectionHead>
            {data.recent.length ? (
              <div className="list">
                {data.recent.map((t) => <TxRow key={t.id} tx={t} date={cap(relativeDay(t.date, ref))} onClick={() => ui.open("tx", { item: t })} />)}
              </div>
            ) : (
              <Empty title="Nenhum lançamento" text="Registre um gasto ou importe o extrato do seu banco." action={
                <div className="btn-row" style={{ maxWidth: 320 }}>
                  <button className="btn sm" onClick={() => ui.open("tx")}>Registrar</button>
                  <button className="btn sm ghost" onClick={() => ui.open("import")}>Importar</button>
                </div>} />
            )}
          </section>
        </div>

        <div className="stack">
          <section>
            <SectionHead title="Próximos"><a href="#/planejamento" onClick={(e) => { e.preventDefault(); go("planejamento"); }}>Planejamento</a></SectionHead>
            {data.next.length ? (
              <div className="list">
                {data.next.map((x) => (
                  <button key={x.id} className="item" onClick={() => ui.open(x.type === "fixed" ? "fixed" : "plan", { item: x.ref, due: x.date })}>
                    <div className="body">
                      <div className="t">{x.name}</div>
                      <div className="m row" style={{ gap: 10 }}>
                        <span className={x.overdue ? "danger-text" : ""}>{x.overdue ? "Atrasado" : cap(relativeDay(x.date, ref))}</span>
                        <span>{x.type === "fixed" ? "Fixo" : x.maybe ? "Incerto" : "Planejado"}</span>
                      </div>
                    </div>
                    <div className={`v ${x.amount > 0 ? "pos" : ""}`}><Money value={x.amount} signed /></div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty title="Nada nas próximas semanas" text="Cadastre gastos fixos e planos para acompanhar o que vem pela frente." />
            )}
          </section>

          {data.budgets.length > 0 && (
            <section>
              <SectionHead title="Limites do mês"><a href="#/analise" onClick={(e) => { e.preventDefault(); go("analise"); }}>Análise</a></SectionHead>
              <div className="list">
                {data.budgets.map(({ category, budget, spent }) => {
                  const p = (spent / budget) * 100;
                  return (
                    <div key={category.id} className="item" style={{ display: "block" }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                        <span className="t">{category.name}</span>
                        <span className="m num" style={{ margin: 0 }}>{hide ? "" : `${Math.round(p)}% de `}<Money value={budget} /></span>
                      </div>
                      <Meter value={p} tone={p >= 100 ? "danger" : p >= 80 ? "warn" : ""} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {state.wishes.some((w) => !w.bought) && (
            <section>
              <SectionHead title="Desejos"><a href="#/planejamento/desejos" onClick={(e) => { e.preventDefault(); go("planejamento", "desejos"); }}>Ver todos</a></SectionHead>
              <div className="list">
                {state.wishes.filter((w) => !w.bought).sort((a, b) => (a.priority || 2) - (b.priority || 2)).slice(0, 3).map((w) => (
                  <div key={w.id} className="item" style={{ display: "block" }}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                      <span className="t">{w.name}</span>
                      <span className="m num" style={{ margin: 0 }}><Money value={w.saved || 0} /> de <Money value={w.price} /></span>
                    </div>
                    <Meter value={((w.saved || 0) / w.price) * 100} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
