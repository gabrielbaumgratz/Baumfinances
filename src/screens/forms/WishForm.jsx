import { useState } from "react";
import { useStore } from "../../lib/store.jsx";
import { useUI } from "../../lib/ui-state.jsx";
import { today } from "../../lib/dates.js";
import { fmt } from "../../lib/format.js";
import Sheet from "../../components/Sheet.jsx";
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
          {editing && <button className="btn danger" onClick={() => { remove("wishes", item.id); ui.toast("Desejo excluído", () => upsert("wishes", item)); close(); }}>Excluir</button>}
          <button className="btn" onClick={() => save(close) && ui.toast("Desejo salvo")}>Salvar</button>
        </>
      )}>
      {(close) => (
        <>
          <AmountInput value={price} onChange={setPrice} label="Preço" error={touched && !value ? "Informe o preço" : ""} />
          <Field id="wname" label="Item" error={touched && !name.trim() ? "Informe o item" : ""}>
            <input id="wname" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="field">
            <span className="label">Prioridade</span>
            <Seg value={priority} onChange={setPriority} label="Prioridade" options={[{ value: "1", label: "Alta" }, { value: "2", label: "Média" }, { value: "3", label: "Baixa" }]} />
          </div>
          <Field id="wsaved" label="Valor guardado">
            <input id="wsaved" className="input" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0,00" />
          </Field>
          <Field id="wlink" label="Link">
            <input id="wlink" className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          </Field>
          {item?.link && /^https?:\/\//.test(item.link) && <a href={item.link} target="_blank" rel="noreferrer noopener" className="link">Abrir link</a>}
          <Field id="wnote" label="Observação">
            <textarea id="wnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {editing && !item.bought && (
            <button className="btn ghost" onClick={() => {
              if (save(close, { bought: true })) {
                upsert("transactions", { date: today(), amount: -value, merchant: name.trim(), description: name.trim(), categoryId: "compras", accountId: "", note: "Da lista de desejos" });
                ui.toast("Compra registrada no extrato");
              }
            }}>Marcar como comprado</button>
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
    <Sheet title={item.name} onClose={onClose}
      footer={(close) => (
        <button className="btn" disabled={!value} onClick={() => {
          const next = Math.max(0, (item.saved || 0) + (dir === "add" ? value : -value));
          upsert("wishes", { ...item, saved: Math.round(next * 100) / 100 });
          ui.toast(dir === "add" ? `${fmt(value)} guardado` : `${fmt(value)} retirado`);
          close();
        }}>Confirmar</button>
      )}>
      <div className="muted" style={{ textAlign: "center" }}><Money value={item.saved || 0} /> guardado de <Money value={item.price} /></div>
      <Seg value={dir} onChange={setDir} label="Operação" options={[{ value: "add", label: "Guardar" }, { value: "sub", label: "Retirar" }]} />
      <AmountInput value={amount} onChange={setAmount} />
      <div className="chips wrap" style={{ justifyContent: "center" }}>
        {quick.map((v) => <button key={v} className="chip" onClick={() => setAmount(String(v))}>R$ {v},00</button>)}
        {item.price - (item.saved || 0) > 0 && <button className="chip" onClick={() => setAmount(toInput(Math.round((item.price - (item.saved || 0)) * 100) / 100))}>Valor restante</button>}
      </div>
    </Sheet>
  );
}
