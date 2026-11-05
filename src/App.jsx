import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "./lib/store.jsx";
import { UICtx } from "./lib/ui-state.jsx";
import Icon from "./components/Icon.jsx";
import Logo from "./components/Logo.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Lock from "./screens/Lock.jsx";
import Home from "./screens/Home.jsx";
import Statement from "./screens/Statement.jsx";
import Plans from "./screens/Plans.jsx";
import Insights from "./screens/Insights.jsx";
import Settings from "./screens/Settings.jsx";
import Privacy from "./screens/Privacy.jsx";
import TxForm from "./screens/forms/TxForm.jsx";
import FixedForm from "./screens/forms/FixedForm.jsx";
import PlanForm from "./screens/forms/PlanForm.jsx";
import WishForm from "./screens/forms/WishForm.jsx";
import AccountForm from "./screens/forms/AccountForm.jsx";
import CategoryForm from "./screens/forms/CategoryForm.jsx";
import ImportSheet from "./screens/forms/ImportSheet.jsx";
import PinForm from "./screens/forms/PinForm.jsx";
import BackupSheet from "./screens/forms/BackupSheet.jsx";

const NAV = [
  { id: "inicio", label: "Início", icon: "home" },
  { id: "extrato", label: "Extrato", icon: "list" },
  { id: "planejamento", label: "Planejamento", icon: "calendar" },
  { id: "analise", label: "Análise", icon: "chart" },
  { id: "ajustes", label: "Ajustes", icon: "settings" },
];
const SCREENS = { inicio: Home, extrato: Statement, planejamento: Plans, analise: Insights, ajustes: Settings, privacidade: Privacy };
const SHEETS = { tx: TxForm, fixed: FixedForm, plan: PlanForm, wish: WishForm, account: AccountForm, category: CategoryForm, import: ImportSheet, pin: PinForm, backup: BackupSheet };

function useHashRoute() {
  const read = () => {
    const [tab, sub] = location.hash.replace(/^#\/?/, "").split("/");
    return { tab: SCREENS[tab] ? tab : "inicio", sub };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((tab, sub) => {
    location.hash = `/${tab}${sub ? "/" + sub : ""}`;
    scrollTo({ top: 0 });
  }, []);
  return [route, go];
}

function applyPrefs(p = {}) {
  const root = document.documentElement;
  const theme = p.theme || "system";
  if (theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
  if (p.bigText) root.setAttribute("data-text", "big"); else root.removeAttribute("data-text");
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0c0c0b" : "#fafaf8");
}

export default function App() {
  const { state, status } = useStore();
  const [route, go] = useHashRoute();
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  useEffect(() => { if (state) applyPrefs(state.settings); }, [state?.settings.theme, state?.settings.bigText]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (status !== "ready") setSheet(null); scrollTo({ top: 0 }); }, [status]);

  const ui = useMemo(() => ({
    open: (type, payload = {}) => setSheet({ type, payload, key: Date.now() }),
    toast: (msg, undo) => {
      clearTimeout(timer.current);
      setToast({ msg, undo, key: Date.now() });
      timer.current = setTimeout(() => setToast(null), undo ? 5000 : 2400);
    },
    go,
  }), [go]);

  if (status === "locked") return <Lock />;
  if (status !== "ready") return <UICtx.Provider value={ui}>{route.tab === "privacidade" ? <main className="main"><Privacy go={go} public /></main> : <Onboarding go={go} />}</UICtx.Provider>;

  const Screen = SCREENS[route.tab];
  const SheetCmp = sheet && SHEETS[sheet.type];

  return (
    <UICtx.Provider value={ui}>
      <div className="app">
        <nav className="nav" aria-label="Navegação principal">
          <div className="nav-brand"><Logo /></div>
          <button className="btn block nav-new" onClick={() => ui.open("tx")}><Icon name="plus" size={18} />Novo lançamento</button>
          {NAV.map((t) => (
            <a key={t.id} className={`nav-item${t.id === "ajustes" ? " end" : ""}`} href={`#/${t.id}`}
              aria-current={route.tab === t.id || (t.id === "ajustes" && route.tab === "privacidade") ? "page" : undefined}
              onClick={(e) => { e.preventDefault(); go(t.id); }}>
              <Icon name={t.icon} size={20} stroke={1.6} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <main className="main">
          <Screen key={route.tab} sub={route.sub} go={go} />
        </main>
        <button className="fab" onClick={() => ui.open("tx")} aria-label="Novo lançamento"><Icon name="plus" size={22} stroke={1.8} /></button>
      </div>
      {SheetCmp && <SheetCmp key={sheet.key} {...sheet.payload} onClose={() => setSheet(null)} />}
      {toast && (
        <div className="toast" role="status" key={toast.key}>
          <span>{toast.msg}</span>
          {toast.undo && <button onClick={() => { toast.undo(); setToast(null); }}>Desfazer</button>}
        </div>
      )}
    </UICtx.Provider>
  );
}
