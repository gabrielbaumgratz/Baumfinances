import Icon from "../../components/Icon.jsx";
import { AccChip } from "../../components/ui.jsx";
import { parseMoney } from "../../lib/format.js";

export function AmountInput({ value, onChange, label = "Valor", error }) {
  return (
    <div>
      <label className="sr-only" htmlFor="amount">{label}</label>
      <div className="amount-input">
        <span>R$</span>
        <input id="amount" inputMode="decimal" style={{ width: `${Math.max(4, (value || "0,00").length) + 0.5}ch` }} autoComplete="off" placeholder="0,00" value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))} aria-invalid={!!error} />
      </div>
      {error && <div className="err-text" role="alert" style={{ textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export function CategoryPicker({ categories, value, onChange }) {
  return (
    <div className="field">
      <span className="label">Categoria</span>
      <div className="cat-grid" role="group" aria-label="Categoria">
        {categories.map((c) => (
          <button key={c.id} type="button" className="cat-opt" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
            <Icon name={c.icon} size={22} />
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AccountPicker({ accounts, value, onChange, allowNone }) {
  if (!accounts.length) return null;
  return (
    <div className="field">
      <span className="label">Conta</span>
      <div className="chips wrap" role="group" aria-label="Conta">
        {allowNone && <button type="button" className="chip" aria-pressed={!value} onClick={() => onChange("")}>Nenhuma</button>}
        {accounts.map((a) => (
          <button key={a.id} type="button" className="chip" aria-pressed={value === a.id} onClick={() => onChange(a.id)}>
            <AccChip acc={a} size={22} />{a.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export const toInput = (n) => (n || n === 0 ? String(Math.abs(n)).replace(".", ",") : "");
export const validAmount = (s) => {
  const n = parseMoney(s);
  return Number.isFinite(n) && n > 0 ? Math.round(Math.abs(n) * 100) / 100 : null;
};
