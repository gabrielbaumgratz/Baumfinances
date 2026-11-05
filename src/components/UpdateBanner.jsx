import { applyUpdate, useUpdateAvailable } from "../lib/pwa.js";

export default function UpdateBanner() {
  const has = useUpdateAvailable();
  if (!has) return null;
  return (
    <div className="toast" role="status">
      <span>Nova versão disponível.</span>
      <button onClick={applyUpdate}>Atualizar</button>
    </div>
  );
}
