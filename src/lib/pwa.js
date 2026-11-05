import { useEffect, useState } from "react";

const native = () => !!window.Capacitor?.isNativePlatform?.();

/** Está aberto como app instalado (tela de início) ou app nativo? */
export function isInstalled() {
  return native() || window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches;
}

export function platform() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV|Line\//.test(ua) ? "ios-other" : "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

// O Chrome/Edge avisa quando o app pode ser instalado; guardamos o evento para o botão "Instalar".
let deferred = null;
const listeners = new Set();
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
  listeners.forEach((f) => f(true));
});
window.addEventListener("appinstalled", () => { deferred = null; listeners.forEach((f) => f(false)); });

export function useInstallPrompt() {
  const [can, setCan] = useState(!!deferred);
  useEffect(() => { listeners.add(setCan); return () => listeners.delete(setCan); }, []);
  return can ? async () => { deferred.prompt(); await deferred.userChoice; deferred = null; setCan(false); } : null;
}

/* ───────── atualização automática ─────────
 * Cada build gera um service worker com versão própria. Quando o repositório é atualizado e
 * publicado, o app detecta a nova versão, baixa em segundo plano e aplica. */
let waiting = null;
const updListeners = new Set();
const announce = () => updListeners.forEach((f) => f(!!waiting));

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD || native()) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: "none" });
      const track = (w) => w && w.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) { waiting = w; announce(); }
      });
      if (reg.waiting && navigator.serviceWorker.controller) { waiting = reg.waiting; announce(); }
      reg.addEventListener("updatefound", () => track(reg.installing));
      // Procura novas versões ao voltar para o app e a cada 30 minutos.
      document.addEventListener("visibilitychange", () => !document.hidden && reg.update().catch(() => {}));
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch { /* sem service worker: o app segue funcionando online */ }
  });
}

export const applyUpdate = () => waiting?.postMessage("skipWaiting");

export function useUpdateAvailable() {
  const [has, setHas] = useState(!!waiting);
  useEffect(() => { updListeners.add(setHas); return () => updListeners.delete(setHas); }, []);
  return has;
}
