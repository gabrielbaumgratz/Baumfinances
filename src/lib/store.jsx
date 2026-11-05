import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CATEGORIES } from "./categories.js";
import { uid } from "./id.js";
import { deriveKey, newSalt, open, seal, ITERATIONS } from "./vault.js";

// Chaves de armazenamento local
const K_DATA = "prumo:data";    // dados em texto (sem PIN)
const K_VAULT = "prumo:vault";  // dados criptografados (com PIN)
const K_PREFS = "prumo:prefs";  // só aparência, para aplicar antes de desbloquear
const LEGACY = ["baum:v2"];

const StoreCtx = createContext(null);

export const ACCOUNT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948", "#55554f"];

export function emptyState() {
  return {
    version: 3,
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

/** Validates and normalizes data coming from storage or from a backup file. */
export function normalize(data) {
  if (!data || typeof data !== "object") throw new Error("Formato inválido");
  const base = emptyState();
  const out = { ...base, version: 3, settings: { ...base.settings, ...(data.settings || {}) } };
  for (const k of ARRAYS) {
    if (data[k] !== undefined && !Array.isArray(data[k])) throw new Error("Formato inválido");
    out[k] = (data[k] || base[k]).filter((x) => x && typeof x === "object" && (typeof x.id === "string" || typeof x.id === "number"));
  }
  out.transactions = out.transactions.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(t.amount));
  return out;
}

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* armazenamento cheio ou bloqueado */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

function boot() {
  const vault = read(K_VAULT);
  if (vault) { try { return { status: "locked", state: null, vault: JSON.parse(vault) }; } catch { /* corrompido */ } }
  for (const k of [K_DATA, ...LEGACY]) {
    const raw = read(k);
    if (!raw) continue;
    try { return { status: "ready", state: normalize(JSON.parse(raw)), vault: null }; } catch { /* ignora */ }
  }
  return { status: "empty", state: null, vault: null };
}

export function StoreProvider({ children }) {
  const [boot0] = useState(boot);
  const [status, setStatus] = useState(boot0.status);
  const [state, setState] = useState(boot0.state);
  const vaultRef = useRef(boot0.vault);
  const keyRef = useRef(null);

  // Persistência: criptografa quando há PIN, senão grava em texto.
  useEffect(() => {
    if (!state) return;
    const { theme, bigText } = state.settings;
    write(K_PREFS, JSON.stringify({ theme, bigText }));
    for (const k of LEGACY) drop(k);
    if (keyRef.current) {
      const { key, salt, iterations } = keyRef.current;
      seal(key, salt, state, iterations).then((v) => { vaultRef.current = v; write(K_VAULT, JSON.stringify(v)); drop(K_DATA); });
    } else {
      write(K_DATA, JSON.stringify(state));
    }
  }, [state]);

  const api = useMemo(() => {
    const patch = (fn) => setState((s) => fn(s || emptyState()));
    return {
      init: (data) => { setState(normalize(data)); setStatus("ready"); },
      eraseAll: () => {
        for (const k of [K_DATA, K_VAULT, K_PREFS, ...LEGACY]) drop(k);
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
      hasPin: () => !!keyRef.current,
      unlock: async (pin) => {
        const v = vaultRef.current;
        const key = await deriveKey(pin, v.salt, v.iterations);
        const data = await open(key, v); // lança erro se o PIN estiver errado
        keyRef.current = { key, salt: v.salt, iterations: v.iterations };
        setState(normalize(data));
        setStatus("ready");
      },
      lock: () => {
        if (!keyRef.current) return;
        keyRef.current = null;
        setState(null);
        setStatus("locked");
      },
      setPin: async (pin) => {
        const salt = newSalt();
        keyRef.current = { key: await deriveKey(pin, salt), salt, iterations: ITERATIONS };
        setState((s) => ({ ...s })); // força regravar criptografado
      },
      checkPin: async (pin) => {
        const v = vaultRef.current;
        if (!v) return false;
        try { await open(await deriveKey(pin, v.salt, v.iterations), v); return true; } catch { return false; }
      },
      removePin: () => {
        keyRef.current = null;
        vaultRef.current = null;
        drop(K_VAULT);
        setState((s) => ({ ...s }));
      },
    };
  }, []);

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

  return <StoreCtx.Provider value={{ state, status, ...api }}>{children}</StoreCtx.Provider>;
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
