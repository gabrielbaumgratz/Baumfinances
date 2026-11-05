// Gera os prints do README (precisa do app rodando em "npm run preview -- --port 4173" e do Playwright):
// node scripts/screenshots.cjs
const { chromium } = require("playwright");
const U = "http://localhost:4173/";
const out = "docs/screenshots";
(async () => {
  const b = await chromium.launch();
  async function session(w, h, scheme, dsf = 2) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: dsf });
    // Simula o app instalado na tela de início.
    await ctx.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date('2026-11-24T10:00:00'));
    await p.goto(U); await p.waitForTimeout(300);
    return { ctx, p };
  }
  const enter = async (p) => {
    await p.click('[role="checkbox"]'); await p.click("text=Ver com dados de exemplo"); await p.waitForTimeout(300);
    await p.fill("#cp-1", "70315528"); await p.fill("#cp-2", "70315528"); await p.click("text=Criar PIN");
    await p.waitForSelector(".nav", { timeout: 15000 }); await p.waitForTimeout(300);
  };
  const at = async (p, r, file) => { await p.goto(`${U}#/${r}`); await p.waitForTimeout(450); await p.screenshot({ path: `${out}/${file}.png` }); };

  let s = await session(390, 844, "light");
  await s.p.screenshot({ path: `${out}/mobile-boas-vindas.png` });
  await enter(s.p);
  await at(s.p, "inicio", "mobile-inicio");
  await at(s.p, "extrato", "mobile-extrato");
  await at(s.p, "planejamento/fixos", "mobile-fixos");
  await at(s.p, "planejamento/desejos", "mobile-desejos");
  await s.p.goto(`${U}#/inicio`); await s.p.waitForTimeout(300); await s.p.click(".fab"); await s.p.waitForTimeout(500);
  await s.p.screenshot({ path: `${out}/mobile-novo-lancamento.png` });
  await s.ctx.close();

  // Telas de segurança
  s = await session(390, 844, "light");
  await s.ctx.clearCookies();
  await s.p.click('[role="checkbox"]'); await s.p.click("text=Começar"); await s.p.waitForTimeout(300);
  await s.p.screenshot({ path: `${out}/mobile-criar-pin.png` });
  await s.ctx.close();

  s = await session(390, 844, "dark");
  await enter(s.p);
  await at(s.p, "inicio", "mobile-inicio-escuro");
  await at(s.p, "analise", "mobile-analise-escuro");
  await at(s.p, "ajustes", "mobile-ajustes-escuro");
  await s.ctx.close();

  s = await session(1440, 900, "light", 1);
  await enter(s.p);
  await at(s.p, "inicio", "desktop-inicio");
  await at(s.p, "analise", "desktop-analise");
  await s.ctx.close();
  s = await session(1440, 900, "dark", 1);
  await enter(s.p);
  await at(s.p, "inicio", "desktop-inicio-escuro");
  await s.ctx.close();
  await b.close();
})();
