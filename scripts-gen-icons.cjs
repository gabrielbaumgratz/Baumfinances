// Renders the SVG icons to PNG using the preinstalled Playwright Chromium: node scripts-gen-icons.cjs
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [src, size, out] of [["icon.svg", 192, "icon-192.png"], ["icon.svg", 512, "icon-512.png"], ["icon-maskable.svg", 512, "icon-maskable-512.png"]]) {
    const svg = fs.readFileSync(`public/${src}`, "utf8");
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<style>*{margin:0}body{background:transparent}</style>${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}`);
    await p.screenshot({ path: `public/${out}`, omitBackground: true });
  }
  await b.close();
})();
