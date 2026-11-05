import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root.jsx";
import { registerServiceWorker } from "./lib/pwa.js";
import "./styles.css";

// Impede que o app seja carregado dentro de outro site (clickjacking).
if (window.top !== window.self) {
  document.body.innerHTML = "";
  throw new Error("Prumo não pode ser exibido dentro de outra página.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

registerServiceWorker();
