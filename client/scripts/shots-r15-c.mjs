// Bilder Runde 15 C (Kartenwahl, Modus-Auswahl, Matches auf drei Karten, Bosse): npm run build && node scripts/shots-r15-c.mjs [teil ...]
// Teile: menu, meadow, frostfen, quarry, boss, modes. Matches starten ueber Menueklicks; ?debug schaltet alles frei, ?hooks/?level=N ein normales Profil.
// Ergebnis: docs/r15/c-*.png
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r15');
mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);
const want = (k) => only.length === 0 || only.includes(k);
const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4173));
const browser = await launch();
const VIEW = { width: 1280, height: 720 };
const errorsAll = [];

async function open(q = '?debug&seed=7') {
  const page = await browser.newPage({ viewport: VIEW });
  errorsAll.push(watchErrors(page));
  await page.goto(url + q);
  await page.waitForSelector('.maptile', { timeout: 20000 });
  return page;
}
/** Vorschaubilder werden im Hintergrund gemalt: warten, bis alle drei da sind. */
const previewsReady = (page) => page.waitForFunction(() => (document.querySelectorAll('.maptile').length > 0 && document.querySelectorAll('.maptile canvas.pv').length >= document.querySelectorAll('.maptile').length), null, { timeout: 40000 });
/** Karte, Modus und Schwierigkeit ueber Klicks waehlen, Match starten. */
async function startMatch(page, { map = 'meadow', mode = 'standard', diff = 'medium' } = {}) {
  await page.click(`.maptile[data-map="${map}"]`);
  await page.waitForSelector('.app-play');
  if (mode !== 'standard') await page.click(`.mode[data-mode="${mode}"]`);
  await page.click(`.diff[data-diff="${diff}"]`);
  await page.click('.app-play');
  await page.waitForSelector('.m-canvas', { timeout: 40000 });
  await page.waitForTimeout(500);
}
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const rectOf = (page) => page.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
/** Ausschnitt der Karte (Kartenpixel), danach 3x ohne Glaettung vergroessert. */
async function shotZoom(page, name, mx, my, mw = 230, mh = 150) {
  const rc = await rectOf(page);
  const k = rc.w / 640;
  const x = Math.max(rc.x, rc.x + (mx - mw / 2) * k), y = Math.max(rc.y, rc.y + (my - mh / 2) * k);
  const file = `${out}/${name}.png`;
  await page.screenshot({ path: file, clip: { x, y, width: Math.min(mw * k, rc.x + rc.w - x), height: Math.min(mh * k, rc.y + rc.h - y) } });
  try { execFileSync('python3', ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.resize((im.width*3,im.height*3),Image.NEAREST).save(sys.argv[1])', file]); } catch { /* ohne PIL */ }
}
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
const rich = (page) => page.evaluate(() => { __dw.game.sandbox.setCash(300000); __dw.game.state.lives = 100000; });
/** Sim anhalten (Bild und Effekte stehen still) bzw. weiterlaufen lassen. */
const hold = (page) => page.evaluate(() => { __dw.match.speed = 0; });
const go = (page, sp = 1) => page.evaluate((s) => { __dw.match.speed = s; }, sp);
/** n Ticks Sim ohne Anzeige-Events vorspulen (Gegner laufen weiter, Effekte entstehen nicht). */
const skip = (page, n) => page.evaluate((k) => __dw.match.skip(k), n);
const spawn = (page, list) => page.evaluate((l) => l.map(([ty, prog, camo, br, tr]) => __dw.game.sandbox.spawn(ty, prog * 1000, !!camo, br ?? 0, tr ?? {})), list);

const prof = (page, patch) => page.evaluate(async (pt) => { const s = __app.store; await s.update({ ...s.profile, ...pt }); }, patch);
const goHome = (page) => page.evaluate(() => __app.go({ name: 'home' }));

if (want('menu')) {
  // frischer Spieler: Karten 2 und 3 gesperrt, Bedingung auf dem Schloss
  let page = await open('?hooks&level=1&seed=7');
  await previewsReady(page);
  await shot(page, 'c-kartenwahl-gesperrt');
  console.log('menu: gesperrt');
  // mit Medaillen: Meadow komplett, Frostfen Easy+Medium, Modus-Medaillen
  await page.close();
  page = await open('?debug&seed=7');
  await previewsReady(page);
  await prof(page, {
    medals: { meadow: { easy: true, medium: true, hard: true }, frostfen: { easy: true, medium: true, hard: false } },
    best: { meadow: { easy: { round: 20, livesLost: 3 }, medium: { round: 20, livesLost: 12 }, hard: { round: 20, livesLost: 40 } }, frostfen: { easy: { round: 25, livesLost: 10 }, medium: { round: 25, livesLost: 30 }, hard: { round: 17, livesLost: 100 } }, quarry: { easy: { round: 11, livesLost: 50 } } },
    modeMedals: { meadow: { 'primary-only': { easy: true, medium: false, hard: false }, 'no-hero': { easy: true, medium: true, hard: false } } },
  });
  await goHome(page);
  await previewsReady(page);
  await page.waitForTimeout(300);
  await shot(page, 'c-kartenwahl');
  console.log('menu: Kartenwahl');
  // Modus-Auswahl Frostfen, Teil gesperrt (nur Easy-Medaille auf der Karte)
  await page.close();
  page = await open('?hooks&level=10&seed=7');
  await prof(page, { medals: { meadow: { easy: true, medium: true, hard: false }, frostfen: { easy: true, medium: false, hard: false } }, modeMedals: { frostfen: { 'primary-only': { easy: true, medium: false, hard: false } } } });
  await goHome(page);
  await previewsReady(page);
  await page.click('.maptile[data-map="frostfen"]');
  await page.waitForSelector('.app-play');
  await page.click('.mode[data-mode="primary-only"]');
  await page.waitForTimeout(300);
  await shot(page, 'c-modus-auswahl');
  console.log('menu: Modus-Auswahl');
  const fit = await page.evaluate(() => { const sc = document.querySelector('.dw-screens'); return { sh: sc.scrollHeight, ch: sc.clientHeight, sw: sc.scrollWidth, cw: sc.clientWidth }; });
  console.log('setup ohne Scrollen:', JSON.stringify(fit));
  await page.close();
  // alles frei, Quarry + Deflation
  page = await open('?debug&seed=7');
  await previewsReady(page);
  await page.click('.maptile[data-map="quarry"]');
  await page.waitForSelector('.app-play');
  await page.click('.mode[data-mode="deflation"]');
  await page.click('.diff[data-diff="hard"]');
  await page.waitForTimeout(300);
  await shot(page, 'c-modus-auswahl-quarry');
  const home = await (async () => { await goHome(page); await page.waitForSelector('.maptile'); return page.evaluate(() => { const sc = document.querySelector('.dw-screens'); return { sh: sc.scrollHeight, ch: sc.clientHeight }; }); })();
  console.log('home ohne Scrollen:', JSON.stringify(home));
  await page.close();
}

if (want('meadow')) {
  const page = await open();
  await startMatch(page, { map: 'meadow' });
  await rich(page);
  await placeAt(page, 'ranger', 150, 160, [3, 2, 0]);
  await placeAt(page, 'bombardier', 330, 190, [2, 0, 3]);
  await placeAt(page, 'frostcaller', 240, 60);
  await spawn(page, [['red', 40], ['blue', 120], ['green', 180, false, 0, { regrow: true }], ['pink', 260], ['crystal', 420, false, 0, { fortified: true }], ['gold', 500], ['ironshell', 580, true, 0, { fortified: true }], ['frostling', 700], ['brute', 800]]);
  await skip(page, 240);
  await hold(page);
  await page.waitForTimeout(400);
  await shot(page, 'c-match-meadow');
  console.log('meadow');
  await page.close();
}

if (want('frostfen')) {
  const page = await open();
  await startMatch(page, { map: 'frostfen' });
  await rich(page);
  await placeAt(page, 'ranger', 200, 100, [3, 2, 0]);
  await placeAt(page, 'bombardier', 220, 250, [2, 0, 3]);
  await placeAt(page, 'frostcaller', 340, 110);
  await placeAt(page, 'longshot', 340, 250);
  await spawn(page, [
    ['pink', 120, false, 0], ['frostling', 300, false, 0], ['green', 420, false, 0, { regrow: true }], ['crystal', 700, false, 0], ['gloomship', 900, false, 0],
    ['red', 100, false, 1], ['blue', 260, false, 1, { regrow: true }], ['frostling', 450, false, 1, { fortified: true }], ['crystal', 640, false, 1, { fortified: true }],
  ]);
  await skip(page, 200);
  await hold(page);
  await page.waitForTimeout(400);
  await shot(page, 'c-match-frostfen');
  const gp = await page.evaluate(() => { const e = __dw.game.state.enemies.find((q) => q.type === 'crystal'); return [e.x / 1000, e.y / 1000]; });
  await shotZoom(page, 'c-gegner-frostfen-zoom', gp[0] + 20, gp[1] + 20, 250, 160);
  console.log('frostfen');
  await page.close();
}

if (want('quarry')) {
  const page = await open();
  await startMatch(page, { map: 'quarry' });
  await rich(page);
  await placeAt(page, 'ranger', 180, 120, [3, 2, 0]);
  await placeAt(page, 'bombardier', 430, 140, [2, 0, 3]);
  await placeAt(page, 'frostcaller', 120, 240);
  await placeAt(page, 'thornweaver', 330, 250);
  await spawn(page, [['pink', 150], ['crystal', 350, false, 0, { fortified: true }], ['green', 520, false, 0, { regrow: true }], ['brute', 700, false, 0, { fortified: true }], ['gloomship', 900], ['ember', 1000], ['frostling', 250]]);
  await skip(page, 150);
  await hold(page);
  await page.waitForTimeout(400);
  await shot(page, 'c-match-quarry');
  console.log('quarry');
  await page.close();
}

if (want('boss')) {
  // Frost Wyrm: Frosthauch friert Tuerme (Eisbloecke), danach Boss-Tod
  let page = await open();
  await startMatch(page, { map: 'frostfen' });
  await rich(page);
  const ids = [];
  ids.push(await placeAt(page, 'ranger', 175, 112, [3, 2, 0]), await placeAt(page, 'bombardier', 215, 112, [2, 0, 3]), await placeAt(page, 'frostcaller', 140, 105), await placeAt(page, 'ranger', 245, 105), await placeAt(page, 'longshot', 290, 40));
  const [wy] = await spawn(page, [['wyrm', 215, false, 0]]);
  await page.evaluate((id) => { const e = __dw.game.state.enemies.find((q) => q.id === id); e.bossCd = 2; }, wy);
  await go(page, 1);
  await page.waitForFunction(() => __dw.game.state.towers.some((t) => t.frozen > 0), null, { timeout: 15000 });
  await page.waitForTimeout(220);
  await hold(page);
  await page.waitForTimeout(250);
  await shot(page, 'c-boss-wyrm-frosthauch');
  const wp = await page.evaluate(() => { const e = __dw.game.state.enemies.find((q) => q.type === 'wyrm'); return [e.x / 1000, e.y / 1000]; });
  await shotZoom(page, 'c-boss-wyrm-frosthauch-zoom', wp[0], wp[1] + 25, 260, 170);
  console.log('wyrm breath');
  // Phase 2: unter 66 % -> spuckt Frostlinge, Sprite wechselt die Phase
  await go(page, 1);
  await page.evaluate((id) => { const e = __dw.game.state.enemies.find((q) => q.id === id); __dw.game.sandbox.hurt(id, Math.ceil(e.maxHp * 0.36), 'sharp'); }, wy);
  await page.waitForTimeout(500);
  await hold(page);
  await shotZoom(page, 'c-boss-wyrm-phase', wp[0], wp[1] + 5, 230, 150);
  // Tod
  await go(page, 1);
  await page.evaluate((id) => { __dw.game.sandbox.hurt(id, 99999, 'sharp'); }, wy);
  await page.waitForTimeout(320);
  await hold(page);
  await shot(page, 'c-boss-wyrm-tod');
  await page.close();

  // Ember Colossus: Stampfer bei der ersten Platte, Gloomship-Absturz
  page = await open();
  await startMatch(page, { map: 'quarry' });
  await rich(page);
  await placeAt(page, 'ranger', 330, 90, [3, 2, 0]);
  await placeAt(page, 'bombardier', 250, 100, [2, 0, 3]);
  await placeAt(page, 'frostcaller', 360, 150);
  const [co, g1, c1] = await spawn(page, [['colossus', 500], ['gloomship', 400], ['crystal', 560]]);
  await go(page, 1);
  await page.evaluate((id) => { const e = __dw.game.state.enemies.find((q) => q.id === id); __dw.game.sandbox.hurt(id, Math.ceil(e.maxHp * 0.22), 'sharp'); }, co);
  await page.waitForTimeout(260);
  await hold(page);
  await page.waitForTimeout(200);
  const cp = await page.evaluate(() => { const e = __dw.game.state.enemies.find((q) => q.type === 'colossus'); return [e.x / 1000, e.y / 1000]; });
  await shot(page, 'c-boss-colossus-stampfer');
  await shotZoom(page, 'c-boss-colossus-stampfer-zoom', cp[0], cp[1], 260, 170);
  console.log('colossus stomp');
  await go(page, 1);
  await page.evaluate((id) => { __dw.game.sandbox.hurt(id, 99999, 'sharp'); }, g1);
  await page.waitForTimeout(220);
  await hold(page);
  await shot(page, 'c-gloomship-absturz');
  await page.close();
}

if (want('wave')) {
  // Wellen-Vorschau mit Warnungen: Runde mit den meisten Merkmalen je Karte suchen
  for (const map of ['frostfen', 'quarry']) {
    const page = await open();
    await startMatch(page, { map });
    const r = await page.evaluate(() => {
      const g = __dw.game; let best = 1, bn = -1;
      for (let r = 1; r <= g.info.maxRound; r++) { const p = g.roundPreview(r); const n = [p.hasCamo, p.hasArmor, p.hasEmber, p.hasBoss, p.hasFrostling, p.hasBlimp, p.hasRegrow, p.hasFortified].filter(Boolean).length * 10 + p.groups.length; if (n > bn) { bn = n; best = r; } }
      g.state.round = best - 1;
      return best;
    });
    await page.click('.m-tab[data-tab="wave"]');
    await page.waitForTimeout(300);
    console.log('wave', map, 'Runde', r);
    await shot(page, `c-wellen-vorschau-${map}`);
    await page.close();
  }
}

if (want('result')) {
  const page = await open();
  await startMatch(page, { map: 'frostfen', mode: 'primary-only', diff: 'medium' });
  await page.evaluate(() => { const s = __dw.game.state; s.round = 14; s.roundsCleared = 13; __dw.match.end(true); });
  await page.waitForSelector('.result[data-done="1"]', { timeout: 20000 });
  await shot(page, 'c-ergebnis-frostfen');
  console.log('result');
  await page.close();
}

if (want('modes')) {
  // Modus-Regeln im Match: Primary Only (Specialists + ... ausgegraut), No Hero, Deflation (kein Einkommen, keine Powers)
  let page = await open();
  await startMatch(page, { map: 'frostfen', mode: 'primary-only' });
  await shot(page, 'c-modus-primary-only');
  await page.click('.m-tab[data-tab="wave"]');
  await page.waitForTimeout(200);
  await shot(page, 'c-modus-primary-only-wave');
  await page.close();
  page = await open();
  await startMatch(page, { map: 'quarry', mode: 'deflation', diff: 'medium' });
  await page.click('.m-tab[data-tab="powers"]');
  await page.waitForTimeout(200);
  await shot(page, 'c-modus-deflation');
  await page.close();
  page = await open();
  await startMatch(page, { map: 'meadow', mode: 'no-hero', diff: 'easy' });
  await shot(page, 'c-modus-no-hero');
  await page.close();
}

console.log(errorsAll.flat().length ? `Konsolenfehler: ${errorsAll.flat().join(' | ')}` : 'keine Konsolenfehler');
await browser.close();
stop();
