import { fmt, fmtSigned } from "../lib/format.js";
import { useHide } from "../lib/store.jsx";

/** Money value that respects the "hide values" privacy toggle. */
export default function Money({ value, signed = false, className = "", split = false }) {
  const hide = useHide();
  const text = signed ? fmtSigned(value) : fmt(value);
  if (hide) return <span className={`num ${className}`} aria-label="valor oculto">R$ ••••</span>;
  if (split) {
    const i = text.lastIndexOf(",");
    return (
      <span className={`num ${className}`}>
        {text.slice(0, i)}<span className="cents">{text.slice(i)}</span>
      </span>
    );
  }
  return <span className={`num ${className}`}>{text}</span>;
}
