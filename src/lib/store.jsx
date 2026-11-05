import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CATEGORIES } from "./categories.js";
import { uid } from "./id.js";

const KEY = "baum:v2";
const StoreCtx = createContext(null);

export const ACCOUNT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948", "#0e0f0c"];

export function emptyState() {
  return {
    version: 2,
    settings: { theme: "system", bigText: false, hideValues: false, name: "" },
    accounts: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, budget: 0 })),
    transactions: [],
    fixed: [],
    plans: [],
    wishes: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return { ...emptyState(), ...data, settings: { ...emptyState().settings, ...data.settings } };
  } catch {
    return null;
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    if (!state) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state]);

  const api = useMemo(() => {
    const patch = (fn) => setState((s) => fn(s || emptyState()));
    return {
      init: (data) => setState(data),
      reset: () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setState(null); },
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
    };
  }, []);

  return <StoreCtx.Provider value={{ state, ...api }}>{children}</StoreCtx.Provider>;
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
