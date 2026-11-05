import { useMemo } from "react";
import { useStore, useLookup } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { accountBalance, budgetUsage, monthSummary, projection, totalBalance, txInMonth, upcoming } from "../lib/selectors.js";
import { relativeDay, today, fromISO, MONTHS } from "../lib/dates.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import TxRow from "../components/TxRow.jsx";
import { AccChip, CatIcon, Empty, Meter } from "../components/ui.jsx";

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

const ACC_TYPE = { checking: "Conta", savings: "Reserva", credit: "Cartão", cash: "Dinheiro", invest: "Investimento" };

export default function Home({ go }) {
  const { state, setSettings } = useStore();
  const ui = useUI();
  const { cat } = useLookup();
  const ref = today();
  const d = fromISO(ref);
  const ym = { y: d.getFullYear(), m: d.getMonth() };

  const data = useMemo(() => {
    const month = txInMonth(state.transactions, ym);
    return {
      total: totalBalance(state, ref),
      sum: monthSummary(month.filter((t) => t.date <= ref)),
      proj: projection(state, ym, ref),
      next: upcoming(state, 21, ref).slice(0, 5),
      recent: [...state.transactions].filter((t) => t.date <= ref).sort((a, b) => b.date.localeCompare(a.date) || 0).slice(0, 6),
      budgets: budgetUsage(state, ym).sort((a, b) => b.spent / b.budget - a.spent / a.budget).slice(0, 4),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ref]);

  const hide = state.settings.hideValues;
  const name = state.settings.name?.trim();

  return (
    <div className="page">
      <header className="top">
        <div>
          <div className="sub">{greeting()}{name ? `, ${name}` : ""}</div>
          <h1>Início</h1>
        </div>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => setSettings({ hideValues: !hide })} aria-label={hide ? "Mostrar valores" : "Esconder valores"}>
          <Icon name={hide ? "eyeOff" : "eye"} />
        </button>
        <button className="icon-btn" onClick={() => ui.open("settings")} aria-label="Ajustes"><Icon name="settings" /></button>
      </header>

      <div className="grid-2">
        <div className="stack">
          <section className="hero" aria-label="Saldo">
            <div className="hero-label"><Icon name="wallet" size={16} /> Saldo em todas as contas</div>
            <div className="hero-value"><Money value={data.total} split /></div>
            <div className="hero-split">
              <div>
                <div className="k"><Icon name="down" size={14} /> Entrou em {MONTHS[ym.m].toLowerCase()}</div>
                <div className="v"><Money value={data.sum.income} /></div>
              </div>
              <div>
                <div className="k"><Icon name="up" size={14} /> Saiu em {MONTHS[ym.m].toLowerCase()}</div>
                <div className="v"><Money value={data.sum.expense} /></div>
              </div>
            </div>
            <div className="hero-proj">
              <Icon name="target" size={18} />
              <span>
                Fim do mês você deve ter <b><Money value={data.proj.expected} /></b>
                {data.proj.maybe < 0 && <> (ou <Money value={data.proj.worst} /> se rolar os “talvez”)</>}
              </span>
            </div>
          </section>

          <section aria-label="Contas">
            <div className="section-label">Contas</div>
            <div className="accounts">
              {state.accounts.map((a) => (
                <button key={a.id} className="acc-card" onClick={() => go("extrato", a.id)} aria-label={`Ver extrato de ${a.name}`}>
                  <div className="row" style={{ gap: 10 }}>
                    <AccChip acc={a} />
                    <div style={{ minWidth: 0 }}>
                      <div className="name">{a.name}</div>
                      <div className="bank">{a.bank || ACC_TYPE[a.type]}</div>
                    </div>
                  </div>
                  <div className="bal"><Money value={accountBalance(a, state.transactions, ref)} /></div>
                </button>
              ))}
              <button className="acc-card acc-add" onClick={() => ui.open("account")}>
                <Icon name="plus" size={22} />
                <span>Adicionar conta</span>
              </button>
            </div>
          </section>

          <section className="card card-flat">
            <div className="card-title" style={{ padding: "14px 14px 0" }}>
              <h2>Últimos lançamentos</h2>
              <div className="spacer" />
              <button onClick={() => go("extrato")}>Ver tudo</button>
            </div>
            {data.recent.length ? (
              <div className="list">
                {data.recent.map((t) => <TxRow key={t.id} tx={t} showDate={relativeDay(t.date, ref)} onClick={() => ui.open("tx", { item: t })} />)}
              </div>
            ) : (
              <Empty icon="list" title="Nada por aqui ainda" text="Adicione um gasto ou importe o extrato do seu banco."
                action={<div className="btn-row" style={{ width: "100%", maxWidth: 360 }}>
                  <button className="btn sm" onClick={() => ui.open("tx")}>Adicionar</button>
                  <button className="btn sm ghost" onClick={() => ui.open("import")}>Importar</button>
                </div>} />
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card card-flat">
            <div className="card-title" style={{ padding: "14px 14px 0" }}>
              <h2>Vem aí</h2>
              <span className="hint">próximas 3 semanas</span>
              <div className="spacer" />
              <button onClick={() => go("planos")}>Planos</button>
            </div>
            {data.next.length ? (
              <div className="list">
                {data.next.map((x) => (
                  <button key={x.id} className="item" onClick={() => ui.open(x.type === "fixed" ? "fixed" : "plan", { item: x.ref, due: x.date })}>
                    <div className={`ico-tile ${x.overdue ? "danger" : x.type === "fixed" ? "" : "brand"}`}>
                      <Icon name={x.type === "fixed" ? "repeat" : cat(x.ref.categoryId).icon} />
                    </div>
                    <div className="main-col">
                      <div className="title">{x.name}</div>
                      <div className="meta">
                        <span>{relativeDay(x.date, ref)}</span>
                        {x.overdue && <span className="badge danger">atrasado</span>}
                        {x.maybe && <span className="badge warn">talvez</span>}
                        {x.type === "fixed" && !x.overdue && <span className="badge">fixo</span>}
                      </div>
                    </div>
                    <div className={`amt ${x.amount > 0 ? "pos" : ""}`}><Money value={x.amount} signed /></div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty icon="calendar" title="Nada agendado" text="Cadastre gastos fixos e planos pra ver o que vem pela frente." />
            )}
          </section>

          {data.budgets.length > 0 && (
            <section className="card">
              <div className="card-title"><h2>Limites do mês</h2><div className="spacer" /><button onClick={() => go("analise")}>Detalhes</button></div>
              <div className="stack" style={{ gap: 14 }}>
                {data.budgets.map(({ category, budget, spent }) => {
                  const p = (spent / budget) * 100;
                  return (
                    <div key={category.id} className="row" style={{ gap: 12 }}>
                      <CatIcon cat={category} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                          <span style={{ fontWeight: 550, fontSize: "0.92rem" }}>{category.name}</span>
                          <span className="num" style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                            {hide ? "••" : `${Math.round(p)}%`} de <Money value={budget} />
                          </span>
                        </div>
                        <Meter value={p} tone={p >= 100 ? "danger" : p >= 80 ? "warn" : "brand"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {state.wishes.filter((w) => !w.bought).length > 0 && (
            <button className="card item" style={{ padding: 16 }} onClick={() => go("planos", "desejos")}>
              <div className="ico-tile brand"><Icon name="heart" /></div>
              <div className="main-col">
                <div className="title">Lista de desejos</div>
                <div className="meta">{state.wishes.filter((w) => !w.bought).length} itens · guardado <Money value={state.wishes.filter((w) => !w.bought).reduce((s, w) => s + (w.saved || 0), 0)} /></div>
              </div>
              <Icon name="right" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
