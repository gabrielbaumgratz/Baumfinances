import Icon from "./Icon.jsx";

export function Field({ label, help, error, children, id }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {error ? <span className="err-text" role="alert">{error}</span> : help && <span className="help">{help}</span>}
    </div>
  );
}

export function Seg({ value, onChange, options, tone = "", label }) {
  return (
    <div className={`seg ${tone}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

export function Empty({ icon = "sparkle", title, text, action }) {
  return (
    <div className="empty">
      <div className="ico-tile"><Icon name={icon} size={24} /></div>
      <b>{title}</b>
      {text && <span>{text}</span>}
      {action}
    </div>
  );
}

export function CatIcon({ cat, size = 42 }) {
  return (
    <div className="ico-tile" style={{ width: size, height: size }}>
      <Icon name={cat?.icon || "dots"} size={size * 0.46} />
    </div>
  );
}

export function AccChip({ acc, size = 32 }) {
  if (!acc) return null;
  const letter = (acc.bank || acc.name || "?").trim()[0]?.toUpperCase();
  return (
    <span className="acc-chip" style={{ background: acc.color, width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {letter}
    </span>
  );
}

export function Meter({ value, tone = "" }) {
  return <div className={`meter ${tone}`}><i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
