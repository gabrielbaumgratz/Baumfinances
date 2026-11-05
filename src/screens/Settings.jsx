import { useRef } from "react";
import { useStore } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { accountBalance } from "../lib/selectors.js";
import { today } from "../lib/dates.js";
import Sheet from "../components/Sheet.jsx";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import Logo from "../components/Logo.jsx";
import { AccChip, Field, Seg, Switch } from "../components/ui.jsx";

export default function Settings({ onClose }) {
  const { state, setSettings, init, reset } = useStore();
  const ui = useUI();
  const fileRef = useRef(null);
  const s = state.settings;

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `baum-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (f) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.transactions) || !Array.isArray(data.accounts)) throw new Error();
      if (!confirm("Substituir tudo pelos dados do backup?")) return;
      init({ ...state, ...data });
      ui.toast("Backup restaurado");
    } catch {
      ui.toast("Arquivo de backup inválido");
    }
  };

  return (
    <Sheet title="Ajustes" onClose={onClose}>
      {(close) => (
        <>
          <Field id="uname" label="Como quer ser chamado?">
            <input id="uname" className="input" value={s.name} onChange={(e) => setSettings({ name: e.target.value })} placeholder="Seu nome" />
          </Field>

          <div className="field">
            <span className="label">Aparência</span>
            <Seg value={s.theme} onChange={(theme) => setSettings({ theme })} label="Tema" options={[
              { value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }, { value: "system", label: "Automático" },
            ]} />
          </div>

          <div className="card" style={{ padding: "4px 16px" }}>
            <div className="setting-row">
              <Icon name="text" />
              <div className="t">Texto grande<small>Letras e botões maiores</small></div>
              <Switch checked={s.bigText} onChange={(bigText) => setSettings({ bigText })} label="Texto grande" />
            </div>
            <div className="setting-row">
              <Icon name="eyeOff" />
              <div className="t">Esconder valores<small>Pra abrir o app em público</small></div>
              <Switch checked={s.hideValues} onChange={(hideValues) => setSettings({ hideValues })} label="Esconder valores" />
            </div>
          </div>

          <div>
            <div className="section-label">Contas e cartões</div>
            <div className="card card-flat"><div className="list">
              {state.accounts.map((a) => (
                <button key={a.id} className="item" onClick={() => ui.open("account", { item: a })}>
                  <AccChip acc={a} size={38} />
                  <div className="main-col"><div className="title">{a.name}</div><div className="meta">{a.bank}{a.hidden && " · fora do total"}</div></div>
                  <div className="amt"><Money value={accountBalance(a, state.transactions)} /></div>
                </button>
              ))}
              <button className="item" onClick={() => ui.open("account")}>
                <div className="ico-tile brand"><Icon name="plus" /></div>
                <div className="main-col"><div className="title">Adicionar conta ou cartão</div></div>
              </button>
            </div></div>
          </div>

          <div>
            <div className="section-label">Dados</div>
            <div className="card" style={{ padding: "4px 16px" }}>
              <button className="setting-row" onClick={() => ui.open("category")}>
                <Icon name="tag" /><div className="t">Categorias e limites<small>Defina quanto quer gastar por mês</small></div><Icon name="right" size={18} />
              </button>
              <button className="setting-row" onClick={() => ui.open("import")}>
                <Icon name="upload" /><div className="t">Importar extrato<small>Arquivo OFX ou CSV do seu banco</small></div><Icon name="right" size={18} />
              </button>
              <button className="setting-row" onClick={exportBackup}>
                <Icon name="download" /><div className="t">Baixar backup<small>Salva tudo num arquivo .json</small></div>
              </button>
              <button className="setting-row" onClick={() => fileRef.current?.click()}>
                <Icon name="repeat" /><div className="t">Restaurar backup</div>
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importBackup(e.target.files[0])} />
            </div>
          </div>

          <div className="note row" style={{ alignItems: "flex-start", gap: 10 }}>
            <Icon name="bank" size={18} />
            <span>
              <b>Conexão automática com bancos (Open Finance)</b> precisa de um servidor e de um agregador autorizado pelo Banco Central.
              Por enquanto o baum funciona 100% no seu aparelho: importe o extrato OFX/CSV do seu banco. A estrutura já está pronta pra plugar isso depois.
            </span>
          </div>

          <button className="btn danger block" onClick={() => {
            if (confirm("Apagar todos os dados do baum neste aparelho? Baixe um backup antes se quiser guardar.")) { close(); reset(); }
          }}><Icon name="trash" size={18} />Apagar tudo</button>

          <div style={{ textAlign: "center", padding: "8px 0 4px", color: "var(--muted)", fontSize: "0.82rem" }}>
            <Logo size={22} />
            <div style={{ marginTop: 6 }}>Seus dados ficam só neste aparelho.</div>
          </div>
        </>
      )}
    </Sheet>
  );
}
