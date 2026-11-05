// Identidade do produto. Trocar o nome aqui troca no app inteiro.
const env = import.meta.env || {};

export const APP = {
  name: "Prumo",
  tagline: "Suas finanças no prumo.",
  version: "1.0.0-beta",
  versionLabel: "1.0 beta",
  policyVersion: "2026-11-05",
  contact: "https://github.com/gabrielbaumgratz/baumfinances/issues",
};

// Contas de usuário (login, verificação de e-mail e 2FA) via Supabase.
// Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no build para ativar.
export const AUTH = {
  url: env.VITE_SUPABASE_URL || "",
  anonKey: env.VITE_SUPABASE_ANON_KEY || "",
  get enabled() { return !!(this.url && this.anonKey); },
};

// PIN: 6 a 12 dígitos.
export const PIN = { min: 6, max: 12 };
