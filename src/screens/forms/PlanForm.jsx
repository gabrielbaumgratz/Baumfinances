import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { today } from "../../lib/dates.js";
import Sheet from "../../components/Sheet.jsx";
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
    ui.toast(editing ? "Planejado atualizado" : "Planejado criado");
    close();
  };

  const complete = (close) => {
    setTouched(true);
    if (!value || !name.trim()) return;
    upsert("plans", { ...data(), done: true });
    upsert("transactions", { date: date > today() ? today() : date, amount: -value, merchant: name.trim(), description: name.trim(), categoryId, accountId, note: note.trim(), planId: item?.id });
    ui.toast("Registrado no extrato");
    close();
  };

  return (
    <Sheet title={editing ? "Editar planejado" : "Novo planejado"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" onClick={() => { remove("plans", item.id); ui.toast("Planejado excluído", () => upsert("plans", item)); close(); }}>Excluir</button>}
          <button className="btn" onClick={() => save(close)}>Salvar</button>
        </>
      )}>
      {(close) => (
        <>
          <AmountInput value={amount} onChange={setAmount} error={touched && !value ? "Informe um valor" : ""} />
          <Field id="pname" label="Descrição" error={touched && !name.trim() ? "Informe uma descrição" : ""}>
            <input id="pname" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="pdate" label="Data prevista">
            <input id="pdate" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value || today())} />
          </Field>
          <div className="field">
            <span className="label">Situação</span>
            <Seg value={certainty} onChange={setCertainty} label="Certeza" options={[{ value: "sure", label: "Confirmado" }, { value: "maybe", label: "Incerto" }]} />
            <span className="help">{certainty === "sure" ? "Entra na previsão de saldo." : "Aparece apenas como cenário na previsão."}</span>
          </div>
          <CategoryPicker categories={state.categories} value={categoryId} onChange={setCategoryId} />
          <Field id="pnote" label="Observação">
            <textarea id="pnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {editing && !item.done && (
            <div className="stack" style={{ gap: 12, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <div className="label">Concluir</div>
              <AccountPicker accounts={state.accounts} value={accountId} onChange={setAccountId} allowNone />
              <div className="btn-row">
                <button className="btn sm" onClick={() => complete(close)}>Registrar gasto</button>
                <button className="btn sm ghost" onClick={() => { upsert("plans", { ...item, done: "cancelled" }); ui.toast("Planejado cancelado"); close(); }}>Cancelar planejado</button>
              </div>
            </div>
          )}
          {editing && item.done && (
            <button className="btn ghost" onClick={() => { upsert("plans", { ...item, done: false }); close(); }}>Reabrir</button>
          )}
        </>
      )}
    </Sheet>
  );
}
