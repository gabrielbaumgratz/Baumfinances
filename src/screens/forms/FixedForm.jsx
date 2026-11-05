import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { fromISO, today, MONTHS } from "../../lib/dates.js";
import Sheet from "../../components/Sheet.jsx";
import Icon from "../../components/Icon.jsx";
import Money from "../../components/Money.jsx";
import { Field, Seg, Switch } from "../../components/ui.jsx";
import { AccountPicker, AmountInput, CategoryPicker, toInput, validAmount } from "./shared.jsx";

export default function FixedForm({ item, due, onClose }) {
  const { state, upsert, remove } = useStore();
  const ui = useUI();
  const editing = !!item?.id;
  const [kind, setKind] = useState(item?.kind || "expense");
  const [name, setName] = useState(item?.name || "");
  const [amount, setAmount] = useState(toInput(item?.amount));
  const [day, setDay] = useState(item?.day || new Date().getDate());
  const [categoryId, setCategoryId] = useState(item?.categoryId || "contas");
  const [accountId, setAccountId] = useState(item?.accountId || state.accounts[0]?.id || "");
  const [active, setActive] = useState(item?.active !== false);
  const [touched, setTouched] = useState(false);
  const value = validAmount(amount);

  const paidTx = editing && due ? state.transactions.find((t) => t.fixedId === item.id && t.date.slice(0, 7) === due.slice(0, 7)) : null;
  const dueMonth = due ? MONTHS[fromISO(due).getMonth()].toLowerCase() : "";

  const save = (close) => {
    setTouched(true);
    if (!value || !name.trim()) return;
    upsert("fixed", { ...(item || {}), name: name.trim(), amount: value, kind, day: Math.min(31, Math.max(1, Number(day) || 1)), categoryId: kind === "income" && categoryId === "contas" ? "renda" : categoryId, accountId, active });
    ui.toast(editing ? "Fixo atualizado" : "Fixo criado");
    close();
  };

  const togglePaid = () => {
    if (paidTx) {
      remove("transactions", paidTx.id);
      ui.toast("Desmarcado");
    } else {
      upsert("transactions", {
        date: due <= today() ? due : today(), amount: item.kind === "income" ? item.amount : -item.amount,
        merchant: item.name, description: item.name, categoryId: item.categoryId, accountId: item.accountId, note: "", fixedId: item.id,
      });
      ui.toast(item.kind === "income" ? "Marcado como recebido" : "Marcado como pago");
    }
  };

  return (
    <Sheet title={editing ? item.name : "Novo fixo"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" style={{ flex: "0 0 auto" }} aria-label="Apagar" onClick={() => { remove("fixed", item.id); ui.toast("Fixo apagado", () => upsert("fixed", item)); close(); }}><Icon name="trash" /></button>}
          <button className="btn" onClick={() => save(close)}>Salvar</button>
        </>
      )}>
      {editing && due && item.active !== false && (
        <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div className={`ico-tile ${paidTx ? "brand" : ""}`}><Icon name={paidTx ? "check" : "clock"} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{paidTx ? (item.kind === "income" ? "Recebido" : "Pago") : "Pendente"} em {dueMonth}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}><Money value={item.amount} /> · vence dia {item.day}</div>
          </div>
          <button className={`btn sm ${paidTx ? "ghost" : "brand"}`} onClick={togglePaid}>{paidTx ? "Desfazer" : item.kind === "income" ? "Recebi" : "Paguei"}</button>
        </div>
      )}
      <Seg value={kind} onChange={setKind} label="Tipo" options={[{ value: "expense", label: "Gasto fixo" }, { value: "income", label: "Renda fixa" }]} />
      <AmountInput value={amount} onChange={setAmount} error={touched && !value ? "Coloca um valor" : ""} />
      <Field id="fname" label="Nome" error={touched && !name.trim() ? "Dá um nome" : ""}>
        <input id="fname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "income" ? "Ex: Salário, Estágio" : "Ex: Aluguel, Netflix"} />
      </Field>
      <Field id="day" label={kind === "income" ? "Dia que cai" : "Dia do vencimento"} help="Se o mês não tiver esse dia, usamos o último.">
        <input id="day" className="input" type="number" inputMode="numeric" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      <CategoryPicker categories={state.categories} value={categoryId} onChange={setCategoryId} />
      <AccountPicker accounts={state.accounts} value={accountId} onChange={setAccountId} allowNone />
      {editing && (
        <div className="setting-row">
          <div className="t">Ativo<small>Pause sem apagar o histórico</small></div>
          <Switch checked={active} onChange={setActive} label="Ativo" />
        </div>
      )}
    </Sheet>
  );
}
