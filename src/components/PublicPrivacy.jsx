import { useEffect, useState } from "react";
import Privacy from "../screens/Privacy.jsx";

const isPrivacy = () => location.hash.startsWith("#/privacidade");

export function usePrivacyRoute() {
  const [on, setOn] = useState(isPrivacy);
  useEffect(() => {
    const f = () => setOn(isPrivacy());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return on;
}

/** Política de Privacidade acessível antes de instalar ou entrar. */
export function PublicPrivacy() {
  return <main className="main" style={{ marginLeft: 0 }}><Privacy public go={() => (location.hash = "")} /></main>;
}

