import { StoreProvider } from "./lib/store.jsx";
import { isInstalled } from "./lib/pwa.js";
import { AUTH } from "./config.js";
import App from "./App.jsx";
import Install from "./screens/Install.jsx";
import AuthGate from "./screens/auth/AuthGate.jsx";
import { usePrivacyRoute, PublicPrivacy } from "./components/PublicPrivacy.jsx";
import UpdateBanner from "./components/UpdateBanner.jsx";
import PrivacyCurtain from "./components/PrivacyCurtain.jsx";

/**
 * Camadas de proteção, nesta ordem:
 * 1. app instalado na tela de início (ou app nativo)
 * 2. conta: login, e-mail verificado e 2FA (quando o servidor está configurado)
 * 3. PIN do aparelho, que descriptografa os dados
 */
export default function Root() {
  const privacy = usePrivacyRoute();
  // Em desenvolvimento local, dá para testar no navegador sem instalar.
  if (!isInstalled() && !import.meta.env.DEV) return privacy ? <PublicPrivacy /> : <Install />;

  return (
    <>
      {AUTH.enabled ? (
        <AuthGate>{(user) => <StoreProvider key={user.id} ns={user.id}><App /></StoreProvider>}</AuthGate>
      ) : (
        <StoreProvider ns="local"><App /></StoreProvider>
      )}
      <UpdateBanner />
      <PrivacyCurtain />
    </>
  );
}
