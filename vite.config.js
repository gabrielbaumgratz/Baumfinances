import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const authOrigin = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).origin : "";
  const build = `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;

  // Política de segurança de conteúdo: só recursos do próprio app (e o servidor de login, se configurado).
  const CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${authOrigin ? ` ${authOrigin} ${authOrigin.replace("https://", "wss://")}` : ""}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return {
    // base "./" permite publicar em qualquer subpasta (ex: GitHub Pages).
    base: "./",
    define: { __BUILD__: JSON.stringify(build) },
    plugins: [
      react(),
      {
        name: "security-and-version",
        apply: "build",
        transformIndexHtml: (html) => html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
        // Cada build ganha uma versão própria no service worker, o que dispara a atualização automática.
        closeBundle() {
          const sw = resolve("dist/sw.js");
          if (existsSync(sw)) writeFileSync(sw, readFileSync(sw, "utf8").replace("__BUILD_VERSION__", build));
        },
      },
    ],
    build: { sourcemap: false, minify: "esbuild" },
    // Remove console e debugger do código publicado.
    esbuild: mode === "production" ? { drop: ["console", "debugger"], legalComments: "none" } : {},
    test: { environment: "node" },
  };
});
