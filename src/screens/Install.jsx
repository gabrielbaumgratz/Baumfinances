import { platform, useInstallPrompt } from "../lib/pwa.js";
import { APP } from "../config.js";
import Logo from "../components/Logo.jsx";

const STEPS = {
  ios: [
    "Toque no botão Compartilhar, na barra do Safari.",
    "Role a lista e toque em Adicionar à Tela de Início.",
    "Toque em Adicionar e abra o Prumo pelo novo ícone.",
  ],
  "ios-other": [
    "No iPhone, a instalação funciona pelo Safari.",
    "Copie o endereço desta página e abra no Safari.",
    "Depois, toque em Compartilhar e em Adicionar à Tela de Início.",
  ],
  android: [
    "Toque no menu do Chrome, os três pontos no canto superior.",
    "Toque em Instalar app ou Adicionar à tela inicial.",
    "Confirme e abra o Prumo pelo novo ícone.",
  ],
  desktop: [
    "Use o Chrome ou o Edge.",
    "Clique no ícone de instalação na barra de endereço, ou no menu, em Instalar Prumo.",
    "Abra o Prumo pelo atalho criado.",
  ],
};

export default function Install() {
  const p = platform();
  const install = useInstallPrompt();
  return (
    <div className="center-screen page">
      <Logo size={30} />
      <h1>Instale o {APP.name} para continuar</h1>
      <p className="lead">
        Por segurança, o {APP.name} só funciona instalado como aplicativo. Assim seus dados ficam isolados do navegador
        e protegidos pelo seu PIN.
      </p>
      {install && (
        <button className="btn block" style={{ marginTop: 32 }} onClick={install}>Instalar aplicativo</button>
      )}
      <ol className="points" style={{ listStyle: "none" }}>
        {STEPS[p].map((s, i) => (
          <li key={i}><b>Passo {i + 1}</b>{s}</li>
        ))}
      </ol>
      <div className="spacer" style={{ minHeight: 24 }} />
      <p className="muted" style={{ fontSize: "0.82rem" }}>
        <a href="#/privacidade" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Política de Privacidade</a>
        <span style={{ marginLeft: 12 }}>Versão {APP.versionLabel}</span>
      </p>
    </div>
  );
}
