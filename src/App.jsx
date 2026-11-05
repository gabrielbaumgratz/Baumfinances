import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "./lib/store.jsx";
import { UICtx } from "./lib/ui-state.jsx";
import Icon from "./components/Icon.jsx";
import Logo from "./components/Logo.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Statement from "./screens/Statement.jsx";
import Plans from "./screens/Plans.jsx";
import Insights from "./screens/Insights.jsx";
import Settings from "./screens/Settings.jsx";
import TxForm from "./screens/forms/TxForm.jsx";
import FixedForm from "./screens/forms/FixedForm.jsx";
import PlanForm from "./screens/forms/PlanForm.jsx";
import WishForm from "./screens/forms/WishForm.jsx";
import AccountForm from "./screens/forms/AccountForm.jsx";
import CategoryForm from "./screens/forms/CategoryForm.jsx";
import ImportSheet from "./screens/forms/ImportSheet.jsx";

const TABS = [
  { id: "inicio", label: "Início", icon: "home" },
  { id: "extrato", label: "Extrato", icon: "list" },
  { id: "planos", label: "Planos", icon: "calendar" },
  { id: "analise", label: "Análise", icon: "chart" },
];

const SHEETS = { tx: TxForm, fixed: FixedForm, plan: PlanForm, wish: WishForm, account: AccountForm, category: CategoryForm, import: ImportSheet, settings: Settings };

function useHashRoute() {
  const read = () => {
    const [tab, sub] = location.hash.replace(/^#\/?/, "").split("/");
    return { tab: TABS.some((t) => t.id === tab) ? tab : "inicio", sub };
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

function useTheme(settings) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings?.theme || "system";
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    if (settings?.bigText) root.setAttribute("data-text", "big");
    else root.removeAttribute("data-text");
    const meta = document.querySelector('meta[name="theme-color"]');
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    meta?.setAttribute("content", dark ? "#0b0c0a" : "#f4f4f0");
  }, [settings?.theme, settings?.bigText]);
}

export default function App() {
  const { state } = useStore();
  const [route, go] = useHashRoute();
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  useTheme(state?.settings);

  const ui = useMemo(
    () => ({
      open: (type, payload = {}) => setSheet({ type, payload, key: Date.now() }),
      close: () => setSheet(null),
      toast: (msg, undo) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, undo, key: Date.now() });
        toastTimer.current = setTimeout(() => setToast(null), undo ? 5000 : 2600);
      },
      go,
    }),
    [go],
  );

  if (!state) return <Onboarding />;

  const Screen = { inicio: Home, extrato: Statement, planos: Plans, analise: Insights }[route.tab];
  const SheetCmp = sheet && SHEETS[sheet.type];

  return (
    <UICtx.Provider value={ui}>
      <div className="app">
        <nav className="nav" aria-label="Navegação principal">
          <div className="nav-brand"><Logo size={30} /></div>
          {TABS.slice(0, 2).map((t) => <NavItem key={t.id} t={t} active={route.tab === t.id} go={go} />)}
          <div className="nav-add-wrap">
            <button className="nav-add" onClick={() => ui.open("tx")} aria-label="Novo lançamento">
              <Icon name="plus" size={24} stroke={2.2} />
              <span className="nav-add-label">Novo lançamento</span>
            </button>
          </div>
          {TABS.slice(2).map((t) => <NavItem key={t.id} t={t} active={route.tab === t.id} go={go} />)}
        </nav>
        <main className="main">
          <Screen key={route.tab} sub={route.sub} go={go} />
        </main>
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

function NavItem({ t, active, go }) {
  return (
    <a className="nav-item" href={`#/${t.id}`} aria-current={active ? "page" : undefined} onClick={(e) => { e.preventDefault(); go(t.id); }}>
      <span className="nav-ico"><Icon name={t.icon} size={22} stroke={active ? 2.1 : 1.8} /></span>
      <span>{t.label}</span>
    </a>
  );
}
