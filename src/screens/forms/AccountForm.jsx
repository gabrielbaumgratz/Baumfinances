import { useState } from "react";
import { useStore, ACCOUNT_COLORS } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { accountBalance } from "../../lib/selectors.js";
import { parseMoney } from "../../lib/format.js";
import Sheet from "../../components/Sheet.jsx";
import Icon from "../../components/Icon.jsx";
import { AccChip, Field, Seg, Switch } from "../../components/ui.jsx";

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
    if (txCount && !confirm(`Apagar "${item.name}" e os ${txCount} lançamentos dela? Não dá pra desfazer.`)) return;
    update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== item.id), transactions: s.transactions.filter((t) => t.accountId !== item.id) }));
    if (!txCount) ui.toast("Conta apagada", () => upsert("accounts", item));
    close();
  };

  return (
    <Sheet title={editing ? "Editar conta" : "Nova conta"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" style={{ flex: "0 0 auto" }} aria-label="Apagar conta" onClick={() => del(close)}><Icon name="trash" /></button>}
          <button className="btn" onClick={() => save(close)}>Salvar</button>
        </>
      )}>
      <div className="row" style={{ justifyContent: "center", padding: "8px 0" }}>
        <AccChip acc={{ color, bank: bank || name || "?" }} size={56} />
      </div>
      <Seg value={type} onChange={setType} label="Tipo de conta" options={TYPES} />
      <Field id="aname" label="Nome" error={touched && !name.trim() ? "Dá um nome pra conta" : ""}>
        <input id="aname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Conta principal, Cartão roxinho" />
      </Field>
      <Field id="abank" label="Banco">
        <input id="abank" className="input" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ex: Nubank, Inter, Itaú, Caixa" />
      </Field>
      <Field id="abal" label={type === "credit" ? "Fatura atual" : "Saldo atual"} help={type === "credit" ? "Quanto você deve no cartão agora. Entra negativo no saldo total." : "Quanto tem na conta hoje. Daqui pra frente o app calcula sozinho."}>
        <input id="abal" className="input" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^\d.,-]/g, ""))} placeholder="0,00" />
      </Field>
      <div className="field">
        <span className="label">Cor</span>
        <div className="chips wrap" role="radiogroup" aria-label="Cor">
          {ACCOUNT_COLORS.map((c) => (
            <button key={c} role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)}
              style={{ width: 40, height: 40, borderRadius: 12, background: c, display: "grid", placeItems: "center", color: "#fff", outline: color === c ? "2px solid var(--ink)" : "none", outlineOffset: 2 }}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-row">
        <div className="t">Fora do saldo total<small>Ex: conta de outra pessoa, investimento que você não mexe</small></div>
        <Switch checked={hidden} onChange={setHidden} label="Fora do saldo total" />
      </div>
    </Sheet>
  );
}
