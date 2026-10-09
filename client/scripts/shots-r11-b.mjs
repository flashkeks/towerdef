// Bilder fuer Runde 11b (Turm-XP, Freischalten im Match): npm run build && node scripts/shots-r11-b.mjs
// Profil OHNE debug: `?hooks` = frisches Profil auf Level 4 (alle Tuerme, aber keine Stufe frei), nur im Speicher, plus window.__dw.
// -> docs/r11/b-unlock-menue.png, b-upgrade-verdeckt.png, b-ergebnis-xp.png, b-runde-ende.png
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
const spots = (page) => page.evaluate(() => {
  const g = __dw.game, out = [];
  for (let y = 30; y < 340; y += 14) for (let x = 30; x < 620; x += 14) if (g.canPlace('ranger', x * 1000, y * 1000).ok) out.push([x, y]);
  return out;
});

try {
  const ctx = await browser.newContext({ viewport: VIEW });
  // 1) Freischalt-Menue und verdeckte Stufen im Panel
  {
    const { page, errors } = await open(ctx);
    const sp = await spots(page);
    const id = await page.evaluate(([x, y]) => { const r = __dw.game.apply({ type: 'place', tower: 'ranger', x: x * 1000, y: y * 1000 }); return r.id; }, sp[Math.floor(sp.length / 3)]);
    await page.evaluate(() => {
      const g = __dw.game;
      g.sandbox.setCash(5000);
      g.state.towerXp.ranger = 450; // 100 + 250 (Pfad 1, Stufe 1-2), 100 (Pfad 2, Stufe 1)
      for (const p of [0, 0, 1]) g.apply({ type: 'unlockTier', tower: 'ranger', path: p });
      g.apply({ type: 'upgrade', towerId: __dw.game.state.towers[0].id, path: 0 });
      g.state.towerXp.ranger = 320;
    });
    await page.evaluate((i) => __dw.match.select(i), id);
    await page.waitForSelector('.m-panel:not(.hidden) .p-tier');
    await page.waitForTimeout(400);
    await page.hover('.p-col:nth-child(2) .p-tier:nth-of-type(4)'); // verdeckte Stufe: Hinweistext unten
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/b-upgrade-verdeckt.png` });
    await page.click('.p-unlock');
    await page.waitForSelector('.m-unlock:not(.hidden) .um-tier');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/b-unlock-menue.png` });
    // Kauf im Menue
    await page.click('.um-btn:not(.off)');
    await page.waitForTimeout(300);
    console.log('menue', errors.length ? errors : 'ok', await page.evaluate(() => JSON.stringify([__dw.game.state.maxTier.ranger, __dw.game.state.towerXp.ranger])));
    if (errors.length) code = 1;
    await page.close();
  }
  // 2) Rundenende-Anzeige und Ergebnis mit verdienten Turm-XP
  {
    const { page, errors } = await open(ctx);
    const sp = await spots(page);
    await page.evaluate((pts) => {
      const g = __dw.game;
      g.sandbox.setCash(9000);
      const types = ['ranger', 'ranger', 'bombardier', 'frostcaller'];
      let k = 0;
      for (const t of types) { const [x, y] = pts[Math.floor((pts.length * (k + 1)) / 6)]; k++; g.apply({ type: 'place', tower: t, x: x * 1000, y: y * 1000 }); }
      g.apply({ type: 'autoStart', on: true });
      g.apply({ type: 'startRound' });
    }, sp);
    let shotRound = false;
    for (let i = 0; i < 400; i++) {
      await page.evaluate(() => __dw.match.skip(20));
      const rc = await page.evaluate(() => __dw.game.state.roundsCleared);
      if (!shotRound && rc >= 1) { shotRound = true; await page.waitForTimeout(250); await page.screenshot({ path: `${out}/b-runde-ende.png` }); }
      if (rc >= 5) break;
    }
    await page.evaluate(() => __dw.match.end(true));
    await page.waitForSelector('.result[data-done="1"]', { timeout: 20000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/b-ergebnis-xp.png` });
    console.log('ergebnis', errors.length ? errors : 'ok');
    if (errors.length) code = 1;
    await page.close();
  }
  await ctx.close();
} finally {
  await browser.close();
  stop();
}
process.exit(code);
