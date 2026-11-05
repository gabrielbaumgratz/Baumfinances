import { useMemo, useState } from "react";
import { useStore, useLookup } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { fixedForMonth, signedFixed } from "../lib/selectors.js";
import { relativeDay, today, fromISO, MONTHS, daysUntil } from "../lib/dates.js";
import { uid } from "../lib/id.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import MonthSwitcher from "../components/MonthSwitcher.jsx";
import { CatIcon, Empty, Meter, Seg } from "../components/ui.jsx";

export default function Plans({ sub, go }) {
  const tab = ["fixos", "planejados", "desejos"].includes(sub) ? sub : "fixos";
  const ui = useUI();
  const add = { fixos: () => ui.open("fixed"), planejados: () => ui.open("plan"), desejos: () => ui.open("wish") }[tab];
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <header className="top">
        <h1>Planos</h1>
        <div className="spacer" />
        <button className="btn sm" onClick={add}><Icon name="plus" size={18} />Adicionar</button>
      </header>
      <div className="stack" style={{ gap: 14 }}>
        <Seg value={tab} onChange={(v) => go("planos", v)} label="Tipo de plano" options={[
          { value: "fixos", label: "Fixos" }, { value: "planejados", label: "Planejados" }, { value: "desejos", label: "Desejos" },
        ]} />
        {tab === "fixos" && <Fixed />}
        {tab === "planejados" && <Planned />}
        {tab === "desejos" && <Wishes />}
      </div>
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
  const inactive = state.fixed.filter((f) => f.active === false);

  return (
    <>
      <div className="row"><MonthSwitcher ym={ym} onChange={setYm} /></div>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="kpi">
          <div className="k">Saídas fixas</div>
          <div className="v"><Money value={out} /></div>
          <div className="d">{inc > 0 ? `${Math.round((out / inc) * 100)}% da renda fixa` : "cadastre sua renda fixa"}</div>
        </div>
        <div className="kpi">
          <div className="k">Já pago</div>
          <div className="v"><Money value={paid} /></div>
          <div style={{ marginTop: 8 }}><Meter value={out ? (paid / out) * 100 : 0} tone="brand" /></div>
        </div>
      </div>

      <section className="card card-flat">
        {rows.length ? (
          <div className="list">
            {rows.map(({ item, due, paidTx }) => {
              const late = !paidTx && due < ref;
              return (
                <button key={item.id} className="item" onClick={() => ui.open("fixed", { item, due })}>
                  <CatIcon cat={cat(item.categoryId)} />
                  <div className="main-col">
                    <div className="title">{item.name}</div>
                    <div className="meta">
                      <span>dia {item.day}</span>
                      {paidTx ? <span className="badge brand"><Icon name="check" size={12} />{item.kind === "income" ? "recebido" : "pago"}</span>
                        : late ? <span className="badge danger">atrasado</span>
                        : <span className="badge">{daysUntil(due, ref) <= 5 ? relativeDay(due, ref).toLowerCase() : "pendente"}</span>}
                    </div>
                  </div>
                  <div className={`amt ${item.kind === "income" ? "pos" : ""}`}><Money value={signedFixed(item)} signed /></div>
                </button>
              );
            })}
          </div>
        ) : (
          <Empty icon="repeat" title="Sem gastos fixos" text="Aluguel, internet, streaming, salário... tudo que se repete todo mês." action={<button className="btn sm" onClick={() => ui.open("fixed")}>Adicionar fixo</button>} />
        )}
      </section>
      {inactive.length > 0 && (
        <>
          <div className="section-label">Pausados</div>
          <section className="card card-flat"><div className="list">
            {inactive.map((item) => (
              <button key={item.id} className="item" style={{ opacity: 0.6 }} onClick={() => ui.open("fixed", { item })}>
                <CatIcon cat={cat(item.categoryId)} />
                <div className="main-col"><div className="title">{item.name}</div><div className="meta">pausado</div></div>
                <div className="amt"><Money value={signedFixed(item)} signed /></div>
              </button>
            ))}
          </div></section>
        </>
      )}
    </>
  );
}

function Planned() {
  const { state } = useStore();
  const ui = useUI();
  const { cat } = useLookup();
  const ref = today();
  const open = state.plans.filter((p) => !p.done).sort((a, b) => a.date.localeCompare(b.date));
  const done = state.plans.filter((p) => p.done).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const groups = new Map();
  for (const p of open) {
    const d = fromISO(p.date);
    const key = p.date < ref.slice(0, 8) + "01" ? "Atrasados" : `${MONTHS[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : ""}`;
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  const sure = open.filter((p) => p.certainty !== "maybe").reduce((s, p) => s + p.amount, 0);
  const maybe = open.filter((p) => p.certainty === "maybe").reduce((s, p) => s + p.amount, 0);

  const Row = ({ p }) => (
    <button className="item" onClick={() => ui.open("plan", { item: p })} style={p.done ? { opacity: 0.55 } : undefined}>
      <CatIcon cat={cat(p.categoryId)} />
      <div className="main-col">
        <div className="title" style={p.done ? { textDecoration: "line-through" } : undefined}>{p.name}</div>
        <div className="meta">
          <span>{relativeDay(p.date, ref)}</span>
          {!p.done && (p.certainty === "maybe" ? <span className="badge warn">talvez</span> : <span className="badge brand">certo</span>)}
          {p.done === "cancelled" && <span className="badge">não rolou</span>}
        </div>
      </div>
      <div className="amt"><Money value={-p.amount} signed /></div>
    </button>
  );

  return (
    <>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="kpi"><div className="k"><span className="dot" style={{ background: "var(--brand-fill)" }} />Vai gastar</div><div className="v"><Money value={sure} /></div></div>
        <div className="kpi"><div className="k"><span className="dot" style={{ background: "var(--warn)" }} />Talvez gaste</div><div className="v"><Money value={maybe} /></div></div>
      </div>
      {open.length === 0 && (
        <section className="card"><Empty icon="calendar" title="Nada planejado" text="Coisas que você vai (ou pode) gastar no futuro: viagem, presente, conserto, show..." action={<button className="btn sm" onClick={() => ui.open("plan")}>Planejar gasto</button>} /></section>
      )}
      {[...groups.entries()].map(([label, items]) => (
        <div key={label}>
          <div className="section-label row" style={{ justifyContent: "space-between" }}>
            <span style={label === "Atrasados" ? { color: "var(--danger)" } : undefined}>{label}</span>
            <Money value={items.reduce((s, p) => s + p.amount, 0)} />
          </div>
          <section className="card card-flat"><div className="list">{items.map((p) => <Row key={p.id} p={p} />)}</div></section>
        </div>
      ))}
      {done.length > 0 && (
        <div>
          <div className="section-label">Concluídos</div>
          <section className="card card-flat"><div className="list">{done.map((p) => <Row key={p.id} p={p} />)}</div></section>
        </div>
      )}
    </>
  );
}

const PRIO = { 1: "Quero muito", 2: "Quero", 3: "Seria legal" };

function Wishes() {
  const { state, upsert } = useStore();
  const ui = useUI();
  const list = state.wishes.filter((w) => !w.bought).sort((a, b) => (a.priority || 2) - (b.priority || 2));
  const bought = state.wishes.filter((w) => w.bought);
  const total = list.reduce((s, w) => s + w.price, 0);
  const saved = list.reduce((s, w) => s + Math.min(w.saved || 0, w.price), 0);

  return (
    <>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <div className="kpi"><div className="k">Tudo da lista</div><div className="v"><Money value={total} /></div><div className="d">{list.length} {list.length === 1 ? "item" : "itens"}</div></div>
        <div className="kpi"><div className="k">Já guardado</div><div className="v"><Money value={saved} /></div><div style={{ marginTop: 8 }}><Meter value={total ? (saved / total) * 100 : 0} tone="brand" /></div></div>
      </div>
      {list.length === 0 && (
        <section className="card"><Empty icon="heart" title="Lista vazia" text="Anote o que você quer comprar e guarde dinheiro pra cada coisa, sem pressa." action={<button className="btn sm" onClick={() => ui.open("wish")}>Adicionar desejo</button>} /></section>
      )}
      <div className="stack" style={{ gap: 12 }}>
        {list.map((w) => {
          const p = w.price ? Math.min(100, ((w.saved || 0) / w.price) * 100) : 0;
          return (
            <article key={w.id} className="card" style={{ padding: 16 }}>
              <button className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => ui.open("wish", { item: w })}>
                <div className={`ico-tile ${p >= 100 ? "brand" : ""}`}><Icon name={p >= 100 ? "check" : "heart"} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{w.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{PRIO[w.priority || 2]}</div>
                </div>
                <div style={{ fontWeight: 650 }}><Money value={w.price} /></div>
              </button>
              <div style={{ marginTop: 14 }}><Meter value={p} tone="brand" /></div>
              <div className="wish-progress">
                <span><Money value={w.saved || 0} /> guardado</span>
                <span>{p >= 100 ? "Dá pra comprar!" : <>faltam <Money value={w.price - (w.saved || 0)} /></>}</span>
              </div>
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="btn sm ghost" onClick={() => ui.open("wish", { item: w, mode: "save" })}><Icon name="piggy" size={18} />Guardar</button>
                <button className="btn sm ghost" onClick={() => {
                  upsert("plans", { id: uid(), name: w.name, amount: w.price, date: today(), categoryId: "compras", certainty: "maybe", done: false, note: "Veio da lista de desejos" });
                  ui.toast("Foi pros planejados");
                }}><Icon name="calendar" size={18} />Planejar</button>
              </div>
            </article>
          );
        })}
      </div>
      {bought.length > 0 && (
        <div>
          <div className="section-label">Conquistados</div>
          <section className="card card-flat"><div className="list">
            {bought.map((w) => (
              <button key={w.id} className="item" onClick={() => ui.open("wish", { item: w })}>
                <div className="ico-tile brand"><Icon name="check" /></div>
                <div className="main-col"><div className="title">{w.name}</div></div>
                <div className="amt"><Money value={w.price} /></div>
              </button>
            ))}
          </div></section>
        </div>
      )}
    </>
  );
}
