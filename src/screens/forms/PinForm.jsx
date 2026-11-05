import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import Sheet from "../../components/Sheet.jsx";
import { Field } from "../../components/ui.jsx";

const WEAK = new Set(["000000", "111111", "123456", "654321", "121212", "112233", "222222", "999999", "123123"]);

function PinInput({ id, label, value, onChange, error, help }) {
  return (
    <Field id={id} label={label} error={error} help={help}>
      <input id={id} className="input pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6}
        value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))} />
    </Field>
  );
}

/** mode: "on" (criar), "off" (desativar), "change" (trocar) */
export default function PinForm({ mode, onClose }) {
  const { setPin, removePin, checkPin } = useStore();
  const ui = useUI();
  const [current, setCurrent] = useState("");
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const needsCurrent = mode !== "on";
  const needsNew = mode !== "off";

  const submit = async (close) => {
    setError("");
    if (needsCurrent && !(await checkPin(current))) return setError("PIN atual incorreto.");
    if (needsNew) {
      if (pin.length !== 6) return setError("O PIN precisa ter 6 dígitos.");
      if (WEAK.has(pin)) return setError("Escolha um PIN menos óbvio.");
      if (pin !== confirmPin) return setError("Os PINs não conferem.");
    }
    setBusy(true);
    try {
      if (mode === "off") { removePin(); ui.toast("Bloqueio desativado"); }
      else { await setPin(pin); ui.toast(mode === "on" ? "Bloqueio ativado" : "PIN alterado"); }
      close();
    } finally {
      setBusy(false);
    }
  };

  const title = { on: "Ativar bloqueio", off: "Desativar bloqueio", change: "Alterar PIN" }[mode];
  return (
    <Sheet title={title} onClose={onClose} footer={(close) => <button className="btn" disabled={busy} onClick={() => submit(close)}>{mode === "off" ? "Desativar" : "Salvar"}</button>}>
      {mode === "on" && (
        <p className="notice">
          Com o PIN ativo, seus dados ficam criptografados neste aparelho. Se você esquecer o PIN, não será possível recuperá-los.
          Recomendamos exportar seus dados periodicamente.
        </p>
      )}
      {mode === "off" && <p className="notice">Ao desativar, os dados voltam a ser salvos sem criptografia neste aparelho.</p>}
      {needsCurrent && <PinInput id="pin-cur" label="PIN atual" value={current} onChange={setCurrent} />}
      {needsNew && (
        <>
          <PinInput id="pin-new" label="Novo PIN" value={pin} onChange={setPinValue} help="6 dígitos" />
          <PinInput id="pin-conf" label="Confirme o PIN" value={confirmPin} onChange={setConfirm} />
        </>
      )}
      {error && <div className="err" role="alert">{error}</div>}
    </Sheet>
  );
}
