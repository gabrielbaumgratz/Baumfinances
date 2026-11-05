import Icon from "./Icon.jsx";
import { MONTHS, addMonths } from "../lib/dates.js";

export default function MonthSwitcher({ ym, onChange }) {
  const label = ym.y === new Date().getFullYear() ? MONTHS[ym.m] : `${MONTHS[ym.m]} de ${ym.y}`;
  return (
    <div className="month">
      <button className="icon-btn" onClick={() => onChange(addMonths(ym, -1))} aria-label="Mês anterior"><Icon name="left" size={18} /></button>
      <span aria-live="polite">{label}</span>
      <button className="icon-btn" onClick={() => onChange(addMonths(ym, 1))} aria-label="Próximo mês"><Icon name="right" size={18} /></button>
    </div>
  );
}
