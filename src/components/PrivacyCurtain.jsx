import { useEffect, useState } from "react";
import { Mark } from "./Logo.jsx";

/**
 * Cobre a tela quando o app sai de foco (troca de app, multitarefa).
 * Navegadores não permitem bloquear capturas de tela; isso reduz o que aparece
 * na tela de apps recentes e em gravações feitas fora do app.
 */
export default function PrivacyCurtain() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const hide = () => setOn(true);
    const show = () => setOn(document.hidden);
    document.addEventListener("visibilitychange", show);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", show);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("pagehide", hide);
    };
  }, []);
  if (!on) return null;
  return <div className="curtain" aria-hidden="true"><Mark size={56} /></div>;
}
