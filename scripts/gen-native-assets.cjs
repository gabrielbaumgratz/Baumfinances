// Gera as imagens-base para ícones e splash nativos (Android/iOS). Depois rode:
// npx @capacitor/assets generate --iconBackgroundColor "#183020" --splashBackgroundColor "#183020"
const { chromium } = require("playwright");
const G = "#183020", L = "#f3f6f2";
const mark = (s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${s}" height="${s}"><path d="M16 6v12" stroke="${L}" stroke-width="1.6" stroke-linecap="round"/><path d="M16 17.5l3.6 4.6a4.5 4.5 0 1 1-7.2 0z" fill="${L}"/></svg>`;
const page = (size, bg, markSize) => `<style>*{margin:0}body{width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg}}</style>${mark(markSize)}`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const shots = [
    ["icon-only.png", 1024, G, 1024],
    ["icon-foreground.png", 1024, "transparent", 640],
    ["icon-background.png", 1024, G, 0],
    ["splash.png", 2732, G, 600],
    ["splash-dark.png", 2732, G, 600],
  ];
  for (const [name, size, bg, m] of shots) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(m ? page(size, bg, m) : `<style>*{margin:0}body{width:${size}px;height:${size}px;background:${bg}}</style>`);
    await p.screenshot({ path: `assets/${name}`, omitBackground: bg === "transparent" });
  }
  await b.close();
})();
