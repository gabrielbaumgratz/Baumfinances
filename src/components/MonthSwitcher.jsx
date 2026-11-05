import Icon from "./Icon.jsx";
import { MONTHS, addMonths } from "../lib/dates.js";

export default function MonthSwitcher({ ym, onChange }) {
  const now = new Date();
  const label = ym.y === now.getFullYear() ? MONTHS[ym.m] : `${MONTHS[ym.m].slice(0, 3)} ${ym.y}`;
  return (
    <div className="month">
      <button className="icon-btn" onClick={() => onChange(addMonths(ym, -1))} aria-label="Mês anterior"><Icon name="left" /></button>
      <span aria-live="polite">{label}</span>
      <button className="icon-btn" onClick={() => onChange(addMonths(ym, 1))} aria-label="Próximo mês"><Icon name="right" /></button>
    </div>
  );
}
