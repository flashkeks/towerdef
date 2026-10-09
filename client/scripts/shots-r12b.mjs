// Bilder fuer Runde 12b (Turm-Panel: Buehne, Knoepfe): npm run build && node scripts/shots-r12b.mjs
// -> docs/r12/polish-panel.png (0-0-0 und T5), polish-knoepfe.png (alle Knopfzustaende)
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r12');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve();
const browser = await launch();
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
const place = (page, type, k = 0.33) => page.evaluate(([ty, f]) => {
  const g = __dw.game, pts = [];
  for (let y = 30; y < 340; y += 14) for (let x = 30; x < 620; x += 14) if (g.canPlace(ty, x * 1000, y * 1000).ok) pts.push([x, y]);
  const [x, y] = pts[Math.floor(pts.length * f)];
  return g.apply({ type: 'place', tower: ty, x: x * 1000, y: y * 1000 }).id;
}, [type, k]);
const sel = async (page, id) => {
  await page.evaluate((i) => __dw.match.select(i), id);
  await page.waitForSelector('.m-panel.slim .ps-row');
  await page.waitForTimeout(500);
};
const panel = (page, path) => page.locator('.m-panel.slim').screenshot({ path });

try {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const shots = [];
  // Buehne: je Turmtyp 0-0-0 und volle Ausbau-Stufen
  for (const ty of ['ranger', 'bombardier', 'frostcaller', 'ballista']) {
    for (const full of [false, true]) {
      const { page, errors } = await open(ctx);
      let id;
      try { id = await place(page, ty); } catch { await page.close(); continue; }
      if (full) await page.evaluate(([ty2]) => {
        const g = __dw.game, tid = g.state.towers[0].id;
        g.sandbox.setCash(1e7); g.state.towerXp[ty2] = 1e6;
        const seq = [0, 0, 0, 0, 0, 1, 1];
        for (const p of seq) g.apply({ type: 'unlockTier', tower: ty2, path: p });
        for (const p of seq) g.apply({ type: 'upgrade', towerId: tid, path: p });
      }, [ty]);
      await sel(page, id);
      const f = `${out}/_stage-${ty}-${full ? 'T5' : 'T0'}.png`;
      await page.locator('.ps-stage').screenshot({ path: f });
      shots.push(f);
      if (errors.length) { console.log(ty, errors); code = 1; }
      await page.close();
    }
  }
  console.log('stages', shots.length);

  // Knopfzustaende in einem Turm: buy / poor / unlock / needxp / closed / maxed
  {
    const { page, errors } = await open(ctx);
    const id = await place(page, 'ranger');
    await page.evaluate(() => {
      const g = __dw.game, tid = g.state.towers[0].id;
      g.sandbox.setCash(1e6); g.state.towerXp.ranger = 1e6;
      for (const p of [0, 0, 0, 0, 0, 1, 1, 2]) g.apply({ type: 'unlockTier', tower: 'ranger', path: p });
      for (const p of [0, 0, 0, 0, 0, 1, 1]) g.apply({ type: 'upgrade', towerId: tid, path: p });
    });
    await sel(page, id);
    const k1 = await page.$$eval('.ps-row', (r) => r.map((x) => x.dataset.kind));
    await panel(page, `${out}/_k-a.png`);
    // zweiter Turm: buy, poor, unlock/needxp
    const id2 = await place(page, 'bombardier', 0.7);
    await page.evaluate(() => {
      const g = __dw.game, t = g.state.towers[1];
      g.state.towerXp.bombardier = 200;
      g.sandbox.setCash(1e6);
      for (const p of [0, 0, 1]) g.apply({ type: 'unlockTier', tower: 'bombardier', path: p });
      g.apply({ type: 'upgrade', towerId: t.id, path: 0 });
      g.sandbox.setCash(150);
    });
    await sel(page, id2);
    const k2 = await page.$$eval('.ps-row', (r) => r.map((x) => x.dataset.kind));
    await panel(page, `${out}/_k-b.png`);
    // dritter Turm: unlock (XP reichen, nicht freigeschaltet), buy (Gold reicht)
    await page.evaluate(() => __dw.game.sandbox.setCash(1e6));
    const id3 = await place(page, 'frostcaller', 0.5);
    await page.evaluate(() => {
      const g = __dw.game, t = g.state.towers[2];
      g.sandbox.setCash(1e6);
      g.state.towerXp.frostcaller = 1e6;
      g.apply({ type: 'unlockTier', tower: 'frostcaller', path: 0 });
      g.apply({ type: 'upgrade', towerId: t.id, path: 0 });
      g.apply({ type: 'unlockTier', tower: 'frostcaller', path: 1 });
      g.state.towerXp.frostcaller = 300;
    });
    await sel(page, id3);
    const k3 = await page.$$eval('.ps-row', (r) => r.map((x) => x.dataset.kind));
    await panel(page, `${out}/_k-c.png`);
    console.log('kinds', k1, k2, k3);
    if (errors.length) { console.log(errors); code = 1; }
    await page.close();
  }
  await ctx.close();
} finally {
  await browser.close();
  stop();
}
process.exit(code);
