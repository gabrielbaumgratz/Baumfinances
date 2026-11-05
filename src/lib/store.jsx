import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CATEGORIES } from "./categories.js";
import { uid } from "./id.js";
import { deriveKey, newSalt, open, seal, ITERATIONS } from "./vault.js";

/*
 * Armazenamento local. Os dados financeiros só são gravados criptografados (PIN obrigatório).
 * As chaves são separadas por usuário (ns = id da conta, ou "local" sem login).
 *
 * Status:
 *   empty    nada salvo ainda: mostrar boas-vindas
 *   needsPin dados em memória, mas sem PIN criado: obrigar criação do PIN
 *   locked   cofre salvo, aguardando PIN
 *   ready    desbloqueado
 */
const LEGACY_PLAIN = ["prumo:data", "baum:v2"];
const K_PREFS = "prumo:prefs"; // só aparência, para aplicar antes de desbloquear
const keys = (ns) => ({ vault: `prumo:${ns}:vault`, guard: `prumo:${ns}:guard` });

const StoreCtx = createContext(null);

export const ACCOUNT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948", "#55554f"];
const THEMES = ["light", "dark", "system"];
const LOCK_AFTER = [0, 1, 5, 15];
const HEX = /^#[0-9a-f]{6}$/i;

export function emptyState() {
  return {
    version: 4,
    settings: { theme: "system", bigText: false, hideValues: false, name: "", lockAfter: 1, consentAt: null, policyVersion: null },
    accounts: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, budget: 0 })),
    transactions: [],
    fixed: [],
    plans: [],
    wishes: [],
  };
}

const ARRAYS = ["accounts", "categories", "transactions", "fixed", "plans", "wishes"];
const str = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v) => (Number.isFinite(v) ? v : 0);

/** Valida e normaliza dados vindos do armazenamento ou de um arquivo de backup. */
export function normalize(data) {
  if (!data || typeof data !== "object") throw new Error("Formato inválido");
  const base = emptyState();
  const s = { ...base.settings, ...(data.settings && typeof data.settings === "object" ? data.settings : {}) };
  const settings = {
    theme: THEMES.includes(s.theme) ? s.theme : "system",
    bigText: !!s.bigText,
    hideValues: !!s.hideValues,
    name: str(s.name, 60),
    lockAfter: LOCK_AFTER.includes(s.lockAfter) ? s.lockAfter : 1,
    consentAt: typeof s.consentAt === "string" ? s.consentAt : null,
    policyVersion: typeof s.policyVersion === "string" ? s.policyVersion : null,
  };
  const out = { ...base, version: 4, settings };
  for (const k of ARRAYS) {
    if (data[k] !== undefined && !Array.isArray(data[k])) throw new Error("Formato inválido");
    out[k] = (data[k] || base[k]).filter((x) => x && typeof x === "object" && (typeof x.id === "string" || typeof x.id === "number")).slice(0, 100000);
  }
  out.transactions = out.transactions.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(t.amount));
  out.accounts = out.accounts.map((a) => ({ ...a, color: HEX.test(a.color) ? a.color : ACCOUNT_COLORS[8], initial: num(a.initial) }));
  out.wishes = out.wishes.map((w) => ({ ...w, link: /^https?:\/\//i.test(w.link || "") ? str(w.link, 500) : "" }));
  return out;
}

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* armazenamento cheio ou bloqueado */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

/** Tentativas erradas de PIN ficam salvas, para que recarregar a página não zere a espera. */
export function readGuard(ns) {
  try { return { fails: 0, until: 0, ...JSON.parse(read(keys(ns).guard) || "{}") }; } catch { return { fails: 0, until: 0 }; }
}
const writeGuard = (ns, g) => write(keys(ns).guard, JSON.stringify(g));

function boot(ns) {
  const raw = read(keys(ns).vault);
  if (raw) { try { return { status: "locked", state: null, vault: JSON.parse(raw) }; } catch { /* corrompido */ } }
  // Dados de versões antigas, sem criptografia: carregar e exigir PIN antes de continuar.
  for (const k of LEGACY_PLAIN) {
    const old = read(k);
    if (!old) continue;
    try { return { status: "needsPin", state: normalize(JSON.parse(old)), vault: null }; } catch { /* ignora */ }
  }
  return { status: "empty", state: null, vault: null };
}

export function StoreProvider({ ns = "local", children }) {
  const [boot0] = useState(() => boot(ns));
  const [status, setStatus] = useState(boot0.status);
  const [state, setState] = useState(boot0.state);
  const vaultRef = useRef(boot0.vault);
  const keyRef = useRef(null);
  const K = keys(ns);

  // Persistência: só grava com chave (criptografado). Nunca em texto puro.
  useEffect(() => {
    if (!state) return;
    const { theme, bigText } = state.settings;
    write(K_PREFS, JSON.stringify({ theme, bigText }));
    if (!keyRef.current) return;
    const { key, salt, iterations } = keyRef.current;
    seal(key, salt, state, iterations).then((v) => {
      vaultRef.current = v;
      write(K.vault, JSON.stringify(v));
      for (const k of LEGACY_PLAIN) drop(k);
    });
  }, [state, K.vault]);

  const api = useMemo(() => {
    const patch = (fn) => setState((s) => fn(s || emptyState()));
    return {
      /** Começa com novos dados: o PIN ainda precisa ser criado. */
      init: (data) => {
        setState(normalize(data));
        setStatus(keyRef.current ? "ready" : "needsPin");
      },
      eraseAll: () => {
        drop(K.vault); drop(K.guard);
        for (const k of LEGACY_PLAIN) drop(k);
        keyRef.current = null; vaultRef.current = null;
        setState(null); setStatus("empty");
      },
      setSettings: (p) => patch((s) => ({ ...s, settings: { ...s.settings, ...p } })),
      upsert: (col, item) =>
        patch((s) => {
          const withId = item.id ? item : { ...item, id: uid() };
          const exists = s[col].some((x) => x.id === withId.id);
          return { ...s, [col]: exists ? s[col].map((x) => (x.id === withId.id ? { ...x, ...withId } : x)) : [...s[col], withId] };
        }),
      remove: (col, id) => patch((s) => ({ ...s, [col]: s[col].filter((x) => x.id !== id) })),
      addMany: (col, items) => patch((s) => ({ ...s, [col]: [...s[col], ...items.map((i) => ({ id: uid(), ...i }))] })),
      update: patch,

      // Segurança
      unlock: async (pin) => {
        const v = vaultRef.current;
        const key = await deriveKey(pin, v.salt, v.iterations);
        let data;
        try {
          data = await open(key, v);
        } catch (e) {
          const g = readGuard(ns);
          const fails = g.fails + 1;
          // A cada 5 erros, espera progressiva: 30 s, 60 s, 90 s...
          writeGuard(ns, { fails, until: fails % 5 === 0 ? Date.now() + 30000 * (fails / 5) : g.until });
          throw e;
        }
        writeGuard(ns, { fails: 0, until: 0 });
        keyRef.current = { key, salt: v.salt, iterations: v.iterations };
        setState(normalize(data));
        setStatus("ready");
      },
      lock: () => {
        if (!keyRef.current) return;
        keyRef.current = null;
        setState(null);
        setStatus(vaultRef.current ? "locked" : "empty");
      },
      /** Cria ou troca o PIN. Os dados são regravados com a nova chave. */
      setPin: async (pin) => {
        const salt = newSalt();
        keyRef.current = { key: await deriveKey(pin, salt), salt, iterations: ITERATIONS };
        setState((s) => ({ ...s }));
        setStatus("ready");
      },
      checkPin: async (pin) => {
        const v = vaultRef.current;
        if (!v) return false;
        try { await open(await deriveKey(pin, v.salt, v.iterations), v); return true; } catch { return false; }
      },
    };
  }, [ns, K.vault, K.guard]);

  // Bloqueio automático quando o app fica em segundo plano
  const hiddenAt = useRef(0);
  useEffect(() => {
    const on = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (keyRef.current && state && Date.now() - hiddenAt.current >= (state.settings.lockAfter ?? 1) * 60000) api.lock();
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [api, state]);

  return <StoreCtx.Provider value={{ state, status, ns, ...api }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

export function useHide() {
  const { state } = useStore();
  return !!state?.settings.hideValues;
}

export function useLookup() {
  const { state } = useStore();
  return {
    cat: useCallback((id) => state.categories.find((c) => c.id === id) || { id, name: "Sem categoria", icon: "dots" }, [state.categories]),
    acc: useCallback((id) => state.accounts.find((a) => a.id === id), [state.accounts]),
  };
}
