// Bilder Runde 13 C (Einbau Market/Longshot, Wissensbaum): npm run build && node scripts/shots-r13-c.mjs
// ?debug schaltet alles frei und haelt das Profil nur im Speicher. -> docs/r13/c-*.png
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r13');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve();
const browser = await launch();
const VIEW = { width: 1280, height: 720 };
let code = 0;
const errorsAll = [];

async function open(ctx, q = '?debug&seed=7') {
  const page = await ctx.newPage();
  errorsAll.push(watchErrors(page));
  await page.goto(url + q);
  await page.waitForSelector('.app-play', { timeout: 20000 });
  return page;
}
async function startMatch(page, diff = 'medium') {
  await page.click(`.diff[data-diff="${diff}"]`);
  await page.click('.app-play');
  await page.waitForSelector('.m-canvas', { timeout: 20000 });
  await page.waitForTimeout(500);
}
/** Turm an freiem Platz (k = Anteil der Kandidatenliste, optional Mindestabstand zum Weg ignoriert: canPlace entscheidet). */
const place = (page, type, k, tiers = [0, 0, 0]) => page.evaluate(([ty, kk, tr]) => {
  const g = __dw.game, pts = [];
  for (let y = 30; y < 340; y += 10) for (let x = 30; x < 620; x += 10) if (g.canPlace(ty, x * 1000, y * 1000).ok) pts.push([x, y]);
  const [x, y] = pts[Math.min(pts.length - 1, Math.floor(pts.length * kk))];
  const r = g.apply({ type: 'place', tower: ty, x: x * 1000, y: y * 1000 });
  for (let p = 0; p < 3; p++) for (let i = 0; i < tr[p]; i++) g.apply({ type: 'upgrade', towerId: r.id, path: p });
  return r.id;
}, [type, k, tiers]);
/** Naechster gueltiger Platz zu (x, y) (Suche im Raster 4 px), danach Stufen kaufen. */
const placeAt = (page, type, x, y, tiers = [0, 0, 0]) => page.evaluate(([ty, xx, yy, tr]) => {
  const g = __dw.game;
  let best = null, bd = 1e9;
  for (let py = 20; py < 345; py += 4) for (let px = 20; px < 625; px += 4) {
    const d = Math.hypot(px - xx, py - yy);
    if (d < bd && g.canPlace(ty, px * 1000, py * 1000).ok) { bd = d; best = [px, py]; }
  }
  if (!best) return -1;
  const r = g.apply({ type: 'place', tower: ty, x: best[0] * 1000, y: best[1] * 1000 });
  if (!r.ok) return -1;
  for (let p = 0; p < 3; p++) for (let i = 0; i < tr[p]; i++) g.apply({ type: 'upgrade', towerId: r.id, path: p });
  return r.id;
}, [type, x, y, tiers]);
const rectOf = (page) => page.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const clickTower = async (page, id) => {
  const rc = await rectOf(page);
  const p = await page.evaluate((i) => { const t = __dw.game.state.towers.find((q) => q.id === i); return [t.x / 1000, t.y / 1000 - 10]; }, id);
  await page.mouse.click(rc.x + (p[0] / 640) * rc.w, rc.y + (p[1] / 360) * rc.h);
};

try {
  const ctx = await browser.newContext({ viewport: VIEW });

  // 1) Turm-Leiste
  {
    const page = await open(ctx);
    await startMatch(page);
    await page.screenshot({ path: `${out}/c-turmleiste.png` });
    await page.close();
  }

  // 2) Market-Panel mit Bank und Withdraw, Aura
  {
    const page = await open(ctx);
    await startMatch(page);
    await page.evaluate(() => __dw.game.sandbox.setCash(60000));
    const a = await placeAt(page, 'ranger', 150, 150, [2, 0, 0]);
    const b = await placeAt(page, 'bombardier', 205, 128, [1, 0, 1]);
    const c = await placeAt(page, 'frostcaller', 190, 190, [0, 1, 0]);
    const mk = await placeAt(page, 'market', 178, 158, [0, 2, 3]);
    // zwei Runden spielen, damit die Bank Geld hat
    await page.evaluate(() => { const g = __dw.game; for (let i = 0; i < 2; i++) { g.apply({ type: 'startRound' }); __dw.match.skip(60 * 40); } g.sandbox.setCash(60000); });
    await page.evaluate(() => { __dw.game.state.enemies.length = 0; });
    await page.waitForTimeout(300);
    // Aura beim Platzieren: Geist mit Aura-Ring, Tuerme in der Aura des ersten Markets tragen ein Faehnchen
    const rc0 = await rectOf(page);
    const mp = await page.evaluate((i) => { const t = __dw.game.state.towers.find((q) => q.id === i); return [t.x / 1000, t.y / 1000]; }, mk);
    await page.keyboard.press('z');
    const gp = await page.evaluate(([x, y]) => { let best = null, bd = 1e9; for (let py = 20; py < 345; py += 4) for (let px = 20; px < 625; px += 4) { const d = Math.hypot(px - x, py - y); if (d < bd && __dw.game.canPlace('market', px * 1000, py * 1000).ok) { bd = d; best = [px, py]; } } return best; }, [mp[0] + 20, mp[1] + 45]);
    await page.mouse.move(rc0.x + (gp[0] / 640) * rc0.w, rc0.y + (gp[1] / 360) * rc0.h);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/c-market-aura.png` });
    await page.keyboard.press('Escape');
    await clickTower(page, mk);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/c-market-aura-gewaehlt.png` });
    // Panel mit Bank: Market mit Pfad B
    const mb = await placeAt(page, 'market', 470, 250, [0, 3, 0]);
    await page.evaluate(() => { const g = __dw.game; g.apply({ type: 'startRound' }); __dw.match.skip(60 * 40); });
    await page.waitForTimeout(300);
    await clickTower(page, mb);
    await page.waitForSelector('.pi-withdraw');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/c-market-panel.png` });
    const before = await page.evaluate(([i]) => ({ bank: __dw.game.state.towers.find((q) => q.id === i).bank, cash: __dw.game.state.cash }), [mb]);
    await page.click('.pi-withdraw');
    await page.waitForTimeout(300);
    const after = await page.evaluate(([i]) => ({ bank: __dw.game.state.towers.find((q) => q.id === i).bank, cash: __dw.game.state.cash }), [mb]);
    console.log('withdraw', JSON.stringify({ before, after }));
    await page.screenshot({ path: `${out}/c-market-withdraw.png` });
    void a; void b; void c;
    await page.close();
  }

  // 3) Einkommen sichtbar: Runde spielen, Muenzflug bei Rundenende
  {
    const page = await open(ctx);
    await startMatch(page);
    await page.evaluate(() => __dw.game.sandbox.setCash(5000));
    const mk = await placeAt(page, 'market', 200, 160, [1, 0, 0]);
    await page.evaluate(() => { const g = __dw.game; g.apply({ type: 'startRound' }); });
    const cash0 = await page.evaluate(() => __dw.game.state.cash);
    await page.evaluate(() => { __dw.match.setSpeed(2); });
    await page.waitForFunction(() => __dw.game.state.phase === 'build' && __dw.game.state.round === 1, null, { timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(260);
    await page.screenshot({ path: `${out}/c-market-ertrag.png` });
    console.log('ertrag cash', cash0, '->', await page.evaluate(() => __dw.game.state.cash), 'market', mk);
    await page.close();
  }

  // 4) Longshot: Schuss + Markierung am Boss
  {
    const page = await open(ctx);
    await startMatch(page);
    await page.evaluate(() => __dw.game.sandbox.setCash(200000));
    await page.evaluate(() => { __dw.game.state.lives = 100000; });
    const ls = await placeAt(page, 'longshot', 200, 160, [2, 0, 5]);
    await placeAt(page, 'longshot', 250, 215, [5, 0, 0]);
    await page.evaluate(() => { const g = __dw.game; g.sandbox.spawn('leviathan', 500000); g.sandbox.spawn('brute', 470000); g.sandbox.spawn('red', 450000); });
    let shot = false;
    for (let i = 0; i < 400 && !shot; i++) {
      await page.waitForTimeout(100);
      shot = await page.evaluate(() => __dw.game.state.enemies.some((e) => e.markTicks > 0));
    }
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/c-longshot.png` });
    console.log('mark', shot, 'ls', ls);
    await clickTower(page, ls);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/c-longshot-panel.png` });
    await page.close();
  }

  // 5) Kampf mit allen fuenf Tuermen (ohne Plattformen), Muendung im Abschuss-Frame
  {
    const page = await open(ctx, '?debug&seed=11');
    await startMatch(page);
    await page.evaluate(() => { __dw.game.sandbox.setCash(300000); __dw.game.state.lives = 100000; });
    // Gegner entlang des Wegs, Tuerme links und rechts davon
    const ep = await page.evaluate(() => { const g = __dw.game; g.sandbox.spawn('leviathan', 700000); for (const p of [660000, 680000, 720000, 740000, 760000]) g.sandbox.spawn(p > 700000 ? 'ironshell' : 'brute', p); const e = g.state.enemies[0]; return [e.x / 1000, e.y / 1000]; });
    console.log('gegner bei', JSON.stringify(ep));
    await placeAt(page, 'ranger', ep[0] - 40, ep[1] + 40, [3, 1, 0]);
    await placeAt(page, 'bombardier', ep[0] + 40, ep[1] + 45, [0, 3, 1]);
    await placeAt(page, 'frostcaller', ep[0] - 45, ep[1] - 35, [2, 0, 3]);
    await placeAt(page, 'longshot', ep[0] + 5, ep[1] + 80, [1, 3, 0]);
    await placeAt(page, 'market', ep[0] + 60, ep[1] - 40, [0, 0, 3]);
    let tries = 0;
    for (; tries < 300; tries++) {
      const n = await page.evaluate(() => __dw.game.state.towers.filter((t) => t.attackTick > 3 && t.attackTick < 11 && t.type !== 'market').length);
      if (n >= 3) break;
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => { __dw.match.paused = true; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/c-match.png` });
    console.log('angriff gleichzeitig nach', tries, await page.evaluate(() => JSON.stringify(__dw.game.state.towers.map((t) => [t.type, t.attackTick]))));
    await page.close();
  }

  // 5b) Muendung: Ranger, Bombardier, Longshot im Abschuss-Frame, 3-fach vergroessert
  {
    const ctx3 = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 3 });
    const page = await open(ctx3, '?debug&seed=11');
    await startMatch(page);
    await page.evaluate(() => { __dw.game.sandbox.setCash(300000); __dw.game.state.lives = 100000; });
    const ep = await page.evaluate(() => { const g = __dw.game; g.sandbox.spawn('leviathan', 700000); g.sandbox.spawn('leviathan', 650000); const e = g.state.enemies[0]; return [e.x / 1000, e.y / 1000]; });
    await placeAt(page, 'ranger', ep[0] - 28, ep[1] + 30, [0, 0, 0]);
    await placeAt(page, 'bombardier', ep[0] + 30, ep[1] + 34, [0, 0, 0]);
    await placeAt(page, 'longshot', ep[0] - 5, ep[1] + 75, [0, 0, 0]);
    // Sim ohne Anzeige vorspulen (bei 3-fach-Aufloesung rendert die Software-Grafik zu langsam), bis alle drei im Abschuss-Frame stehen
    const got = await page.evaluate(() => {
      __dw.match.paused = true;
      let n = 0;
      for (let i = 0; i < 6000 && n < 3; i++) {
        __dw.match.skip(1);
        n = __dw.game.state.towers.filter((t) => t.attackTick > 3 && t.attackTick < 9).length;
      }
      for (const v of __dw.r.towers.values()) { v.drop = 0; v.up = 0; v.kick = 0; }
      __dw.r.fx.clear();
      return n;
    });
    console.log('gleichzeitig im Angriff:', got);
    await page.waitForTimeout(250);
    const rc = await rectOf(page);
    const box = await page.evaluate(() => { const ts = __dw.game.state.towers; const xs = ts.map((t) => t.x / 1000), ys = ts.map((t) => t.y / 1000); return [Math.min(...xs) - 28, Math.min(...ys) - 48, Math.max(...xs) + 28, Math.max(...ys) + 12]; });
    await page.screenshot({ path: `${out}/c-muendung.png`, clip: { x: rc.x + (box[0] / 640) * rc.w, y: rc.y + (box[1] / 360) * rc.h, width: ((box[2] - box[0]) / 640) * rc.w, height: ((box[3] - box[1]) / 360) * rc.h } });
    console.log('muendung', await page.evaluate(() => JSON.stringify(__dw.game.state.towers.map((t) => [t.type, t.attackTick, t.x / 1000, t.y / 1000]))));
    await page.close();
    await ctx3.close();
  }

  // 6) Wissensbaum
  {
    const page = await open(ctx);
    await page.evaluate(() => {});
    await page.click('.navbtn:has-text("Knowledge")');
    await page.waitForSelector('.knode');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/c-wissensbaum.png` });
    const box = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, n: document.querySelectorAll('.knode').length }));
    console.log('wissensbaum', JSON.stringify(box));
    await page.close();
  }

  const bad = errorsAll.flat();
  console.log('konsolenfehler:', JSON.stringify(bad));
  if (bad.length) code = 1;
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
  stop();
}
process.exit(code);
