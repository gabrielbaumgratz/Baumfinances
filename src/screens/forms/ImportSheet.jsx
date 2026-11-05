import { useMemo, useRef, useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { parseStatement } from "../../lib/importers.js";
import { guessCategory } from "../../lib/categories.js";
import { shortDate } from "../../lib/dates.js";
import Sheet from "../../components/Sheet.jsx";
import Icon from "../../components/Icon.jsx";
import Money from "../../components/Money.jsx";
import { Switch } from "../../components/ui.jsx";
import { AccountPicker } from "./shared.jsx";

async function readText(file) {
  const buf = await file.arrayBuffer();
  const utf = new TextDecoder("utf-8").decode(buf);
  // Many Brazilian banks still export OFX/CSV in latin-1.
  return utf.includes("�") ? new TextDecoder("windows-1252").decode(buf) : utf;
}

export default function ImportSheet({ onClose }) {
  const { state, addMany } = useStore();
  const ui = useUI();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [accountId, setAccountId] = useState(state.accounts[0]?.id || "");
  const [invert, setInvert] = useState(false);
  const [skip, setSkip] = useState(new Set());
  const [over, setOver] = useState(false);

  const parsed = useMemo(() => {
    if (!file) return { rows: [], error: "" };
    try {
      const rows = parseStatement(file.name, text, { invertSign: invert });
      const existing = new Set(state.transactions.filter((t) => t.accountId === accountId && t.externalId).map((t) => t.externalId));
      return {
        rows: rows.map((r, i) => ({ ...r, i, dup: existing.has(r.externalId), categoryId: guessCategory(r, state.categories, state.transactions) })),
        error: rows.length ? "" : "Não encontrei lançamentos nesse arquivo.",
      };
    } catch (e) {
      return { rows: [], error: e.message };
    }
  }, [file, text, invert, accountId, state.transactions, state.categories]);

  const isCSV = file && !/\.ofx$/i.test(file.name);
  const chosen = parsed.rows.filter((r) => !r.dup && !skip.has(r.i));

  const load = async (f) => {
    if (!f) return;
    setFile(f);
    setSkip(new Set());
    setText(await readText(f));
  };

  const doImport = (close) => {
    addMany("transactions", chosen.map(({ i, dup, ...r }) => ({ ...r, accountId, note: "" })));
    ui.toast(`${chosen.length} lançamentos importados`);
    close();
  };

  return (
    <Sheet title="Importar extrato" onClose={onClose}
      footer={file && parsed.rows.length ? (close) => <button className="btn" disabled={!chosen.length || !accountId} onClick={() => doImport(close)}>Importar {chosen.length}</button> : null}>
      {!file ? (
        <>
          <p style={{ color: "var(--ink-2)" }}>
            Baixe o extrato no app ou site do seu banco em <b>OFX</b> (o mais comum) ou <b>CSV</b> e solte aqui. A gente categoriza sozinho e ignora o que já foi importado.
          </p>
          <div className={`drop${over ? " over" : ""}`} role="button" tabIndex={0}
            onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); load(e.dataTransfer.files[0]); }}>
            <div className="ico-tile"><Icon name="file" /></div>
            <b>Escolher arquivo</b>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>.ofx ou .csv</span>
          </div>
          <input ref={input} type="file" accept=".ofx,.csv,.txt,text/csv" hidden onChange={(e) => load(e.target.files[0])} />
          <div className="note row" style={{ alignItems: "flex-start" }}>
            <Icon name="info" size={18} />
            <span>Tudo é lido no seu aparelho. Nenhum dado sai daqui.</span>
          </div>
        </>
      ) : (
        <>
          <div className="row">
            <div className="ico-tile"><Icon name="file" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{parsed.rows.length} encontrados · {parsed.rows.filter((r) => r.dup).length} já existiam</div>
            </div>
            <button className="btn sm ghost" onClick={() => setFile(null)}>Trocar</button>
          </div>
          {state.accounts.length ? (
            <AccountPicker accounts={state.accounts} value={accountId} onChange={setAccountId} />
          ) : (
            <div className="note">Crie uma conta antes de importar (Ajustes → Contas).</div>
          )}
          {isCSV && (
            <div className="setting-row">
              <div className="t">É fatura de cartão<small>Compras aparecem positivas no arquivo</small></div>
              <Switch checked={invert} onChange={setInvert} label="É fatura de cartão" />
            </div>
          )}
          {parsed.error && <div className="note" style={{ color: "var(--danger)" }}>{parsed.error}</div>}
          <div className="list">
            {parsed.rows.map((r) => {
              const on = !r.dup && !skip.has(r.i);
              const c = state.categories.find((x) => x.id === r.categoryId);
              return (
                <button key={r.i} className="item" disabled={r.dup} style={{ opacity: r.dup ? 0.45 : 1 }} aria-pressed={on}
                  onClick={() => setSkip((s) => { const n = new Set(s); n.has(r.i) ? n.delete(r.i) : n.add(r.i); return n; })}>
                  <span className={`check${on ? " on" : ""}`}>{on && <Icon name="check" size={16} stroke={2.4} />}</span>
                  <div className="main-col">
                    <div className="title">{r.merchant}</div>
                    <div className="meta"><span>{shortDate(r.date)}</span><span>· {c?.name}</span>{r.dup && <span className="badge">já importado</span>}</div>
                  </div>
                  <div className={`amt ${r.amount > 0 ? "pos" : ""}`}><Money value={r.amount} signed /></div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}
