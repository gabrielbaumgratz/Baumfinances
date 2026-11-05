import Money from "./Money.jsx";
import { Dot } from "./ui.jsx";
import { useLookup } from "../lib/store.jsx";

export default function TxRow({ tx, onClick, date }) {
  const { cat, acc } = useLookup();
  const a = acc(tx.accountId);
  return (
    <button className="item" onClick={onClick}>
      <div className="body">
        <div className="t">{tx.merchant || tx.description}</div>
        <div className="m row" style={{ gap: 10 }}>
          {date && <span>{date}</span>}
          <span>{cat(tx.categoryId).name}</span>
          {a && <span className="row" style={{ gap: 6 }}><Dot color={a.color} />{a.name}</span>}
          {tx.fixedId && <span>Fixo</span>}
        </div>
      </div>
      <div className={`v ${tx.amount > 0 ? "pos" : ""}`}><Money value={tx.amount} signed /></div>
    </button>
  );
}
