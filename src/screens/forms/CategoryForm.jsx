import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { parseMoney } from "../../lib/format.js";
import Sheet from "../../components/Sheet.jsx";
import Icon from "../../components/Icon.jsx";
import Money from "../../components/Money.jsx";
import { Field } from "../../components/ui.jsx";

export default function CategoryForm({ onClose }) {
  const { state, upsert } = useStore();
  const ui = useUI();
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  const pick = (c) => { setEdit(c); setName(c.name); setBudget(c.budget ? String(c.budget).replace(".", ",") : ""); };

  return (
    <Sheet title={edit ? edit.name : "Categorias e limites"} onClose={onClose}
      footer={edit ? (
        <>
          <button className="btn ghost" onClick={() => setEdit(null)}>Voltar</button>
          <button className="btn" onClick={() => {
            const b = parseMoney(budget || "0");
            upsert("categories", { ...edit, name: name.trim() || edit.name, budget: Number.isFinite(b) ? Math.abs(b) : 0 });
            ui.toast("Categoria salva");
            setEdit(null);
          }}>Salvar</button>
        </>
      ) : null}>
      {edit ? (
        <>
          <Field id="cname" label="Nome"><input id="cname" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field id="cbudget" label="Limite por mês" help="Deixe vazio pra não ter limite. Você é avisado quando chegar perto.">
            <input id="cbudget" className="input" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Sem limite" />
          </Field>
        </>
      ) : (
        <div className="list">
          {state.categories.map((c) => (
            <button key={c.id} className="item" onClick={() => pick(c)}>
              <div className="ico-tile"><Icon name={c.icon} /></div>
              <div className="main-col"><div className="title">{c.name}</div></div>
              <div className="amt">{c.budget > 0 ? <Money value={c.budget} /> : <span style={{ color: "var(--muted)", fontWeight: 400 }}>sem limite</span>}</div>
              <Icon name="right" size={18} />
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
