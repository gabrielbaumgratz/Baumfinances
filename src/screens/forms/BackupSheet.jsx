import { useRef, useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { buildBackup, decryptBackup, inspectBackup } from "../../lib/backup.js";
import { saveTextFile } from "../../lib/files.js";
import { today } from "../../lib/dates.js";
import { APP } from "../../config.js";
import Sheet from "../../components/Sheet.jsx";
import { Field, Seg } from "../../components/ui.jsx";

const MIN = 8;

/** mode: "export" ou "restore" */
export default function BackupSheet({ mode, onClose }) {
  return mode === "restore" ? <Restore onClose={onClose} /> : <Export onClose={onClose} />;
}

function Export({ onClose }) {
  const { state } = useStore();
  const ui = useUI();
  const [kind, setKind] = useState("enc");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (close) => {
    setError("");
    if (kind === "enc") {
      if (pw.length < MIN) return setError(`A senha precisa ter pelo menos ${MIN} caracteres.`);
      if (pw !== pw2) return setError("As senhas não conferem.");
    }
    setBusy(true);
    try {
      const text = await buildBackup(state, kind === "enc" ? pw : null);
      await saveTextFile(`${APP.name.toLowerCase()}-dados-${today()}${kind === "enc" ? "-criptografado" : ""}.json`, text);
      ui.toast("Dados exportados");
      close();
    } catch {
      setError("Não foi possível exportar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Exportar dados" onClose={onClose} footer={(close) => <button className="btn" disabled={busy} onClick={() => run(close)}>Exportar</button>}>
      <p className="muted">Gera um arquivo com todas as suas informações, para guardar como cópia de segurança ou levar para outro aparelho.</p>
      <Seg value={kind} onChange={setKind} label="Formato" options={[{ value: "enc", label: "Criptografado" }, { value: "plain", label: "Sem criptografia" }]} />
      {kind === "enc" ? (
        <>
          <Field id="bk-pw" label="Senha do arquivo" help={`Pelo menos ${MIN} caracteres. Sem ela, o arquivo não pode ser aberto.`}>
            <input id="bk-pw" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field id="bk-pw2" label="Confirme a senha">
            <input id="bk-pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
        </>
      ) : (
        <p className="notice">O arquivo poderá ser lido por qualquer pessoa que tiver acesso a ele. Prefira o formato criptografado.</p>
      )}
      {error && <div className="err" role="alert">{error}</div>}
    </Sheet>
  );
}

function Restore({ onClose }) {
  const { state, init } = useStore();
  const ui = useUI();
  const input = useRef(null);
  const [pending, setPending] = useState(null);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = (data, close) => {
    if (!confirm("Substituir os dados atuais pelos dados do arquivo?")) return;
    try {
      init({ ...data, settings: { ...data.settings, consentAt: state.settings.consentAt, policyVersion: state.settings.policyVersion } });
      ui.toast("Dados restaurados");
      close();
    } catch {
      setError("O arquivo tem um formato inválido.");
    }
  };

  const pick = async (f, close) => {
    setError("");
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return setError("Arquivo grande demais.");
    try {
      const r = inspectBackup(await f.text());
      if (r.encrypted) setPending(r.json);
      else apply(r.data, close);
    } catch {
      setError("Arquivo não reconhecido.");
    }
  };

  const unlock = async (close) => {
    setBusy(true);
    setError("");
    try {
      const data = await decryptBackup(pending, pw);
      apply(data, close);
    } catch {
      setError("Senha incorreta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Restaurar dados" onClose={onClose}
      footer={pending ? (close) => <button className="btn" disabled={busy || !pw} onClick={() => unlock(close)}>Abrir arquivo</button> : null}>
      {(close) => (
        <>
          {!pending ? (
            <>
              <p className="muted">Selecione um arquivo exportado pelo {APP.name}. Os dados atuais serão substituídos.</p>
              <div className="drop" role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}>
                <b>Selecionar arquivo</b>
                <span style={{ fontSize: "0.85rem" }}>JSON</span>
              </div>
              <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => { pick(e.target.files[0], close); e.target.value = ""; }} />
            </>
          ) : (
            <Field id="rs-pw" label="Senha do arquivo">
              <input id="rs-pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
          )}
          {error && <div className="err" role="alert">{error}</div>}
        </>
      )}
    </Sheet>
  );
}
