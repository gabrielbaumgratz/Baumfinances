import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Política de segurança de conteúdo: só recursos do próprio app.
// Aplicada apenas no build, porque o servidor de desenvolvimento injeta scripts inline.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

const csp = () => ({
  name: "csp",
  apply: "build",
  transformIndexHtml: (html) => html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

// base "./" permite publicar em qualquer subpasta (ex: GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react(), csp()],
  test: { environment: "node" },
});
