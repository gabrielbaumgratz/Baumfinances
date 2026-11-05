import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { pinProblem } from "../lib/pin.js";
import { PIN } from "../config.js";
import Logo from "../components/Logo.jsx";
import { Field } from "../components/ui.jsx";

/** Etapa obrigatória: sem PIN, nenhum dado é gravado. */
export default function CreatePin() {
  const { setPin } = useStore();
  const [pin, setValue] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = (v) => v.replace(/\D/g, "").slice(0, PIN.max);

  const save = async () => {
    const p = pinProblem(pin);
    if (p) return setError(p);
    if (pin !== pin2) return setError("Os PINs não conferem.");
    setBusy(true);
    await setPin(pin);
  };

  return (
    <div className="center-screen page">
      <Logo size={30} />
      <h1 style={{ fontSize: "clamp(1.8rem, 7vw, 2.2rem)" }}>Crie seu PIN</h1>
      <p className="lead" style={{ marginBottom: 28 }}>
        O PIN protege o app e criptografa seus dados neste aparelho. Ele será pedido sempre que você abrir o app.
      </p>
      <div className="stack" style={{ gap: 16 }}>
        <Field id="cp-1" label="PIN" help={`De ${PIN.min} a ${PIN.max} números. Quanto mais longo, mais seguro.`}>
          <input id="cp-1" className="input pin" type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={(e) => { setValue(clean(e.target.value)); setError(""); }} />
        </Field>
        <Field id="cp-2" label="Confirme o PIN">
          <input id="cp-2" className="input pin" type="password" inputMode="numeric" autoComplete="new-password" value={pin2} onChange={(e) => { setPin2(clean(e.target.value)); setError(""); }} onKeyDown={(e) => e.key === "Enter" && save()} />
        </Field>
        {error && <div className="err" role="alert">{error}</div>}
        <p className="notice">Se você esquecer o PIN, não será possível recuperar os dados. Exporte uma cópia de vez em quando.</p>
        <button className="btn block" disabled={busy} onClick={save}>{busy ? "Protegendo seus dados..." : "Criar PIN"}</button>
      </div>
    </div>
  );
}
