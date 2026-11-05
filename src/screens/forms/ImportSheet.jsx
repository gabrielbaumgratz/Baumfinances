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
    ui.toast(`${chosen.length} ${chosen.length === 1 ? "lançamento importado" : "lançamentos importados"}`);
    close();
  };

  return (
    <Sheet title="Importar extrato" onClose={onClose}
      footer={file && parsed.rows.length ? (close) => <button className="btn" disabled={!chosen.length || !accountId} onClick={() => doImport(close)}>Importar {chosen.length}</button> : null}>
      {!file ? (
        <>
          <p className="muted">
            Baixe o extrato no aplicativo ou site do seu banco, em formato OFX ou CSV, e selecione o arquivo.
            Os lançamentos são categorizados automaticamente e duplicados são ignorados.
          </p>
          <div className={`drop${over ? " over" : ""}`} role="button" tabIndex={0}
            onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); load(e.dataTransfer.files[0]); }}>
            <b>Selecionar arquivo</b>
            <span style={{ fontSize: "0.85rem" }}>OFX ou CSV</span>
          </div>
          <input ref={input} type="file" accept=".ofx,.csv,.txt,text/csv" hidden onChange={(e) => load(e.target.files[0])} />
          <p className="notice">O arquivo é lido apenas neste aparelho e não é enviado para nenhum servidor.</p>
        </>
      ) : (
        <>
          <div className="row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{parsed.rows.length} encontrados, {parsed.rows.filter((r) => r.dup).length} já importados</div>
            </div>
            <button className="btn sm ghost" onClick={() => setFile(null)}>Trocar arquivo</button>
          </div>
          {state.accounts.length ? (
            <AccountPicker accounts={state.accounts} value={accountId} onChange={setAccountId} />
          ) : (
            <p className="notice">Cadastre uma conta antes de importar, em Ajustes.</p>
          )}
          {isCSV && (
            <div className="set" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="body"><div className="t">Fatura de cartão</div><div className="d">Compras aparecem como valores positivos no arquivo</div></div>
              <Switch checked={invert} onChange={setInvert} label="Fatura de cartão" />
            </div>
          )}
          {parsed.error && <div className="err" role="alert">{parsed.error}</div>}
          <div className="list">
            {parsed.rows.map((r) => {
              const on = !r.dup && !skip.has(r.i);
              const c = state.categories.find((x) => x.id === r.categoryId);
              return (
                <button key={r.i} className="item" disabled={r.dup} style={{ opacity: r.dup ? 0.45 : 1 }} aria-pressed={on}
                  onClick={() => setSkip((s) => { const n = new Set(s); n.has(r.i) ? n.delete(r.i) : n.add(r.i); return n; })}>
                  <span className={`check${on ? " on" : ""}`}>{on && <Icon name="check" size={14} stroke={2.4} />}</span>
                  <div className="body">
                    <div className="t">{r.merchant}</div>
                    <div className="m row" style={{ gap: 10 }}><span>{shortDate(r.date)}</span><span>{c?.name}</span>{r.dup && <span>Já importado</span>}</div>
                  </div>
                  <div className={`v ${r.amount > 0 ? "pos" : ""}`}><Money value={r.amount} signed /></div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}
