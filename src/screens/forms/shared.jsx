import { Dot } from "../../components/ui.jsx";
import { parseMoney } from "../../lib/format.js";

export function AmountInput({ value, onChange, label = "Valor", error }) {
  return (
    <div>
      <label className="sr-only" htmlFor="amount">{label}</label>
      <div className="amount">
        <span>R$</span>
        <input id="amount" inputMode="decimal" autoComplete="off" placeholder="0,00" value={value}
          style={{ width: `${Math.max(4, (value || "0,00").length) + 0.5}ch` }}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))} aria-invalid={!!error} />
      </div>
      {error && <div className="err" role="alert" style={{ textAlign: "center" }}>{error}</div>}
    </div>
  );
}

export function CategoryPicker({ categories, value, onChange }) {
  return (
    <div className="field">
      <span className="label">Categoria</span>
      <div className="chips wrap" role="group" aria-label="Categoria">
        {categories.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>{c.name}</button>
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
          <button key={a.id} type="button" className="chip" aria-pressed={value === a.id} onClick={() => onChange(a.id)}><Dot color={a.color} />{a.name}</button>
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
