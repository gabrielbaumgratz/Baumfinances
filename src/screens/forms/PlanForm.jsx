import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { today } from "../../lib/dates.js";
import Sheet from "../../components/Sheet.jsx";
import Icon from "../../components/Icon.jsx";
import { Field, Seg } from "../../components/ui.jsx";
import { AccountPicker, AmountInput, CategoryPicker, toInput, validAmount } from "./shared.jsx";

export default function PlanForm({ item, onClose }) {
  const { state, upsert, remove } = useStore();
  const ui = useUI();
  const editing = !!item?.id;
  const [name, setName] = useState(item?.name || "");
  const [amount, setAmount] = useState(toInput(item?.amount));
  const [date, setDate] = useState(item?.date || today());
  const [certainty, setCertainty] = useState(item?.certainty || "sure");
  const [categoryId, setCategoryId] = useState(item?.categoryId || "outros");
  const [note, setNote] = useState(item?.note || "");
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || "");
  const [touched, setTouched] = useState(false);
  const value = validAmount(amount);

  const data = () => ({ ...(item || {}), name: name.trim(), amount: value, date, certainty, categoryId, note: note.trim() });

  const save = (close) => {
    setTouched(true);
    if (!value || !name.trim()) return;
    upsert("plans", { done: false, ...data() });
    ui.toast(editing ? "Plano atualizado" : "Plano criado");
    close();
  };

  const complete = (close) => {
    setTouched(true);
    if (!value || !name.trim()) return;
    upsert("plans", { ...data(), done: true });
    upsert("transactions", { date: date > today() ? today() : date, amount: -value, merchant: name.trim(), description: name.trim(), categoryId, accountId, note: note.trim(), planId: item?.id });
    ui.toast("Virou gasto no extrato");
    close();
  };

  return (
    <Sheet title={editing ? "Editar plano" : "Planejar gasto"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" style={{ flex: "0 0 auto" }} aria-label="Apagar" onClick={() => { remove("plans", item.id); ui.toast("Plano apagado", () => upsert("plans", item)); close(); }}><Icon name="trash" /></button>}
          <button className="btn" onClick={() => save(close)}>Salvar</button>
        </>
      )}>
      {(close) => (
        <>
          <AmountInput value={amount} onChange={setAmount} error={touched && !value ? "Coloca um valor" : ""} />
          <Field id="pname" label="O que é?" error={touched && !name.trim() ? "Dá um nome" : ""}>
            <input id="pname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem, presente, revisão do carro" />
          </Field>
          <Field id="pdate" label="Quando?">
            <input id="pdate" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value || today())} />
          </Field>
          <div className="field">
            <span className="label">Vai rolar mesmo?</span>
            <Seg value={certainty} onChange={setCertainty} label="Certeza" options={[{ value: "sure", label: "Com certeza" }, { value: "maybe", label: "Talvez" }]} />
            <span className="help">{certainty === "sure" ? "Entra na previsão do saldo." : "Aparece como cenário, sem descontar da previsão."}</span>
          </div>
          <CategoryPicker categories={state.categories} value={categoryId} onChange={setCategoryId} />
          <Field id="pnote" label="Nota (opcional)">
            <textarea id="pnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {editing && !item.done && (
            <div className="card stack" style={{ padding: 16, gap: 12 }}>
              <div style={{ fontWeight: 600 }}>Já aconteceu?</div>
              <AccountPicker accounts={state.accounts} value={accountId} onChange={setAccountId} allowNone />
              <div className="btn-row">
                <button className="btn sm brand" onClick={() => complete(close)}><Icon name="check" size={18} />Gastei</button>
                <button className="btn sm ghost" onClick={() => { upsert("plans", { ...item, done: "cancelled" }); ui.toast("Marcado como não rolou"); close(); }}>Não rolou</button>
              </div>
            </div>
          )}
          {editing && item.done && (
            <button className="btn ghost" onClick={() => { upsert("plans", { ...item, done: false }); close(); }}>Reabrir plano</button>
          )}
        </>
      )}
    </Sheet>
  );
}
