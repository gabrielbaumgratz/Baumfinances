import { AUTH } from "../config.js";

let client = null;

/** Cliente do Supabase, criado sob demanda (e só se o login estiver configurado). */
export async function sb() {
  if (!AUTH.enabled) return null;
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(AUTH.url, AUTH.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "prumo:auth" },
    });
  }
  return client;
}

/** Endereço para onde os links de e-mail (confirmação e nova senha) devem voltar. */
export const redirectUrl = () => import.meta.env.VITE_APP_URL || `${location.origin}${location.pathname}`;

/** Traduz os erros mais comuns do servidor para mensagens claras. */
export function authError(e) {
  const m = String(e?.message || e || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com este e-mail.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (m.includes("password") && m.includes("least")) return "A senha é curta demais.";
  if (m.includes("invalid totp") || m.includes("invalid code") || m.includes("expired")) return "Código inválido ou expirado.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com a internet.";
  return "Não foi possível concluir. Tente novamente.";
}

/** Regras de senha da conta. O servidor também deve exigir no mínimo isso (ver README). */
export function passwordProblem(pw, email = "") {
  if (pw.length < 10) return "Use pelo menos 10 caracteres.";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Misture letras e números.";
  if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase())) return "A senha não pode conter seu e-mail.";
  return "";
}
