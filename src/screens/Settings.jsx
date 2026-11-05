import { useStore } from "../lib/store.jsx";
import { useUI } from "../lib/ui-state.jsx";
import { accountBalance } from "../lib/selectors.js";
import { cryptoAvailable } from "../lib/vault.js";
import { APP } from "../config.js";
import Icon from "../components/Icon.jsx";
import Money from "../components/Money.jsx";
import { Dot, Field, SectionHead, Seg, Switch } from "../components/ui.jsx";

const LOCK_OPTIONS = [
  { value: 0, label: "Imediato" }, { value: 1, label: "1 min" }, { value: 5, label: "5 min" }, { value: 15, label: "15 min" },
];

export default function Settings({ go }) {
  const { state, setSettings, eraseAll, hasPin, lock } = useStore();
  const ui = useUI();
  const s = state.settings;
  const pinOn = hasPin();

  return (
    <div className="page narrow">
      <header className="top"><h1>Ajustes</h1></header>
      <div className="stack">
        <section>
          <SectionHead title="Perfil" />
          <Field id="uname" label="Nome" help="Usado apenas para a saudação na tela inicial.">
            <input id="uname" className="input" value={s.name} maxLength={60} autoComplete="given-name" onChange={(e) => setSettings({ name: e.target.value })} placeholder="Como você quer ser chamado" />
          </Field>
        </section>

        <section>
          <SectionHead title="Aparência" />
          <div className="stack" style={{ gap: 0 }}>
            <div className="set" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="body"><div className="t">Tema</div></div>
              <div style={{ width: 260 }}>
                <Seg value={s.theme} onChange={(theme) => setSettings({ theme })} label="Tema" options={[{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }, { value: "system", label: "Sistema" }]} />
              </div>
            </div>
            <div className="set">
              <div className="body"><div className="t">Texto grande</div><div className="d">Aumenta letras e botões</div></div>
              <Switch checked={s.bigText} onChange={(bigText) => setSettings({ bigText })} label="Texto grande" />
            </div>
          </div>
        </section>

        <section>
          <SectionHead title="Privacidade e segurança" />
          <div style={{ borderTop: "1px solid var(--line)" }}>
            <div className="set">
              <div className="body">
                <div className="t">Bloqueio com PIN</div>
                <div className="d">{cryptoAvailable() ? "Pede um PIN ao abrir e criptografa os dados no aparelho" : "Indisponível neste navegador"}</div>
              </div>
              <Switch checked={pinOn} label="Bloqueio com PIN" onChange={() => cryptoAvailable() && ui.open("pin", { mode: pinOn ? "off" : "on" })} />
            </div>
            {pinOn && (
              <>
                <div className="set">
                  <div className="body"><div className="t">Bloquear automaticamente</div><div className="d">Depois de sair do app</div></div>
                  <div style={{ width: 300 }}>
                    <Seg value={s.lockAfter ?? 1} onChange={(lockAfter) => setSettings({ lockAfter })} label="Tempo para bloquear" options={LOCK_OPTIONS} />
                  </div>
                </div>
                <button className="set" onClick={() => ui.open("pin", { mode: "change" })}><div className="body"><div className="t">Alterar PIN</div></div></button>
                <button className="set" onClick={lock}><div className="body"><div className="t">Bloquear agora</div></div></button>
              </>
            )}
            <div className="set">
              <div className="body"><div className="t">Ocultar valores</div><div className="d">Esconde os números na tela</div></div>
              <Switch checked={s.hideValues} onChange={(hideValues) => setSettings({ hideValues })} label="Ocultar valores" />
            </div>
            <a className="set" href="#/privacidade" onClick={(e) => { e.preventDefault(); go("privacidade"); }} style={{ textDecoration: "none" }}>
              <div className="body"><div className="t">Política de Privacidade</div><div className="d">Aceita em {s.consentAt ? new Date(s.consentAt).toLocaleDateString("pt-BR") : "data não registrada"}</div></div>
              <Icon name="right" size={16} />
            </a>
          </div>
        </section>

        <section>
          <SectionHead title="Contas"><button onClick={() => ui.open("account")}>Adicionar</button></SectionHead>
          <div className="list">
            {state.accounts.map((a) => (
              <button key={a.id} className="item" onClick={() => ui.open("account", { item: a })}>
                <Dot color={a.color} />
                <div className="body"><div className="t">{a.name}</div><div className="m">{a.bank}{a.hidden ? ", fora do saldo total" : ""}</div></div>
                <div className="v"><Money value={accountBalance(a, state.transactions)} /></div>
              </button>
            ))}
            {!state.accounts.length && <div className="empty">Nenhuma conta cadastrada.</div>}
          </div>
        </section>

        <section>
          <SectionHead title="Dados" />
          <div style={{ borderTop: "1px solid var(--line)" }}>
            <button className="set" onClick={() => ui.open("category")}><div className="body"><div className="t">Categorias e limites</div><div className="d">Defina um limite mensal por categoria</div></div></button>
            <button className="set" onClick={() => ui.open("import")}><div className="body"><div className="t">Importar extrato</div><div className="d">Arquivo OFX ou CSV do seu banco</div></div></button>
            <button className="set" onClick={() => ui.open("backup", { mode: "export" })}><div className="body"><div className="t">Exportar dados</div><div className="d">Cópia de todas as informações, com opção de criptografia</div></div></button>
            <button className="set" onClick={() => ui.open("backup", { mode: "restore" })}><div className="body"><div className="t">Restaurar dados</div><div className="d">A partir de um arquivo exportado</div></div></button>
            <button className="set" onClick={() => {
              if (confirm("Excluir todos os dados deste aparelho? Esta ação não pode ser desfeita.")) { eraseAll(); location.hash = ""; }
            }}><div className="body"><div className="t danger-text">Excluir todos os dados</div><div className="d">Remove tudo deste aparelho, imediatamente</div></div></button>
          </div>
        </section>

        <p className="muted" style={{ fontSize: "0.8rem" }}>{APP.name} {APP.version}. Seus dados ficam apenas neste aparelho.</p>
      </div>
    </div>
  );
}
