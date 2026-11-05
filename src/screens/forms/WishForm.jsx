import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { today } from "../../lib/dates.js";
import { fmt } from "../../lib/format.js";
import Sheet from "../../components/Sheet.jsx";
import Icon from "../../components/Icon.jsx";
import Money from "../../components/Money.jsx";
import { Field, Seg } from "../../components/ui.jsx";
import { AmountInput, toInput, validAmount } from "./shared.jsx";

export default function WishForm({ item, mode, onClose }) {
  return mode === "save" ? <SaveSheet item={item} onClose={onClose} /> : <WishEdit item={item} onClose={onClose} />;
}

function WishEdit({ item, onClose }) {
  const { upsert, remove } = useStore();
  const ui = useUI();
  const editing = !!item?.id;
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState(toInput(item?.price));
  const [saved, setSaved] = useState(toInput(item?.saved));
  const [priority, setPriority] = useState(String(item?.priority || 2));
  const [link, setLink] = useState(item?.link || "");
  const [note, setNote] = useState(item?.note || "");
  const [touched, setTouched] = useState(false);
  const value = validAmount(price);

  const save = (close, extra = {}) => {
    setTouched(true);
    if (!value || !name.trim()) return false;
    upsert("wishes", { ...(item || {}), name: name.trim(), price: value, saved: validAmount(saved) || 0, priority: Number(priority), link: link.trim(), note: note.trim(), ...extra });
    close();
    return true;
  };

  return (
    <Sheet title={editing ? "Editar desejo" : "Novo desejo"} onClose={onClose}
      footer={(close) => (
        <>
          {editing && <button className="btn danger" style={{ flex: "0 0 auto" }} aria-label="Apagar" onClick={() => { remove("wishes", item.id); ui.toast("Desejo apagado", () => upsert("wishes", item)); close(); }}><Icon name="trash" /></button>}
          <button className="btn" onClick={() => save(close) && ui.toast("Salvo na lista")}>Salvar</button>
        </>
      )}>
      {(close) => (
        <>
          <AmountInput value={price} onChange={setPrice} label="Preço" error={touched && !value ? "Quanto custa?" : ""} />
          <Field id="wname" label="O que você quer?" error={touched && !name.trim() ? "Dá um nome" : ""}>
            <input id="wname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fone bom, viagem, curso" />
          </Field>
          <div className="field">
            <span className="label">Quanto você quer?</span>
            <Seg value={priority} onChange={setPriority} label="Prioridade" options={[{ value: "1", label: "Muito" }, { value: "2", label: "Quero" }, { value: "3", label: "Seria legal" }]} />
          </div>
          <Field id="wsaved" label="Já guardei">
            <input id="wsaved" className="input" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0,00" />
          </Field>
          <Field id="wlink" label="Link (opcional)">
            <input id="wlink" className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          </Field>
          {item?.link && /^https?:\/\//.test(item.link) && <a href={item.link} target="_blank" rel="noreferrer noopener" className="row" style={{ gap: 6, fontWeight: 600 }}><Icon name="link" size={16} />Abrir link</a>}
          <Field id="wnote" label="Nota (opcional)">
            <textarea id="wnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {editing && !item.bought && (
            <button className="btn brand" onClick={() => {
              if (save(close, { bought: true })) {
                upsert("transactions", { date: today(), amount: -value, merchant: name.trim(), description: name.trim(), categoryId: "compras", accountId: "", note: "Da lista de desejos" });
                ui.toast("Conquistado! Foi pro extrato");
              }
            }}><Icon name="check" size={18} />Comprei</button>
          )}
        </>
      )}
    </Sheet>
  );
}

function SaveSheet({ item, onClose }) {
  const { upsert } = useStore();
  const ui = useUI();
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState("add");
  const value = validAmount(amount);
  const quick = [20, 50, 100].filter((v) => v < item.price);
  return (
    <Sheet title={`Cofrinho · ${item.name}`} onClose={onClose}
      footer={(close) => (
        <button className="btn" disabled={!value} onClick={() => {
          const next = Math.max(0, (item.saved || 0) + (dir === "add" ? value : -value));
          upsert("wishes", { ...item, saved: Math.round(next * 100) / 100 });
          ui.toast(dir === "add" ? `+ ${fmt(value)} guardado` : `${fmt(value)} retirado`);
          close();
        }}>Confirmar</button>
      )}>
      <div style={{ textAlign: "center", color: "var(--muted)" }}>Guardado: <b style={{ color: "var(--ink)" }}><Money value={item.saved || 0} /></b> de <Money value={item.price} /></div>
      <Seg value={dir} onChange={setDir} label="Operação" options={[{ value: "add", label: "Guardar" }, { value: "sub", label: "Retirar" }]} />
      <AmountInput value={amount} onChange={setAmount} />
      <div className="chips wrap" style={{ justifyContent: "center" }}>
        {quick.map((v) => <button key={v} className="chip" onClick={() => setAmount(String(v))}>R$ {v}</button>)}
        {item.price - (item.saved || 0) > 0 && <button className="chip" onClick={() => setAmount(toInput(Math.round((item.price - (item.saved || 0)) * 100) / 100))}>Tudo que falta</button>}
      </div>
    </Sheet>
  );
}
