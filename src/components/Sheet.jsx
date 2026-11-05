import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

/** Bottom sheet on mobile, centered dialog on desktop. Esc / backdrop closes. */
export default function Sheet({ title, onClose, children, footer }) {
  const [closing, setClosing] = useState(false);
  const ref = useRef(null);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 170);
  };

  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    (ref.current?.querySelector("#amount, .sheet-body input:not([type=file])") || ref.current?.querySelector(".sheet-body button"))?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`scrim${closing ? " closing" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Fechar"><Icon name="x" /></button>
        </div>
        <div className="sheet-body">{typeof children === "function" ? children(close) : children}</div>
        {footer && <div className="sheet-foot">{typeof footer === "function" ? footer(close) : footer}</div>}
      </div>
    </div>
  );
}
