import { useState } from "react";
import { useStore, emptyState } from "../lib/store.jsx";
import { demoState } from "../lib/demo.js";
import { APP } from "../config.js";
import Logo from "../components/Logo.jsx";
import Icon from "../components/Icon.jsx";

export default function Onboarding({ go }) {
  const { init } = useStore();
  const [agree, setAgree] = useState(false);
  const start = (data) => init({ ...data, settings: { ...data.settings, consentAt: new Date().toISOString(), policyVersion: APP.policyVersion } });

  return (
    <div className="center-screen page">
      <Logo size={30} />
      <h1>{APP.tagline}</h1>
      <p className="lead">Saldo de todas as contas, para onde vai cada real e o que dá para planejar. Simples, em um só lugar.</p>
      <ul className="points">
        <li><b>Todas as contas juntas</b>Contas, cartões e reservas com saldo calculado automaticamente.</li>
        <li><b>Gastos explicados</b>Onde, quanto, quantas vezes e por quê.</li>
        <li><b>Planejamento</b>Gastos fixos, compras futuras e lista de desejos.</li>
        <li><b>Privado por padrão</b>Seus dados financeiros ficam apenas neste aparelho, criptografados. Sem rastreamento.</li>
      </ul>
      <div className="spacer" style={{ minHeight: 32 }} />
      <label className="consent" style={{ marginBottom: 16 }}>
        <button type="button" role="checkbox" aria-checked={agree} className={`check${agree ? " on" : ""}`} onClick={() => setAgree(!agree)} aria-label="Aceito a Política de Privacidade">
          {agree && <Icon name="check" size={14} stroke={2.4} />}
        </button>
        <span>Li e aceito a <a href="#/privacidade" onClick={(e) => { e.preventDefault(); go("privacidade"); }}>Política de Privacidade</a>.</span>
      </label>
      <div className="stack" style={{ gap: 8 }}>
        <button className="btn block" disabled={!agree} onClick={() => start(emptyState())}>Começar</button>
        <button className="btn block ghost" disabled={!agree} onClick={() => start(demoState())}>Ver com dados de exemplo</button>
      </div>
    </div>
  );
}
