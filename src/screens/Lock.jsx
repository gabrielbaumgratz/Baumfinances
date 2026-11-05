import { useEffect, useRef, useState } from "react";
import { useStore, readGuard } from "../lib/store.jsx";
import { useAuth } from "./auth/AuthGate.jsx";
import { PIN } from "../config.js";
import Logo from "../components/Logo.jsx";

export default function Lock() {
  const { unlock, eraseAll, ns } = useStore();
  const auth = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [guard, setGuard] = useState(() => readGuard(ns));
  const [now, setNow] = useState(Date.now());
  const [forgot, setForgot] = useState(false);
  const input = useRef(null);

  useEffect(() => { input.current?.focus(); }, []);
  const waiting = guard.until > now;
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [waiting, now]);

  const submit = async () => {
    if (busy || waiting || pin.length < PIN.min) return;
    setBusy(true);
    try {
      await unlock(pin);
    } catch {
      setPin("");
      const g = readGuard(ns);
      setGuard(g);
      setNow(Date.now());
      setError(g.until > Date.now() ? "Muitas tentativas erradas." : "PIN incorreto.");
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen page" style={{ justifyContent: "center", textAlign: "center", alignItems: "center" }}>
      <Logo size={30} />
      {!forgot ? (
        <>
          <p style={{ margin: "40px 0 20px", color: "var(--ink-2)" }}>Digite seu PIN</p>
          <input ref={input} className="input pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={PIN.max}
            aria-label="PIN" value={pin} disabled={waiting || busy} style={{ maxWidth: 280 }}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, PIN.max)); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
          <div className="err" role="alert" style={{ minHeight: 20, marginTop: 10 }}>
            {waiting ? `Aguarde ${Math.ceil((guard.until - now) / 1000)} s para tentar de novo.` : error}
          </div>
          <button className="btn" style={{ minWidth: 200, marginTop: 8 }} disabled={busy || waiting || pin.length < PIN.min} onClick={submit}>
            {busy ? "Verificando..." : "Desbloquear"}
          </button>
          <div className="row" style={{ gap: 24, marginTop: 24 }}>
            <button className="link" onClick={() => setForgot(true)}>Esqueci o PIN</button>
            {auth && <button className="link" onClick={auth.signOut}>Sair da conta</button>}
          </div>
        </>
      ) : (
        <div style={{ marginTop: 40, maxWidth: 340 }}>
          <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
            Seus dados são criptografados com o PIN e não ficam em nenhum servidor. Sem ele, não há como recuperá-los.
            Você pode excluir os dados deste aparelho e começar de novo. Se tiver uma cópia exportada, poderá restaurá-la depois.
          </p>
          <div className="stack" style={{ gap: 8 }}>
            <button className="btn danger block" onClick={() => confirm("Excluir todos os dados deste aparelho?") && eraseAll()}>Excluir dados e recomeçar</button>
            <button className="btn ghost block" onClick={() => setForgot(false)}>Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
