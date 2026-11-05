import Icon from "./Icon.jsx";
import Money from "./Money.jsx";
import { CatIcon } from "./ui.jsx";
import { useLookup } from "../lib/store.jsx";

export default function TxRow({ tx, onClick, showDate }) {
  const { cat, acc } = useLookup();
  const c = cat(tx.categoryId);
  const a = acc(tx.accountId);
  return (
    <button className="item" onClick={onClick}>
      <CatIcon cat={c} />
      <div className="main-col">
        <div className="title">{tx.merchant || tx.description}</div>
        <div className="meta">
          {showDate && <><span>{showDate}</span><span aria-hidden>·</span></>}
          <span>{c.name}</span>
          {a && <><span aria-hidden>·</span><span className="dot" style={{ background: a.color, width: 7, height: 7 }} /><span>{a.name}</span></>}
          {tx.note && <Icon name="text" size={13} label="tem nota" />}
          {tx.fixedId && <Icon name="repeat" size={13} label="fixo" />}
        </div>
      </div>
      <div className={`amt ${tx.amount > 0 ? "pos" : ""}`}><Money value={tx.amount} signed /></div>
    </button>
  );
}
