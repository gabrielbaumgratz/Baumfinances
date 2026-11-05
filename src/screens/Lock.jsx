import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store.jsx";
import Logo from "../components/Logo.jsx";

const MAX_TRIES = 5;

export default function Lock() {
  const { unlock, eraseAll } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [forgot, setForgot] = useState(false);
  const input = useRef(null);

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (waitUntil <= now) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [waitUntil, now]);

  const waiting = waitUntil > now;

  const submit = async (value) => {
    if (busy || waiting || value.length < 6) return;
    setBusy(true);
    try {
      await unlock(value);
    } catch {
      const n = tries + 1;
      setTries(n);
      setPin("");
      if (n % MAX_TRIES === 0) {
        setWaitUntil(Date.now() + 30000 * (n / MAX_TRIES));
        setNow(Date.now());
        setError("Muitas tentativas. Aguarde para tentar de novo.");
      } else setError("PIN incorreto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen page" style={{ justifyContent: "center", textAlign: "center", alignItems: "center" }}>
      <Logo size={30} />
      {!forgot ? (
        <>
          <p style={{ margin: "40px 0 20px", color: "var(--ink-2)" }}>Digite seu PIN para continuar</p>
          <input ref={input} className="input pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={6}
            aria-label="PIN" value={pin} disabled={waiting}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setPin(v); setError(""); if (v.length === 6) submit(v); }}
            style={{ maxWidth: 240 }} />
          <div className="err" role="alert" style={{ minHeight: 20, marginTop: 10 }}>
            {waiting ? `Tente novamente em ${Math.ceil((waitUntil - now) / 1000)} s.` : error}
          </div>
          <button className="link" style={{ marginTop: 24 }} onClick={() => setForgot(true)}>Esqueci o PIN</button>
        </>
      ) : (
        <div style={{ marginTop: 40, maxWidth: 340 }}>
          <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
            Seus dados são criptografados com o PIN e não ficam em nenhum servidor. Sem ele, não há como recuperá-los.
            Você pode excluir os dados deste aparelho e começar de novo. Se tiver um backup, poderá restaurá-lo depois.
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
