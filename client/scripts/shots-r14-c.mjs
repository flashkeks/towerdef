// Bilder Runde 14 C (Einbau Thornweaver/Alchemist, Wissensbaum): npm run build && node scripts/shots-r14-c.mjs [teil ...]
// ?debug schaltet alles frei und haelt das Profil nur im Speicher; ?level=N setzt das Spieler-Level. -> docs/r14/c-*.png
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r14');
mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);
const want = (k) => only.length === 0 || only.includes(k);
const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4173));
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
const rich = (page) => page.evaluate(() => { __dw.game.sandbox.setCash(300000); __dw.game.state.lives = 100000; });
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const WAVE = Array.from({ length: 44 }, (_, i) => ['red', 'blue', 'ironshell', 'green', 'brute', 'red', 'ironshell', 'blue'][i % 8]);
/** Ausschnitt der Karte (Kartenpixel), danach 3x ohne Glaettung vergroessert (Python/PIL, fehlt es: Originalgroesse). */
async function shotZoom(page, name, mx, my, mw = 230, mh = 150) {
  const rc = await rectOf(page);
  const k = rc.w / 640;
  const x = Math.max(rc.x, rc.x + (mx - mw / 2) * k), y = Math.max(rc.y, rc.y + (my - mh / 2) * k);
  const file = `${out}/${name}.png`;
  await page.screenshot({ path: file, clip: { x, y, width: Math.min(mw * k, rc.x + rc.w - x), height: Math.min(mh * k, rc.y + rc.h - y) } });
  try { execFileSync('python3', ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.resize((im.width*3,im.height*3),Image.NEAREST).save(sys.argv[1])', file]); } catch { /* ohne PIL */ }
}
const info = (...a) => console.log(...a);

/** Haelt das Match an, sobald `src` (Ausdruck in ev, st) beim Sim-Ereignis wahr wird: Bild und Effekte stehen dann still. */
async function freezeOn(page, src, timeout = 40000) {
  await page.evaluate((code) => {
    const r = __dw.r;
    if (!r.__wrapped) {
      const o = r.handle.bind(r);
      r.handle = (ev) => { o(ev); if (window.__trig && window.__trig(ev, __dw.game.state)) { __dw.match.speed = 0; window.__trig = null; window.__frz = true; } };
      r.__wrapped = true;
    }
    window.__frz = false;
    window.__trig = new Function('ev', 'st', `return (${code});`);
  }, src);
  await page.waitForFunction(() => window.__frz === true, null, { timeout });
  await page.waitForTimeout(80);
}
const resume = (page) => page.evaluate(() => { window.__frz = false; __dw.match.setSpeed(1); });
const spawnMix = (page, types, start, step) => page.evaluate(([ts, a, b]) => { const g = __dw.game; ts.forEach((t, i) => g.sandbox.spawn(t, a + i * b)); }, [types, start, step]);
const ability = (page, id) => page.evaluate((a) => { for (const x of __dw.game.state.abilities) { x.ready = true; x.cdLeft = 0; } return __dw.game.apply({ type: 'ability', ability: a }); }, id);


try {
  const ctx = await browser.newContext({ viewport: VIEW });

  // 1) Turm-Leiste (sieben Tuerme + Wren, 1280 x 720, ohne Scrollen)
  if (want('leiste')) {
    const page = await open(ctx);
    await startMatch(page);
    const m = await page.evaluate(() => { const s = document.querySelector('.m-panes'); const cs = [...document.querySelectorAll('.m-card')]; return { scroll: s.scrollHeight - s.clientHeight, cards: cs.length, lastBottom: Math.max(...cs.map((c) => c.getBoundingClientRect().bottom)), paneBottom: s.getBoundingClientRect().bottom }; });
    info('leiste', JSON.stringify(m));
    if (m.scroll > 0 || m.lastBottom > m.paneBottom + 1) { console.error('Turm-Leiste scrollt'); code = 1; }
    await shot(page, 'c-turmleiste');
    await page.close();
    // gesperrt: Level 3 zeigt "Unlocks at level 7/9"
    const p2 = await open(ctx, '?hooks&level=3&seed=7');
    await startMatch(p2);
    await shot(p2, 'c-turmleiste-gesperrt');
    await p2.close();
  }

  // 2) Wissensbaum
  if (want('baum')) {
    const page = await open(ctx, '?debug&level=40&seed=7');
    await page.click('.navbtn:nth-child(2)');
    await page.waitForSelector('.knode');
    // ein paar Knoten lernen (verfuegbare der Reihe nach), danach oben beginnen
    for (let i = 0; i < 14; i++) {
      const n = page.locator('.knode.available').nth(i % 3);
      if (!(await n.count())) break;
      await n.click();
      await page.waitForSelector('.knode');
      await page.waitForTimeout(60);
    }
    const geo = await page.evaluate(() => { const sc = document.querySelector('.dw-screens'); return { sw: sc.scrollWidth, cw: sc.clientWidth, sh: sc.scrollHeight, ch: sc.clientHeight, nodes: document.querySelectorAll('.knode').length }; });
    info('baum', JSON.stringify(geo));
    if (geo.sw > geo.cw) { console.error('Wissensbaum scrollt waagerecht'); code = 1; }
    await page.evaluate(() => { document.querySelector('.dw-screens').scrollTop = 0; });
    await page.waitForTimeout(150);
    await shot(page, 'c-wissensbaum');
    await page.hover('.knode.available');
    await page.waitForTimeout(150);
    await shot(page, 'c-wissensbaum-tooltip');
    await page.evaluate(() => { document.querySelector('.dw-screens').scrollTop = 99999; });
    await page.waitForTimeout(150);
    await shot(page, 'c-wissensbaum-unten');
    await page.close();
  }

  // 3) Thornweaver im Kampf: Blitz, Ranken, Baumwand, Zone
  if (want('thornweaver')) {
    const page = await open(ctx);
    await startMatch(page);
    await rich(page);
    const w = await placeAt(page, 'thornweaver', 200, 228, [2, 4, 0]);
    const s2 = await placeAt(page, 'thornweaver', 72, 190, [4, 2, 0]);
    const s3 = await placeAt(page, 'thornweaver', 232, 300, [0, 0, 5]);
    info('thornweaver', w, s2, s3);
    await spawnMix(page, WAVE, 100000, 9000);
    await page.waitForTimeout(1200);
    info('wall', JSON.stringify(await ability(page, 'wallOfTrees')));
    await freezeOn(page, "ev.type === 'chain' && st.walls.length > 0");
    await shot(page, 'c-thornweaver');
    await shotZoom(page, 'c-thornweaver-zoom', 190, 250);
    await resume(page);
    await freezeOn(page, "ev.type === 'vine'");
    await shot(page, 'c-thornweaver-vine');
    info('state', JSON.stringify(await page.evaluate(() => ({ walls: __dw.game.state.walls.length, vines: __dw.game.state.enemies.filter((e) => e.vineTicks > 0).length, zones: __dw.game.state.towers.filter((t) => t.zone > 0).length }))));
    await resume(page);
    await clickTower(page, w);
    await page.waitForTimeout(400);
    await shot(page, 'c-thornweaver-panel');
    await page.close();
  }

  // 4) Alchemist: Trank im Bogen, Pfuetze, Saeure, Buff-Glanz
  if (want('alchemist')) {
    const page = await open(ctx);
    await startMatch(page);
    await rich(page);
    const al = await placeAt(page, 'alchemist', 200, 228, [3, 0, 2]);
    const rg = await placeAt(page, 'ranger', 160, 205, [2, 0, 0]);
    const bm = await placeAt(page, 'bombardier', 240, 205, [1, 0, 0]);
    const fr = await placeAt(page, 'frostcaller', 176, 296, [0, 1, 0]);
    info('alchemist', al, rg, bm, fr);
    await spawnMix(page, WAVE, 120000, 9000);
    await freezeOn(page, "ev.type === 'explode' && ev.kind === 'acid' && st.puddles.length > 0 && st.towers.some((t) => t.buffTicks > 0)", 60000);
    await shot(page, 'c-alchemist');
    await shotZoom(page, 'c-alchemist-zoom', 200, 250);
    info('state', JSON.stringify(await page.evaluate(() => ({ puddles: __dw.game.state.puddles.length, buffed: __dw.game.state.towers.filter((t) => t.buffTicks > 0).length, projs: __dw.game.state.projectiles.filter((p) => p.kind === 'potion').length }))));
    await resume(page);
    await clickTower(page, rg);
    await page.waitForTimeout(500);
    await shot(page, 'c-alchemist-panel');
    await page.close();
  }

  // 5) Monster-Verwandlung (Transforming Tonic, Total Transformation)
  if (want('monster')) {
    const page = await open(ctx);
    await startMatch(page);
    await rich(page);
    const al = await placeAt(page, 'alchemist', 200, 228, [0, 5, 0]);
    for (const [x, y] of [[160, 205], [240, 205], [176, 296], [236, 296], [150, 240]]) await placeAt(page, 'ranger', x, y, [1, 0, 0]);
    await spawnMix(page, WAVE, 140000, 9000);
    await page.waitForTimeout(1200);
    info('tonic', JSON.stringify(await ability(page, 'tonic')));
    await page.waitForTimeout(650);
    await page.evaluate(() => { __dw.match.speed = 0; });
    await page.waitForTimeout(100);
    await shot(page, 'c-monster');
    await shotZoom(page, 'c-monster-zoom', 200, 250);
    info('monsters', await page.evaluate(() => __dw.game.state.towers.filter((t) => t.monsterTicks > 0).length));
    await resume(page);
    await page.waitForTimeout(1500);
    await clickTower(page, al);
    await page.waitForTimeout(300);
    await shot(page, 'c-monster-panel');
    await page.close();
  }

  // 6) Gold: Lead to Gold, Rubber to Gold, Shrink
  if (want('gold')) {
    const page = await open(ctx);
    await startMatch(page);
    await rich(page);
    await placeAt(page, 'alchemist', 200, 228, [2, 0, 5]);
    await placeAt(page, 'alchemist', 80, 190, [0, 2, 4]);
    await spawnMix(page, WAVE.map((t, i) => (i % 2 ? 'ironshell' : t)), 120000, 9000);
    await page.waitForTimeout(3500);
    await freezeOn(page, "ev.type === 'shrink' || ev.type === 'bounty'", 60000);
    await shotZoom(page, 'c-gold-zoom', 150, 230);
    await shot(page, 'c-gold');
    await resume(page);
    await page.close();
  }

  // 7) alle sieben Tuerme + Wren im Match
  if (want('match')) {
    const page = await open(ctx);
    await startMatch(page);
    await rich(page);
    await placeAt(page, 'ranger', 80, 150, [2, 0, 2]);
    await placeAt(page, 'bombardier', 170, 150, [1, 0, 1]);
    await placeAt(page, 'frostcaller', 60, 230, [0, 1, 0]);
    await placeAt(page, 'longshot', 205, 140, [2, 0, 0]);
    await placeAt(page, 'market', 190, 205, [0, 2, 0]);
    await placeAt(page, 'thornweaver', 215, 300, [2, 3, 0]);
    await placeAt(page, 'alchemist', 300, 240, [3, 0, 1]);
    await placeAt(page, 'wren', 300, 160);
    await spawnMix(page, WAVE.slice(0, 30), 200000, 12000);
    await page.waitForTimeout(3500);
    await page.evaluate(() => { __dw.match.speed = 0; });
    await page.waitForTimeout(100);
    await shot(page, 'c-match');
    await page.close();
  }
  stop();
} catch (e) {
  console.error(e);
  code = 1;
}
const errs = errorsAll.flat();
if (errs.length) { console.error('Konsolenfehler:', errs.slice(0, 8)); code = 1; }
await browser.close();
process.exit(code);
