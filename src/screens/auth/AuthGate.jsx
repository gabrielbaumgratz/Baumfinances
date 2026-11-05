import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { sb, authError, passwordProblem, redirectUrl } from "../../lib/auth.js";
import { APP } from "../../config.js";
import { usePrivacyRoute, PublicPrivacy } from "../../components/PublicPrivacy.jsx";
import Logo from "../../components/Logo.jsx";
import Icon from "../../components/Icon.jsx";
import { Field } from "../../components/ui.jsx";

const AuthCtx = createContext(null);
/** { user, signOut, deleteAccount } quando há login; null quando o app roda sem servidor. */
export const useAuth = () => useContext(AuthCtx);

export default function AuthGate({ children }) {
  const privacy = usePrivacyRoute();
  const [phase, setPhase] = useState("loading"); // loading | out | recovery | enroll | verify | in
  const [user, setUser] = useState(null);

  const evaluate = useCallback(async (session) => {
    const c = await sb();
    if (!session?.user) { setUser(null); setPhase("out"); return; }
    setUser(session.user);
    const { data, error } = await c.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) { setPhase("out"); return; }
    if (data.currentLevel === "aal2") setPhase("in");
    else if (data.nextLevel === "aal2") setPhase("verify");
    else setPhase("enroll");
  }, []);

  useEffect(() => {
    let sub;
    (async () => {
      const c = await sb();
      const { data } = await c.auth.getSession();
      await evaluate(data.session);
      sub = c.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") { setUser(session?.user || null); setPhase("recovery"); return; }
        if (event === "SIGNED_OUT") { setUser(null); setPhase("out"); return; }
        if (event === "SIGNED_IN" || event === "MFA_CHALLENGE_VERIFIED") setTimeout(() => evaluate(session), 0);
      }).data.subscription;
    })();
    return () => sub?.unsubscribe();
  }, [evaluate]);

  const signOut = useCallback(async () => {
    const c = await sb();
    await c.auth.signOut({ scope: "local" });
  }, []);

  const deleteAccount = useCallback(async () => {
    const c = await sb();
    const { error } = await c.rpc("delete_user");
    if (error) throw error;
    await c.auth.signOut({ scope: "local" });
  }, []);

  if (phase === "loading") return <div className="center-screen"><Logo size={30} /></div>;
  if (privacy && phase !== "in") return <PublicPrivacy />;
  if (phase === "out") return <SignedOut />;
  if (phase === "recovery") return <Recovery onDone={() => signOut().then(() => setPhase("out"))} onCancel={signOut} />;
  if (phase === "enroll") return <Enroll2FA onDone={async () => evaluate((await (await sb()).auth.getSession()).data.session)} onCancel={signOut} />;
  if (phase === "verify") return <Verify2FA onDone={async () => evaluate((await (await sb()).auth.getSession()).data.session)} onCancel={signOut} />;
  return <AuthCtx.Provider value={{ user, signOut, deleteAccount }}>{children(user)}</AuthCtx.Provider>;
}

function Shell({ title, lead, children }) {
  return (
    <div className="center-screen page">
      <div className="row"><Logo size={30} /><span className="beta">{APP.versionLabel.toUpperCase()}</span></div>
      <h1 style={{ marginTop: 48, fontSize: "clamp(1.8rem, 7vw, 2.2rem)" }}>{title}</h1>
      {lead && <p className="lead" style={{ marginBottom: 28 }}>{lead}</p>}
      <div className="stack" style={{ gap: 16 }}>{children}</div>
    </div>
  );
}

function SignedOut() {
  const [view, setView] = useState("login"); // login | signup | forgot | sent
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentMsg, setSentMsg] = useState("");

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try { await fn(await sb()); } catch (e) { setError(authError(e)); } finally { setBusy(false); }
  };
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const login = () => run(async (c) => {
    if (!validEmail || !pw) throw new Error("invalid login");
    const { error } = await c.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) throw error;
  });

  const signup = () => run(async (c) => {
    if (!validEmail) { setError("Informe um e-mail válido."); return; }
    const p = passwordProblem(pw, email);
    if (p) { setError(p); return; }
    if (pw !== pw2) { setError("As senhas não conferem."); return; }
    if (!agree) { setError("É preciso aceitar a Política de Privacidade."); return; }
    const { error } = await c.auth.signUp({
      email: email.trim(), password: pw,
      options: { emailRedirectTo: redirectUrl(), data: { consent_at: new Date().toISOString(), policy_version: APP.policyVersion } },
    });
    if (error) throw error;
    setSentMsg(`Enviamos um link de confirmação para ${email.trim()}. Abra o e-mail, confirme e depois volte aqui para entrar.`);
    setView("sent");
  });

  const forgot = () => run(async (c) => {
    if (!validEmail) { setError("Informe um e-mail válido."); return; }
    await c.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
    // Mesma mensagem exista ou não a conta, para não revelar quem é cadastrado.
    setSentMsg(`Se houver uma conta com ${email.trim()}, você vai receber um link para criar uma nova senha.`);
    setView("sent");
  });

  const resend = () => run(async (c) => {
    const { error } = await c.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: redirectUrl() } });
    if (error) throw error;
    setSentMsg("Enviamos o link de novo. Confira também a caixa de spam.");
  });

  const emailField = (
    <Field id="au-email" label="E-mail">
      <input id="au-email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </Field>
  );
  const err = error && <div className="err" role="alert">{error}</div>;

  if (view === "sent") {
    return (
      <Shell title="Confira seu e-mail" lead={sentMsg}>
        {err}
        <button className="btn block" onClick={() => { setView("login"); setError(""); }}>Ir para o login</button>
        {sentMsg.startsWith("Enviamos") && <button className="btn ghost block" disabled={busy} onClick={resend}>Reenviar e-mail</button>}
      </Shell>
    );
  }

  if (view === "forgot") {
    return (
      <Shell title="Recuperar senha" lead="Informe o e-mail da sua conta para receber um link de redefinição.">
        {emailField}{err}
        <button className="btn block" disabled={busy} onClick={forgot}>Enviar link</button>
        <button className="link" onClick={() => setView("login")}>Voltar</button>
      </Shell>
    );
  }

  if (view === "signup") {
    return (
      <Shell title="Criar conta" lead="Sua conta protege o acesso. Seus dados financeiros continuam só no seu aparelho.">
        {emailField}
        <Field id="au-pw" label="Senha" help="Pelo menos 10 caracteres, com letras e números.">
          <input id="au-pw" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field id="au-pw2" label="Confirme a senha">
          <input id="au-pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <label className="consent">
          <button type="button" role="checkbox" aria-checked={agree} className={`check${agree ? " on" : ""}`} onClick={() => setAgree(!agree)} aria-label="Aceito a Política de Privacidade">
            {agree && <Icon name="check" size={14} stroke={2.4} />}
          </button>
          <span>Li e aceito a <a href="#/privacidade">Política de Privacidade</a>.</span>
        </label>
        {err}
        <button className="btn block" disabled={busy} onClick={signup}>Criar conta</button>
        <button className="link" onClick={() => { setView("login"); setError(""); }}>Já tenho conta</button>
      </Shell>
    );
  }

  return (
    <Shell title="Entrar" lead="Acesse sua conta para continuar.">
      {emailField}
      <Field id="au-pw" label="Senha">
        <input id="au-pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
      </Field>
      {err}
      <button className="btn block" disabled={busy} onClick={login}>Entrar</button>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="link" onClick={() => { setView("signup"); setError(""); }}>Criar conta</button>
        <button className="link" onClick={() => { setView("forgot"); setError(""); }}>Esqueci a senha</button>
      </div>
    </Shell>
  );
}

function CodeInput({ value, onChange, onEnter }) {
  return (
    <Field id="au-code" label="Código de 6 dígitos">
      <input id="au-code" className="input pin" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && onEnter()} />
    </Field>
  );
}

function Enroll2FA({ onDone, onCancel }) {
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await sb();
      // Remove tentativas anteriores não concluídas antes de criar uma nova.
      const { data: list } = await c.auth.mfa.listFactors();
      for (const f of list?.all || []) if (f.status === "unverified") await c.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await c.auth.mfa.enroll({ factorType: "totp", friendlyName: `${APP.name} ${new Date().toISOString().slice(0, 10)}` });
      if (error) setError(authError(error)); else setFactor(data);
    })();
  }, []);

  const verify = async () => {
    if (code.length !== 6) return;
    setBusy(true); setError("");
    const c = await sb();
    const { error } = await c.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setBusy(false);
    if (error) { setError(authError(error)); setCode(""); } else onDone();
  };

  return (
    <Shell title="Ative a verificação em 2 etapas" lead="Obrigatória para proteger sua conta. Use um app autenticador, como Google Authenticator, Microsoft Authenticator ou o app Senhas do iPhone.">
      {factor ? (
        <>
          <ol className="prose" style={{ paddingLeft: 18 }}>
            <li>No app autenticador, adicione uma conta lendo o QR code abaixo.</li>
            <li>Se estiver no mesmo celular, copie a chave e cole no app.</li>
            <li>Digite o código de 6 dígitos que aparecer.</li>
          </ol>
          <img className="qr" src={factor.totp.qr_code} alt="QR code para o app autenticador" />
          <div className="field"><span className="label">Chave para digitar no app</span><div className="code">{factor.totp.secret}</div></div>
          <CodeInput value={code} onChange={setCode} onEnter={verify} />
        </>
      ) : !error && <p className="muted">Preparando...</p>}
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn block" disabled={busy || !factor || code.length !== 6} onClick={verify}>Ativar</button>
      <button className="link" onClick={onCancel}>Sair da conta</button>
    </Shell>
  );
}

function Verify2FA({ onDone, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const verify = async () => {
    if (code.length !== 6) return;
    setBusy(true); setError("");
    const c = await sb();
    const { data } = await c.auth.mfa.listFactors();
    const f = data?.totp?.[0];
    const { error } = f ? await c.auth.mfa.challengeAndVerify({ factorId: f.id, code }) : { error: new Error("invalid code") };
    setBusy(false);
    if (error) { setError(authError(error)); setCode(""); } else onDone();
  };
  return (
    <Shell title="Verificação em 2 etapas" lead="Abra seu app autenticador e digite o código do Prumo.">
      <CodeInput value={code} onChange={(v) => { setCode(v); setError(""); }} onEnter={verify} />
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn block" disabled={busy || code.length !== 6} onClick={verify}>Confirmar</button>
      <button className="link" onClick={onCancel}>Sair da conta</button>
    </Shell>
  );
}

function NewPassword({ onDone }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const p = passwordProblem(pw);
    if (p) return setError(p);
    if (pw !== pw2) return setError("As senhas não conferem.");
    setBusy(true);
    const c = await sb();
    const { error } = await c.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setError(authError(error)); else onDone();
  };
  return (
    <Shell title="Nova senha" lead="Crie uma nova senha para sua conta. Depois, entre de novo.">
      <Field id="np-1" label="Nova senha" help="Pelo menos 10 caracteres, com letras e números.">
        <input id="np-1" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      <Field id="np-2" label="Confirme a senha">
        <input id="np-2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </Field>
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn block" disabled={busy} onClick={save}>Salvar senha</button>
    </Shell>
  );
}

/** Link de "esqueci a senha": se a conta tem 2FA, confirma o código antes de trocar a senha. */
function Recovery({ onDone, onCancel }) {
  const [step, setStep] = useState("check");
  useEffect(() => {
    (async () => {
      const c = await sb();
      const { data } = await c.auth.mfa.getAuthenticatorAssuranceLevel();
      setStep(data?.nextLevel === "aal2" && data?.currentLevel !== "aal2" ? "verify" : "password");
    })();
  }, []);
  if (step === "check") return <div className="center-screen"><Logo size={30} /></div>;
  if (step === "verify") return <Verify2FA onDone={() => setStep("password")} onCancel={onCancel} />;
  return <NewPassword onDone={onDone} />;
}
