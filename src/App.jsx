import { useState, useCallback } from "react";
import { useStore } from "./hooks/useStore";
import { MS, TABS, fmt } from "./data/seed";
import SwipeRow from "./components/SwipeRow";
import RainbowChart from "./components/RainbowChart";
import Modal from "./components/Modal";
import Splash from "./components/Splash";

/* ─── animated card ─────────────────────────────────────── */
function Card({ children, delay = 0, style = {} }) {
  return (
    <div style={{
      animation: `cardIn 0.45s ${delay}s cubic-bezier(0.34,1.2,0.64,1) both`,
      ...style
    }}>
      <style>{`
        @keyframes cardIn {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      {children}
    </div>
  );
}

/* ─── field input ────────────────────────────────────────── */
function F({ label, field, type = "text", form, setForm }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize:11, color:"#636366", fontWeight:500, marginBottom:6 }}>{label}</div>
      <input
        type={type}
        value={form[field] ?? ""}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{
          width:"100%", background:"#1c1c1e", border:"none",
          borderRadius:10, color:"#fff", fontSize:16,
          padding:"12px 14px", outline:"none",
          boxSizing:"border-box", fontFamily:"inherit",
        }}
      />
    </div>
  );
}

/* ─── add button ─────────────────────────────────────────── */
function AddBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"#6c63ff", border:"none", color:"#fff",
      borderRadius:10, padding:"7px 16px", fontSize:13,
      fontWeight:600, cursor:"pointer", fontFamily:"inherit"
    }}>+ Adicionar</button>
  );
}

/* ─── main ───────────────────────────────────────────────── */
export default function App() {
  const [splash, setSplash] = useState(true);
  const [tab, setTab]       = useState(0);
  const [fixed, setFixed]     = useStore("fixed");
  const [variable, setVariable] = useStore("variable");
  const [bills, setBills]     = useStore("bills");
  const [income, setIncome]   = useStore("income");
  const [goal, setGoalRaw]    = useStore("goal");
  const [month, setMonth]     = useState(new Date().getMonth());
  const [year, setYear]       = useState(new Date().getFullYear());
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const goalVal = typeof goal === "number" ? goal : 400;

  // ── computed ──────────────────────────────────────────────
  const totalFixed  = fixed.filter(f => f.active).reduce((s,f) => s+f.value, 0);
  const totalVar    = variable.filter(v => v.month===month && v.year===year).reduce((s,v) => s+v.value, 0);
  const totalIncome = income.reduce((s,i) => s+i.value, 0);
  const monthBills  = bills.filter(b => b.month===month && b.year===year);
  const totalBills  = monthBills.reduce((s,b) => s+b.value, 0);
  const totalOut    = totalFixed + totalVar + totalBills;
  const balance     = totalIncome - totalOut;
  const pct         = totalIncome > 0 ? Math.min((totalOut / totalIncome)*100, 100) : 0;
  const accentBar   = pct > 90 ? "#ff453a" : pct > 70 ? "#ff9f0a" : "#6c63ff";
  const pendingBills = bills.filter(b => !b.paid && new Date(b.year,b.month) >= new Date(year,month));

  // prev month for comparativo
  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const prevOut = fixed.filter(f=>f.active).reduce((s,f)=>s+f.value,0)
    + variable.filter(v=>v.month===prevM && v.year===prevY).reduce((s,v)=>s+v.value,0)
    + bills.filter(b=>b.month===prevM && b.year===prevY).reduce((s,b)=>s+b.value,0);
  const comparativoDiff = totalOut - prevOut;

  // chart data (categories)
  const catMap = {};
  [...variable.filter(v=>v.month===month&&v.year===year), ...monthBills.map(b=>({...b,category:"Faturas"}))].forEach(i => {
    const c = i.category || "Outros";
    catMap[c] = (catMap[c] || 0) + i.value;
  });
  fixed.filter(f=>f.active).forEach(f => {
    catMap[f.category] = (catMap[f.category] || 0) + f.value;
  });
  const chartData = Object.entries(catMap).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value);

  // ── nav ───────────────────────────────────────────────────
  function prevMonth() {
    if (month===0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1);
  }
  function nextMonth() {
    if (month===11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1);
  }

  // ── modal ─────────────────────────────────────────────────
  function openModal(type, item=null) {
    setModal(type);
    setForm(item ? {...item} : { month, year });
  }
  const closeModal = useCallback(() => { setModal(null); setForm({}); }, []);

  function save() {
    const v = parseFloat(form.value);
    if (!form.name || isNaN(v)) return;
    if (modal==="fixed") {
      const e = {...form, id:form.id||Date.now(), value:v, active:form.active!==false};
      setFixed(p => form.id ? p.map(x=>x.id===form.id?e:x) : [...p,e]);
    } else if (modal==="variable") {
      const e = {...form, id:form.id||Date.now(), value:v, month, year};
      setVariable(p => form.id ? p.map(x=>x.id===form.id?e:x) : [...p,e]);
    } else if (modal==="bill") {
      const e = {...form, id:form.id||Date.now(), value:v, month:parseInt(form.month??month), year:parseInt(form.year??year), paid:form.paid||false};
      setBills(p => form.id ? p.map(x=>x.id===form.id?e:x) : [...p,e]);
    } else if (modal==="income") {
      const e = {...form, id:form.id||Date.now(), value:v};
      setIncome(p => form.id ? p.map(x=>x.id===form.id?e:x) : [...p,e]);
    }
    closeModal();
  }

  function del(type, id) {
    ({fixed:setFixed,variable:setVariable,bill:setBills,income:setIncome}[type])(p=>p.filter(x=>x.id!==id));
  }

  const ghost = color => ({
    background:"transparent", border:"none", color, fontSize:11,
    padding:"4px 6px", cursor:"pointer", fontFamily:"inherit", fontWeight:500
  });

  const futureBills = bills
    .filter(b => new Date(b.year,b.month) >= new Date(year,month))
    .sort((a,b) => new Date(a.year,a.month)-new Date(b.year,b.month));

  const fp = { form, setForm }; // pass to F

  // ── render ────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior: none; }
        @keyframes cardIn {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {splash && <Splash onDone={() => setSplash(false)} />}

      <div style={{
        minHeight:"100vh", minHeight:"100dvh", background:"#000", color:"#fff",
        fontFamily:"-apple-system,'SF Pro Display','SF Pro Text',BlinkMacSystemFont,sans-serif",
        position:"relative", overflowX:"hidden",
        paddingTop:"env(safe-area-inset-top)", paddingBottom:"env(safe-area-inset-bottom)",
      }}>

        {/* Aura blobs */}
        <div style={{ position:"fixed", top:-120, left:"50%", transform:"translateX(-60%)", width:500, height:500, background:"radial-gradient(circle,rgba(108,99,255,0.18) 0%,transparent 65%)", filter:"blur(60px)", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", top:200, right:-100, width:340, height:340, background:"radial-gradient(circle,rgba(99,60,255,0.1) 0%,transparent 65%)", filter:"blur(80px)", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:0, left:-60, width:280, height:280, background:"radial-gradient(circle,rgba(130,80,255,0.08) 0%,transparent 65%)", filter:"blur(70px)", pointerEvents:"none", zIndex:0 }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:560, margin:"0 auto", padding:"0 20px 100px" }}>

          {/* ── Header card ─────────────────────────────── */}
          <Card delay={0.05} style={{ marginTop:28, marginBottom:24 }}>
            <div style={{ background:"linear-gradient(135deg,#111 0%,#0d0d0f 100%)", border:"1px solid #1c1c1e", borderRadius:24, padding:"28px 24px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:12, color:"#636366", fontWeight:500, marginBottom:6 }}>Saldo disponivel</div>
                  <div style={{ fontSize:36, fontWeight:700, letterSpacing:-1, color:balance<0?"#ff453a":"#fff", lineHeight:1 }}>{fmt(balance)}</div>
                  {/* comparativo */}
                  <div style={{ fontSize:11, color: comparativoDiff > 0 ? "#ff453a" : "#32d74b", marginTop:6 }}>
                    {comparativoDiff > 0 ? "+" : ""}{fmt(comparativoDiff)} vs {MS[prevM]}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, background:"#1c1c1e", borderRadius:12, padding:"6px 12px" }}>
                  <button onClick={prevMonth} style={ghost("#ebebf5")}>&#8249;</button>
                  <span style={{ fontSize:13, color:"#ebebf5", fontWeight:500, minWidth:68, textAlign:"center" }}>{MS[month]} {year}</span>
                  <button onClick={nextMonth} style={ghost("#ebebf5")}>&#8250;</button>
                </div>
              </div>

              {/* stats */}
              <div style={{ display:"flex", gap:0, marginBottom:20 }}>
                {[
                  {label:"Renda",  val:totalIncome, color:"#32d74b"},
                  {label:"Gastos", val:totalOut,    color:"#ff453a"},
                  {label:"Faturas",val:totalBills,  color:"#6c63ff"},
                ].map((s,i) => (
                  <div key={s.label} style={{ flex:1, borderLeft:i>0?"1px solid #2c2c2e":"none", paddingLeft:i>0?14:0, paddingRight:14 }}>
                    <div style={{ fontSize:11, color:"#636366", fontWeight:500, marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:14, color:s.color, fontVariantNumeric:"tabular-nums", fontWeight:600 }}>{fmt(s.val)}</div>
                  </div>
                ))}
              </div>

              {/* budget bar */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ fontSize:11, color:"#636366" }}>Orcamento mensal</div>
                  <div style={{ fontSize:11, color:"#636366" }}>{Math.round(pct)}%</div>
                </div>
                <div style={{ height:4, background:"#2c2c2e", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:4, width:`${pct}%`, background:accentBar, borderRadius:4, transition:"width 0.5s" }} />
                </div>
              </div>

              {/* meta de economia */}
              <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #1c1c1e" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontSize:11, color:"#636366" }}>Meta de economia</div>
                  <button onClick={() => { setGoalInput(goalVal); setEditGoal(true); }} style={ghost("#6c63ff")}>editar</button>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ height:4, background:"#2c2c2e", borderRadius:4, overflow:"hidden", flex:1, marginRight:12 }}>
                    <div style={{ height:4, width:`${Math.min((balance/goalVal)*100,100)}%`, background:balance>=goalVal?"#32d74b":"#6c63ff", borderRadius:4, transition:"width 0.5s" }} />
                  </div>
                  <div style={{ fontSize:12, color:balance>=goalVal?"#32d74b":"#ebebf5", fontWeight:600, fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" }}>
                    {fmt(balance)} / {fmt(goalVal)}
                  </div>
                </div>
                {balance >= goalVal && (
                  <div style={{ fontSize:11, color:"#32d74b", marginTop:6 }}>Meta atingida esse mes!</div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Tabs ─────────────────────────────────────── */}
          <Card delay={0.1}>
            <div style={{ display:"flex", background:"#1c1c1e", borderRadius:14, padding:3, marginBottom:20, gap:2 }}>
              {TABS.map((t,i) => (
                <button key={t} onClick={() => setTab(i)} style={{
                  flex:1, background:tab===i?"#2c2c2e":"transparent", border:"none",
                  borderRadius:11, color:tab===i?"#fff":"#636366", padding:"7px 2px",
                  fontSize:11, fontWeight:tab===i?600:400, cursor:"pointer",
                  fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap"
                }}>{t}</button>
              ))}
            </div>
          </Card>

          <div style={{ fontSize:11, color:"#3a3a3c", marginBottom:14, textAlign:"center" }}>Arraste para editar ou deletar</div>

          {/* ── GERAL ────────────────────────────────────── */}
          {tab === 0 && (
            <div>
              {pendingBills.length > 0 && (
                <Card delay={0.12}>
                  <div style={{ background:"rgba(108,99,255,0.1)", border:"1px solid rgba(108,99,255,0.25)", borderRadius:16, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, color:"#a79cff", fontWeight:600 }}>Faturas pendentes</div>
                      <div style={{ fontSize:12, color:"#636366", marginTop:2 }}>{pendingBills.length} a pagar</div>
                    </div>
                    <div style={{ fontSize:16, color:"#a79cff", fontWeight:700 }}>{fmt(pendingBills.reduce((s,b)=>s+b.value,0))}</div>
                  </div>
                </Card>
              )}

              <Card delay={0.15}>
                <RainbowChart data={chartData} />
              </Card>

              <Card delay={0.18}>
                <div style={{ fontSize:12, color:"#636366", fontWeight:500, marginBottom:12 }}>Proximas faturas</div>
                {futureBills.length===0 && <div style={{ fontSize:14, color:"#3a3a3c", padding:"16px 0" }}>Nenhuma fatura cadastrada</div>}
                {futureBills.slice(0,6).map(b => (
                  <SwipeRow key={b.id} onEdit={() => openModal("bill",b)} onDelete={() => setBills(p=>p.filter(x=>x.id!==b.id))} onToggle={() => setBills(p=>p.map(x=>x.id===b.id?{...x,paid:!x.paid}:x))} toggleLabel={b.paid?"Pendente":"Pago"} toggleColor={b.paid?"#ff9f0a":"#32d74b"}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #1c1c1e" }}>
                      <div>
                        <div style={{ fontSize:15, color:"#fff" }}>{b.name}</div>
                        <div style={{ fontSize:12, color:"#636366", marginTop:2 }}>{MS[b.month]} {b.year}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:15, color:b.paid?"#32d74b":"#ebebf5", fontVariantNumeric:"tabular-nums", fontWeight:500 }}>{fmt(b.value)}</span>
                        <span style={{ fontSize:10, fontWeight:600, color:b.paid?"#32d74b":"#ff9f0a", background:b.paid?"rgba(50,215,75,0.1)":"rgba(255,159,10,0.1)", padding:"3px 8px", borderRadius:6 }}>{b.paid?"Pago":"Pendente"}</span>
                      </div>
                    </div>
                  </SwipeRow>
                ))}
              </Card>
            </div>
          )}

          {/* ── FIXOS ────────────────────────────────────── */}
          {tab === 1 && (
            <Card delay={0.1}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:13, color:"#636366" }}>Ativo — <span style={{ color:"#fff" }}>{fmt(totalFixed)}</span></div>
                <AddBtn onClick={() => openModal("fixed")} />
              </div>
              {fixed.map((f,i) => (
                <Card key={f.id} delay={0.05*i}>
                  <SwipeRow onEdit={() => openModal("fixed",f)} onDelete={() => del("fixed",f.id)} onToggle={() => setFixed(p=>p.map(x=>x.id===f.id?{...x,active:!x.active}:x))} toggleLabel={f.active?"Desativar":"Ativar"} toggleColor={f.active?"#ff9f0a":"#32d74b"}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #1c1c1e", opacity:f.active?1:0.4 }}>
                      <div>
                        <div style={{ fontSize:15, color:"#fff" }}>{f.name}</div>
                        <div style={{ fontSize:12, color:"#636366", marginTop:2 }}>{f.category}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:15, color:"#ebebf5", fontVariantNumeric:"tabular-nums", fontWeight:500 }}>{fmt(f.value)}</span>
                        <span style={{ fontSize:10, fontWeight:600, color:f.active?"#32d74b":"#636366", background:f.active?"rgba(50,215,75,0.1)":"#1c1c1e", padding:"3px 8px", borderRadius:6 }}>{f.active?"On":"Off"}</span>
                      </div>
                    </div>
                  </SwipeRow>
                </Card>
              ))}
            </Card>
          )}

          {/* ── VARIAVEIS ────────────────────────────────── */}
          {tab === 2 && (
            <Card delay={0.1}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:13, color:"#636366" }}>{MS[month]} — <span style={{ color:"#fff" }}>{fmt(totalVar)}</span></div>
                <AddBtn onClick={() => openModal("variable")} />
              </div>
              {variable.filter(v=>v.month===month&&v.year===year).length===0 && (
                <div style={{ fontSize:14, color:"#3a3a3c", padding:"20px 0" }}>Nenhum gasto em {MS[month]}</div>
              )}
              {variable.filter(v=>v.month===month&&v.year===year).map((v,i) => (
                <Card key={v.id} delay={0.05*i}>
                  <SwipeRow onEdit={() => openModal("variable",v)} onDelete={() => del("variable",v.id)}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #1c1c1e" }}>
                      <div>
                        <div style={{ fontSize:15, color:"#fff" }}>{v.name}</div>
                        <div style={{ fontSize:12, color:"#636366", marginTop:2 }}>{v.category}</div>
                      </div>
                      <span style={{ fontSize:15, color:"#ebebf5", fontVariantNumeric:"tabular-nums", fontWeight:500 }}>{fmt(v.value)}</span>
                    </div>
                  </SwipeRow>
                </Card>
              ))}
            </Card>
          )}

          {/* ── FATURAS ──────────────────────────────────── */}
          {tab === 3 && (
            <Card delay={0.1}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:13, color:"#636366" }}>{MS[month]} — <span style={{ color:"#fff" }}>{fmt(totalBills)}</span></div>
                <AddBtn onClick={() => openModal("bill")} />
              </div>
              {monthBills.length===0 && <div style={{ fontSize:14, color:"#3a3a3c", padding:"20px 0" }}>Nenhuma fatura em {MS[month]}</div>}
              {monthBills.map((b,i) => (
                <Card key={b.id} delay={0.05*i}>
                  <SwipeRow onEdit={() => openModal("bill",b)} onDelete={() => del("bill",b.id)} onToggle={() => setBills(p=>p.map(x=>x.id===b.id?{...x,paid:!x.paid}:x))} toggleLabel={b.paid?"Pendente":"Pago"} toggleColor={b.paid?"#ff9f0a":"#32d74b"}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #1c1c1e" }}>
                      <div>
                        <div style={{ fontSize:15, color:"#fff" }}>{b.name}</div>
                        <div style={{ fontSize:12, color:"#636366", marginTop:2 }}>{MS[b.month]} {b.year}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:15, color:b.paid?"#32d74b":"#ebebf5", fontVariantNumeric:"tabular-nums", fontWeight:500 }}>{fmt(b.value)}</span>
                        <span style={{ fontSize:10, fontWeight:600, color:b.paid?"#32d74b":"#ff9f0a", background:b.paid?"rgba(50,215,75,0.1)":"rgba(255,159,10,0.1)", padding:"3px 8px", borderRadius:6 }}>{b.paid?"Pago":"Pendente"}</span>
                      </div>
                    </div>
                  </SwipeRow>
                </Card>
              ))}
              {bills.filter(b=>new Date(b.year,b.month)>new Date(year,month)).length>0 && (
                <div style={{ marginTop:28 }}>
                  <div style={{ fontSize:12, color:"#636366", fontWeight:500, marginBottom:12 }}>Proximos meses</div>
                  {bills.filter(b=>new Date(b.year,b.month)>new Date(year,month)).sort((a,b)=>new Date(a.year,a.month)-new Date(b.year,b.month)).map((b,i) => (
                    <Card key={b.id} delay={0.05*i}>
                      <SwipeRow onEdit={() => openModal("bill",b)} onDelete={() => del("bill",b.id)}>
                        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #1c1c1e", opacity:0.55 }}>
                          <div style={{ fontSize:14, color:"#ebebf5" }}>{b.name} <span style={{ color:"#636366", fontSize:12 }}>— {MS[b.month]} {b.year}</span></div>
                          <span style={{ fontSize:14, color:"#a79cff", fontVariantNumeric:"tabular-nums" }}>{fmt(b.value)}</span>
                        </div>
                      </SwipeRow>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ── RENDA ────────────────────────────────────── */}
          {tab === 4 && (
            <Card delay={0.1}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:13, color:"#636366" }}>Total — <span style={{ color:"#32d74b" }}>{fmt(totalIncome)}</span></div>
                <AddBtn onClick={() => openModal("income")} />
              </div>
              {income.map((inc,i) => (
                <Card key={inc.id} delay={0.05*i}>
                  <SwipeRow onEdit={() => openModal("income",inc)} onDelete={() => del("income",inc.id)}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #1c1c1e" }}>
                      <div style={{ fontSize:15, color:"#fff" }}>{inc.name}</div>
                      <span style={{ fontSize:15, color:"#32d74b", fontVariantNumeric:"tabular-nums", fontWeight:500 }}>{fmt(inc.value)}</span>
                    </div>
                  </SwipeRow>
                </Card>
              ))}
            </Card>
          )}
        </div>

        {/* ── MODAL add/edit ───────────────────────────── */}
        {modal && (
          <Modal
            title={`${form.id?"Editar":"Adicionar"} ${modal==="fixed"?"Gasto Fixo":modal==="variable"?"Gasto Variavel":modal==="bill"?"Fatura":"Renda"}`}
            onClose={closeModal}
            onSave={save}
          >
            <F label="Nome" field="name" {...fp} />
            <F label="Valor (R$)" field="value" type="number" {...fp} />
            {modal==="bill" && <>
              <F label="Mes (0 a 11)" field="month" type="number" {...fp} />
              <F label="Ano" field="year"  type="number" {...fp} />
            </>}
          </Modal>
        )}

        {/* ── MODAL meta ───────────────────────────────── */}
        {editGoal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }} onClick={() => setEditGoal(false)}>
            <div style={{ background:"#111", borderRadius:"24px 24px 0 0", padding:"28px 24px 48px", width:"100%", maxWidth:560, borderTop:"1px solid #2c2c2e" }} onClick={e=>e.stopPropagation()}>
              <div style={{ width:36, height:4, background:"#3a3a3c", borderRadius:2, margin:"0 auto 24px" }} />
              <div style={{ fontSize:17, fontWeight:600, color:"#fff", marginBottom:24 }}>Meta de economia</div>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, color:"#636366", fontWeight:500, marginBottom:6 }}>Valor da meta (R$)</div>
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  style={{ width:"100%", background:"#1c1c1e", border:"none", borderRadius:10, color:"#fff", fontSize:16, padding:"12px 14px", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                />
              </div>
              <div style={{ display:"flex", gap:12, marginTop:24 }}>
                <button onClick={() => setEditGoal(false)} style={{ flex:1, background:"#2c2c2e", border:"none", color:"#ebebf5", borderRadius:14, padding:"14px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
                <button onClick={() => { const v=parseFloat(goalInput); if(!isNaN(v)) setGoalRaw(v); setEditGoal(false); }} style={{ flex:1, background:"#6c63ff", border:"none", color:"#fff", borderRadius:14, padding:"14px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
