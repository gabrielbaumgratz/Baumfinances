export function Field({ label, help, error, children, id }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {error ? <span className="err" role="alert">{error}</span> : help && <span className="help">{help}</span>}
    </div>
  );
}

export function Seg({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Tabs({ value, onChange, options, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {text && <span>{text}</span>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function Dot({ color }) {
  return <span className="dot" style={{ background: color }} aria-hidden="true" />;
}

export function Meter({ value, tone = "" }) {
  return <div className={`meter ${tone}`}><i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function SectionHead({ title, children }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <div className="spacer" />
      {children}
    </div>
  );
}
