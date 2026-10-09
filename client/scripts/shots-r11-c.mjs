// Bilder fuer Runde 11c (schlankes Turm-Panel): npm run build && node scripts/shots-r11-c.mjs
// Profil OHNE debug (`?hooks`: Level 4, keine Stufe frei, XP nur im Speicher) -> docs/r11/c-panel.png, c-unlock-popup.png, c-panel-maxed.png
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r11');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve();
const browser = await launch();
const VIEW = { width: 1600, height: 900 };
let code = 0;

async function open(ctx) {
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(url + '?hooks&seed=5');
  await page.click('.diff[data-diff="medium"]');
  await page.click('.app-play');
  await page.waitForSelector('.m-canvas', { timeout: 20000 });
  await page.waitForTimeout(500);
  return { page, errors };
}
const place = (page) => page.evaluate(() => {
  const g = __dw.game, pts = [];
  for (let y = 30; y < 340; y += 14) for (let x = 30; x < 620; x += 14) if (g.canPlace('ranger', x * 1000, y * 1000).ok) pts.push([x, y]);
  const [x, y] = pts[Math.floor(pts.length / 3)];
  return g.apply({ type: 'place', tower: 'ranger', x: x * 1000, y: y * 1000 }).id;
});
const state = (page) => page.evaluate(() => JSON.stringify({ tiers: __dw.game.state.towers[0].tiers, maxTier: __dw.game.state.maxTier.ranger, xp: __dw.game.state.towerXp.ranger, cash: __dw.game.state.cash }));
const kinds = (page) => page.$$eval('.ps-row', (rs) => rs.map((r) => r.dataset.kind));

try {
  const ctx = await browser.newContext({ viewport: VIEW });
  // 1) Turm 2-0-1: A kaufbar, B per Crosspath zu, C nicht freigeschaltet (XP reichen) -> Klick, Pop-up, Enter, Kauf
  {
    const { page, errors } = await open(ctx);
    const id = await place(page);
    await page.evaluate(() => {
      const g = __dw.game, tid = g.state.towers[0].id;
      g.sandbox.setCash(5000);
      g.state.towerXp.ranger = 2000;
      for (const p of [0, 0, 0, 2]) g.apply({ type: 'unlockTier', tower: 'ranger', path: p });
      for (const p of [0, 0, 2]) g.apply({ type: 'upgrade', towerId: tid, path: p });
      g.state.towerXp.ranger = 300; // C Stufe 2 kostet 250 XP: reicht (A Stufe 3 ist frei und kaufbar, B ist per Crosspath zu)
      g.sandbox.setCash(900);
    });
    await page.evaluate((i) => __dw.match.select(i), id);
    await page.waitForSelector('.m-panel.slim .ps-row');
    await page.waitForTimeout(500);
    console.log('zustaende', JSON.stringify(await kinds(page)), await state(page));
    await page.hover('.ps-row:nth-child(3) .ps-next');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/c-panel.png` });
    // Klick -> Pop-up
    await page.click('.ps-row:nth-child(3) .ps-next');
    await page.waitForSelector('.m-confirm:not(.hidden) .cf-box');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/c-unlock-popup.png` });
    // Enter -> freigeschaltet, Knopf zeigt sofort den Goldpreis
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const after = await kinds(page);
    console.log('nach Enter', JSON.stringify(after), await state(page), await page.$eval('.ps-row:nth-child(3) .pn-price', (e) => e.textContent));
    if (after[2] !== 'buy') { console.log('FAIL: Pfad C sollte kaufbar sein'); code = 1; }
    await page.click('.ps-row:nth-child(3) .ps-next');
    await page.waitForTimeout(300);
    console.log('nach Kauf', await state(page));
    console.log('c-panel', errors.length ? errors : 'ok');
    if (errors.length) code = 1;
    await page.close();
  }
  // 1b) Turm 3-0-0: A braucht 900/2500 XP (zu wenig), B freigeschaltet aber Geld fehlt, C nicht freigeschaltet (XP reichen)
  {
    const { page, errors } = await open(ctx);
    const id = await place(page);
    await page.evaluate(() => {
      const g = __dw.game, tid = g.state.towers[0].id;
      g.sandbox.setCash(20000);
      g.state.towerXp.ranger = 5000;
      for (const p of [0, 0, 0, 1]) g.apply({ type: 'unlockTier', tower: 'ranger', path: p });
      for (const p of [0, 0, 0]) g.apply({ type: 'upgrade', towerId: tid, path: p });
      g.state.towerXp.ranger = 130;
      g.sandbox.setCash(20);
    });
    await page.evaluate((i) => __dw.match.select(i), id);
    await page.waitForSelector('.m-panel.slim .ps-row');
    await page.waitForTimeout(500);
    console.log('zustaende 3-0-0', JSON.stringify(await kinds(page)));
    await page.screenshot({ path: `${out}/c-panel-zustaende.png` });
    if (errors.length) code = 1;
    await page.close();
  }
  // 2) 5-2-0: Pfad A maxed, B und C zu
  {
    const { page, errors } = await open(ctx);
    const id = await place(page);
    await page.evaluate(() => {
      const g = __dw.game, tid = g.state.towers[0].id;
      g.sandbox.setCash(100000);
      g.state.towerXp.ranger = 20000;
      for (const p of [0, 0, 0, 0, 0, 1, 1]) g.apply({ type: 'unlockTier', tower: 'ranger', path: p });
      for (const p of [0, 0, 0, 0, 0, 1, 1]) g.apply({ type: 'upgrade', towerId: tid, path: p });
      g.state.towerXp.ranger = 340;
    });
    await page.evaluate((i) => __dw.match.select(i), id);
    await page.waitForSelector('.m-panel.slim .ps-row');
    await page.waitForTimeout(500);
    console.log('maxed', JSON.stringify(await kinds(page)));
    await page.screenshot({ path: `${out}/c-panel-maxed.png` });
    if (errors.length) code = 1;
    await page.close();
  }
  await ctx.close();
} finally {
  await browser.close();
  stop();
}
process.exit(code);
