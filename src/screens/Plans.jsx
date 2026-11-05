import { useMemo, useState } from "react";
import { useStore, useLookup } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { fixedForMonth, signedFixed } from "../lib/selectors.js";
import { relativeDay, today, fromISO, MONTHS, daysUntil } from "../lib/dates.js";
import { uid } from "../lib/id.js";
import Money from "../components/Money.jsx";
import MonthSwitcher from "../components/MonthSwitcher.jsx";
import { Empty, Meter, SectionHead, Tabs } from "../components/ui.jsx";

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const ADD_LABEL = { fixos: "Novo fixo", planejados: "Novo planejado", desejos: "Novo desejo" };

export default function Plans({ sub, go }) {
  const tab = ["fixos", "planejados", "desejos"].includes(sub) ? sub : "fixos";
  const ui = useUI();
  const add = () => ui.open({ fixos: "fixed", planejados: "plan", desejos: "wish" }[tab]);
  return (
    <div className="page narrow">
      <header className="top">
        <h1>Planejamento</h1>
        <div className="spacer" />
        <button className="btn sm" onClick={add}>{ADD_LABEL[tab]}</button>
      </header>
      <Tabs value={tab} onChange={(v) => go("planejamento", v)} label="Planejamento" options={[
        { value: "fixos", label: "Fixos" }, { value: "planejados", label: "Planejados" }, { value: "desejos", label: "Desejos" },
      ]} />
      {tab === "fixos" && <Fixed />}
      {tab === "planejados" && <Planned />}
      {tab === "desejos" && <Wishes />}
    </div>
  );
}

function Fixed() {
  const { state } = useStore();
  const ui = useUI();
  const { cat } = useLookup();
  const d = new Date();
  const [ym, setYm] = useState({ y: d.getFullYear(), m: d.getMonth() });
  const rows = useMemo(() => fixedForMonth(state, ym), [state, ym]);
  const ref = today();
  const inc = rows.filter((r) => r.item.kind === "income").reduce((s, r) => s + Math.abs(r.item.amount), 0);
  const out = rows.filter((r) => r.item.kind !== "income").reduce((s, r) => s + Math.abs(r.item.amount), 0);
  const paid = rows.filter((r) => r.paidTx && r.item.kind !== "income").reduce((s, r) => s + Math.abs(r.item.amount), 0);
  const paused = state.fixed.filter((f) => f.active === false);

  const status = (item, due, paidTx) => {
    if (paidTx) return <span className="pos">{item.kind === "income" ? "Recebido" : "Pago"}</span>;
    if (due < ref) return <span className="danger-text">Atrasado</span>;
    const n = daysUntil(due, ref);
    return <span>{n <= 6 ? cap(relativeDay(due, ref)) : `Dia ${item.day}`}</span>;
  };

  return (
    <div className="stack">
      <div>
        <div style={{ marginLeft: -10, marginBottom: 8 }}><MonthSwitcher ym={ym} onChange={setYm} /></div>
        <div className="figures three">
          <div><div className="label">Saídas fixas</div><div className="v"><Money value={out} /></div><div className="d">{inc > 0 ? `${Math.round((out / inc) * 100)}% da renda fixa` : "Sem renda fixa cadastrada"}</div></div>
          <div><div className="label">Renda fixa</div><div className="v pos"><Money value={inc} /></div></div>
          <div><div className="label">Pago</div><div className="v"><Money value={paid} /></div><div style={{ marginTop: 8 }}><Meter value={out ? (paid / out) * 100 : 0} /></div></div>
        </div>
      </div>

      <section>
        {rows.length ? (
          <div className="list">
            {rows.map(({ item, due, paidTx }) => (
              <button key={item.id} className="item" onClick={() => ui.open("fixed", { item, due })}>
                <div className="body">
                  <div className="t">{item.name}</div>
                  <div className="m row" style={{ gap: 10 }}>{status(item, due, paidTx)}<span>{cat(item.categoryId).name}</span></div>
                </div>
                <div className={`v ${item.kind === "income" ? "pos" : ""}`}><Money value={signedFixed(item)} signed /></div>
              </button>
            ))}
          </div>
        ) : (
          <Empty title="Nenhum fixo" text="Aluguel, internet, assinaturas, salário: tudo que se repete todo mês." action={<button className="btn sm" onClick={() => ui.open("fixed")}>Novo fixo</button>} />
        )}
      </section>

      {paused.length > 0 && (
        <section>
          <SectionHead title="Pausados" />
          <div className="list">
            {paused.map((item) => (
              <button key={item.id} className="item" onClick={() => ui.open("fixed", { item })}>
                <div className="body"><div className="t muted">{item.name}</div></div>
                <div className="v muted"><Money value={signedFixed(item)} signed /></div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Planned() {
  const { state } = useStore();
  const ui = useUI();
  const { cat } = useLookup();
  const ref = today();
  const open = state.plans.filter((p) => !p.done).sort((a, b) => a.date.localeCompare(b.date));
  const closed = state.plans.filter((p) => p.done).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const sure = open.filter((p) => p.certainty !== "maybe").reduce((s, p) => s + p.amount, 0);
  const maybe = open.filter((p) => p.certainty === "maybe").reduce((s, p) => s + p.amount, 0);

  const groups = new Map();
  for (const p of open) {
    const d = fromISO(p.date);
    const key = p.date < ref.slice(0, 8) + "01" ? "Atrasados" : `${MONTHS[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : ""}`;
    groups.set(key, [...(groups.get(key) || []), p]);
  }

  const Row = ({ p }) => (
    <button className="item" onClick={() => ui.open("plan", { item: p })}>
      <div className="body">
        <div className={`t${p.done ? " muted" : ""}`}>{p.name}</div>
        <div className="m row" style={{ gap: 10 }}>
          <span>{cap(relativeDay(p.date, ref))}</span>
          <span>{p.done === "cancelled" ? "Cancelado" : p.done ? "Concluído" : p.certainty === "maybe" ? "Incerto" : "Confirmado"}</span>
          <span>{cat(p.categoryId).name}</span>
        </div>
      </div>
      <div className={`v${p.done ? " muted" : ""}`}><Money value={-p.amount} signed /></div>
    </button>
  );

  return (
    <div className="stack">
      <div className="figures" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><div className="label">Confirmados</div><div className="v"><Money value={sure} /></div><div className="d">Entram na previsão de saldo</div></div>
        <div><div className="label">Incertos</div><div className="v"><Money value={maybe} /></div><div className="d">Mostrados como cenário</div></div>
      </div>
      {open.length === 0 && (
        <Empty title="Nenhum gasto planejado" text="Viagens, presentes, manutenções: registre o que você pretende gastar." action={<button className="btn sm" onClick={() => ui.open("plan")}>Novo planejado</button>} />
      )}
      {[...groups.entries()].map(([label, items]) => (
        <section key={label}>
          <div className="section-head">
            <h2 className={label === "Atrasados" ? "danger-text" : ""}>{label}</h2>
            <div className="spacer" />
            <span className="m num muted" style={{ fontSize: "0.85rem" }}><Money value={items.reduce((s, p) => s + p.amount, 0)} /></span>
          </div>
          <div className="list">{items.map((p) => <Row key={p.id} p={p} />)}</div>
        </section>
      ))}
      {closed.length > 0 && (
        <section>
          <SectionHead title="Encerrados" />
          <div className="list">{closed.map((p) => <Row key={p.id} p={p} />)}</div>
        </section>
      )}
    </div>
  );
}

const PRIO = { 1: "Prioridade alta", 2: "Prioridade média", 3: "Prioridade baixa" };

function Wishes() {
  const { state, upsert } = useStore();
  const ui = useUI();
  const list = state.wishes.filter((w) => !w.bought).sort((a, b) => (a.priority || 2) - (b.priority || 2));
  const bought = state.wishes.filter((w) => w.bought);
  const total = list.reduce((s, w) => s + w.price, 0);
  const saved = list.reduce((s, w) => s + Math.min(w.saved || 0, w.price), 0);

  return (
    <div className="stack">
      <div className="figures" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div><div className="label">Total da lista</div><div className="v"><Money value={total} /></div><div className="d">{list.length} {list.length === 1 ? "item" : "itens"}</div></div>
        <div><div className="label">Guardado</div><div className="v"><Money value={saved} /></div><div style={{ marginTop: 8 }}><Meter value={total ? (saved / total) * 100 : 0} /></div></div>
      </div>
      {list.length === 0 ? (
        <Empty title="Lista vazia" text="Anote o que você quer comprar e acompanhe quanto já guardou para cada item." action={<button className="btn sm" onClick={() => ui.open("wish")}>Novo desejo</button>} />
      ) : (
        <div className="list">
          {list.map((w) => {
            const p = w.price ? Math.min(100, ((w.saved || 0) / w.price) * 100) : 0;
            return (
              <div key={w.id} className="item" style={{ display: "block", padding: "18px 0" }}>
                <button className="row" style={{ width: "100%", alignItems: "baseline" }} onClick={() => ui.open("wish", { item: w })}>
                  <div className="body" style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{w.name}</div>
                    <div className="m">{PRIO[w.priority || 2]}</div>
                  </div>
                  <div className="v"><Money value={w.price} /></div>
                </button>
                <div style={{ margin: "12px 0 8px" }}><Meter value={p} /></div>
                <div className="row m" style={{ justifyContent: "space-between", margin: 0 }}>
                  <span><Money value={w.saved || 0} /> guardado</span>
                  <span>{p >= 100 ? "Valor atingido" : <>Faltam <Money value={w.price - (w.saved || 0)} /></>}</span>
                </div>
                <div className="row" style={{ gap: 20, marginTop: 10 }}>
                  <button className="link" onClick={() => ui.open("wish", { item: w, mode: "save" })}>Guardar dinheiro</button>
                  <button className="link" onClick={() => {
                    upsert("plans", { id: uid(), name: w.name, amount: w.price, date: today(), categoryId: "compras", certainty: "maybe", done: false, note: "Da lista de desejos" });
                    ui.toast("Adicionado aos planejados");
                  }}>Mover para planejados</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {bought.length > 0 && (
        <section>
          <SectionHead title="Comprados" />
          <div className="list">
            {bought.map((w) => (
              <button key={w.id} className="item" onClick={() => ui.open("wish", { item: w })}>
                <div className="body"><div className="t muted">{w.name}</div></div>
                <div className="v muted"><Money value={w.price} /></div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
