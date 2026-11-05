import { useState } from "react";
import { useStore, ACCOUNT_COLORS } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { accountBalance } from "../../lib/selectors.js";
import { parseMoney } from "../../lib/format.js";
import Sheet from "../../components/Sheet.jsx";
import { Field, Seg, Switch } from "../../components/ui.jsx";

const TYPES = [
  { value: "checking", label: "Conta" },
  { value: "credit", label: "Cartão" },
  { value: "savings", label: "Reserva" },
  { value: "cash", label: "Dinheiro" },
];

export default function AccountForm({ item, onClose }) {
  const { state, upsert, remove, update } = useStore();
  const ui = useUI();
  const editing = !!item?.id;
  const current = editing ? accountBalance(item, state.transactions) : 0;
  const [name, setName] = useState(item?.name || "");
  const [bank, setBank] = useState(item?.bank || "");
  const [type, setType] = useState(item?.type || "checking");
  const [color, setColor] = useState(item?.color || ACCOUNT_COLORS[state.accounts.length % ACCOUNT_COLORS.length]);
  const [balance, setBalance] = useState(editing ? String(current.toFixed(2)).replace(".", ",") : "");
  const [hidden, setHidden] = useState(!!item?.hidden);
  const [touched, setTouched] = useState(false);
  const txCount = editing ? state.transactions.filter((t) => t.accountId === item.id).length : 0;

  const save = (close) => {
    setTouched(true);
    if (!name.trim()) return;
    let b = parseMoney(balance || "0");
    if (!Number.isFinite(b)) b = 0;
    if (type === "credit" && b > 0 && !editing) b = -b; // card bill typed as positive = debt
    const initial = (item?.initial || 0) + (b - current);
    upsert("accounts", { ...(item || {}), name: name.trim(), bank: bank.trim(), type, color, initial: Math.round(initial * 100) / 100, hidden });
    ui.toast(editing ? "Conta atualizada" : "Conta adicionada");
    close();
  };

  const del = (close) => {
    if (txCount && !confirm(`Excluir "${item.name}" e os ${txCount} lançamentos dela? Esta ação não pode ser desfeita.`)) return;
    update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== item.id), transactions: s.transactions.filter((t) => t.accountId !== item.id) }));
    if (!txCount) ui.toast("Conta excluída", () => upsert("accounts", item));
    close();
  };

  return (
    <Sheet title={editing ? "Editar conta" : "Nova conta"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" onClick={() => del(close)}>Excluir</button>}
          <button className="btn" onClick={() => save(close)}>Salvar</button>
        </>
      )}>
      <Seg value={type} onChange={setType} label="Tipo de conta" options={TYPES} />
      <Field id="aname" label="Nome" error={touched && !name.trim() ? "Informe um nome" : ""}>
        <input id="aname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Conta principal" />
      </Field>
      <Field id="abank" label="Banco">
        <input id="abank" className="input" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Nome do banco" />
      </Field>
      <Field id="abal" label={type === "credit" ? "Fatura atual" : "Saldo atual"} help={type === "credit" ? "Valor em aberto no cartão. Entra como negativo no saldo total." : "Saldo de hoje. A partir daqui, o app calcula automaticamente."}>
        <input id="abal" className="input" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^\d.,-]/g, ""))} placeholder="0,00" />
      </Field>
      <div className="field">
        <span className="label">Cor</span>
        <div className="chips wrap" role="radiogroup" aria-label="Cor">
          {ACCOUNT_COLORS.map((c) => (
            <button key={c} role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)}
              style={{ width: 32, height: 32, borderRadius: 6, background: c, outline: color === c ? "2px solid var(--ink)" : "none", outlineOffset: 2 }} />
          ))}
        </div>
      </div>
      <div className="set" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="body"><div className="t">Fora do saldo total</div><div className="d">Para contas que não devem somar no saldo</div></div>
        <Switch checked={hidden} onChange={setHidden} label="Fora do saldo total" />
      </div>
    </Sheet>
  );
}
