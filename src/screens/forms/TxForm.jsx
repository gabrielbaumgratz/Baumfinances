import { useMemo, useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { guessCategory } from "../../lib/categories.js";
import { today } from "../../lib/dates.js";
import Sheet from "../../components/Sheet.jsx";
import { Field, Seg } from "../../components/ui.jsx";
import { AccountPicker, AmountInput, CategoryPicker, toInput, validAmount } from "./shared.jsx";

export default function TxForm({ item, onClose }) {
  const { state, upsert, remove } = useStore();
  const ui = useUI();
  const editing = !!item?.id;
  const [kind, setKind] = useState(item ? (item.amount > 0 ? "in" : "out") : "out");
  const [amount, setAmount] = useState(toInput(item?.amount));
  const [merchant, setMerchant] = useState(item?.merchant || item?.description || "");
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");
  const [accountId, setAccountId] = useState(item?.accountId || state.accounts[0]?.id || "");
  const [date, setDate] = useState(item?.date || today());
  const [note, setNote] = useState(item?.note || "");
  const [touched, setTouched] = useState(false);
  const [catTouched, setCatTouched] = useState(!!item?.categoryId);

  const merchants = useMemo(() => [...new Set(state.transactions.map((t) => t.merchant).filter(Boolean))].sort(), [state.transactions]);
  const value = validAmount(amount);
  const autoCat = guessCategory({ merchant, amount: kind === "in" ? 1 : -1 }, state.categories, state.transactions);
  const cat = catTouched ? categoryId : merchant ? autoCat : categoryId || (kind === "in" ? "renda" : "");

  const save = (close) => {
    setTouched(true);
    if (!value || !merchant.trim()) return;
    upsert("transactions", {
      ...(item || {}),
      amount: kind === "in" ? value : -value,
      merchant: merchant.trim(),
      description: item?.description || merchant.trim(),
      categoryId: cat || "outros",
      accountId,
      date,
      note: note.trim(),
    });
    ui.toast(editing ? "Lançamento atualizado" : "Lançamento salvo");
    close();
  };

  const del = (close) => {
    remove("transactions", item.id);
    ui.toast("Lançamento excluído", () => upsert("transactions", item));
    close();
  };

  return (
    <Sheet title={editing ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" onClick={() => del(close)}>Excluir</button>}
          <button className="btn" onClick={() => save(close)}>Salvar</button>
        </>
      )}>
      <Seg value={kind} onChange={setKind} label="Tipo" options={[{ value: "out", label: "Saída" }, { value: "in", label: "Entrada" }]} />
      <AmountInput value={amount} onChange={setAmount} error={touched && !value ? "Informe um valor maior que zero" : ""} />
      <Field id="merchant" label={kind === "in" ? "Origem" : "Estabelecimento"} error={touched && !merchant.trim() ? "Informe o estabelecimento ou a origem" : ""}>
        <input id="merchant" className="input" list="merchants" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={kind === "in" ? "Salário, transferência" : "Mercado, farmácia, aplicativo"} autoComplete="off" />
        <datalist id="merchants">{merchants.map((m) => <option key={m} value={m} />)}</datalist>
      </Field>
      <CategoryPicker categories={state.categories} value={cat} onChange={(v) => { setCategoryId(v); setCatTouched(true); }} />
      <AccountPicker accounts={state.accounts} value={accountId} onChange={setAccountId} allowNone />
      <Field id="date" label="Data">
        <input id="date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value || today())} />
      </Field>
      <Field id="note" label="Motivo" help="Opcional. Ajuda a lembrar por que o gasto aconteceu.">
        <textarea id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Sheet>
  );
}
