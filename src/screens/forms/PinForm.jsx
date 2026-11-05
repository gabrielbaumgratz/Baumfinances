import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { pinProblem } from "../../lib/pin.js";
import { PIN } from "../../config.js";
import Sheet from "../../components/Sheet.jsx";
import { Field } from "../../components/ui.jsx";

function PinInput({ id, label, value, onChange, help }) {
  return (
    <Field id={id} label={label} help={help}>
      <input id={id} className="input pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={PIN.max}
        value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, PIN.max))} />
    </Field>
  );
}

/** Troca de PIN. O PIN é obrigatório e não pode ser desativado. */
export default function PinForm({ onClose }) {
  const { setPin, checkPin } = useStore();
  const ui = useUI();
  const [current, setCurrent] = useState("");
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (close) => {
    setError("");
    setBusy(true);
    try {
      if (!(await checkPin(current))) return setError("PIN atual incorreto.");
      const p = pinProblem(pin);
      if (p) return setError(p);
      if (pin !== confirmPin) return setError("Os PINs não conferem.");
      if (pin === current) return setError("O novo PIN precisa ser diferente do atual.");
      await setPin(pin);
      ui.toast("PIN alterado");
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Alterar PIN" onClose={onClose} footer={(close) => <button className="btn" disabled={busy} onClick={() => submit(close)}>{busy ? "Salvando..." : "Salvar"}</button>}>
      <PinInput id="pin-cur" label="PIN atual" value={current} onChange={setCurrent} />
      <PinInput id="pin-new" label="Novo PIN" value={pin} onChange={setPinValue} help={`De ${PIN.min} a ${PIN.max} números`} />
      <PinInput id="pin-conf" label="Confirme o novo PIN" value={confirmPin} onChange={setConfirm} />
      {error && <div className="err" role="alert">{error}</div>}
    </Sheet>
  );
}
