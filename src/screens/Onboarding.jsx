import { useStore, emptyState } from "../lib/store.jsx";
import { demoState } from "../lib/demo.js";
import Logo from "../components/Logo.jsx";
import Icon from "../components/Icon.jsx";

export default function Onboarding() {
  const { init } = useStore();
  return (
    <div className="onb page">
      <div>
        <Logo size={36} />
        <h1>Seu dinheiro,<br /><em>sem mistério.</em></h1>
        <p>Veja quanto você tem, pra onde vai cada real e o que dá pra planejar. Tudo num lugar só.</p>
        <ul>
          <li><span className="ico-tile brand"><Icon name="bank" /></span>Todas as suas contas e cartões juntos</li>
          <li><span className="ico-tile brand"><Icon name="store" /></span>Onde, quanto e quantas vezes você gastou</li>
          <li><span className="ico-tile brand"><Icon name="calendar" /></span>Gastos fixos, planos e lista de desejos</li>
          <li><span className="ico-tile brand"><Icon name="shield" /></span>Seus dados ficam só no seu aparelho</li>
        </ul>
      </div>
      <div className="stack" style={{ gap: 10, marginTop: 40 }}>
        <button className="btn block" onClick={() => init(emptyState())}>Começar do zero</button>
        <button className="btn block ghost" onClick={() => init(demoState())}>Explorar com dados de exemplo</button>
      </div>
    </div>
  );
}
