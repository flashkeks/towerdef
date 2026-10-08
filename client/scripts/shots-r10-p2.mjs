// Runde 10 / P2: Screenshots des Matches: viele Units (Nahkampf, Fernkampf, Flaeche), Angriffe je Element, Faehigkeits-Ansage, Boss, Platzier-Vorschau.
// Braucht dist/ (npm run build). Schreibt client/docs/r10/p2-*.png. Port: SHOT_PORT (Standard 4492). Aufloesung: SHOT_W x SHOT_H (Standard 1600 x 900).
// Das Profil wird nach dem Starter-Geschenk im localStorage mit den Test-Units und einem Team aufgestockt (nur Testaufbau, wie shots-r9-p1).
// Bilder: lokal gibt es keine Porträts (/aa/index.json fehlt), also zeigen die Screenshots die gestalteten Ersatzfiguren. Mit SHOT_PORTRAITS=1 werden
// fuer die Team-Units Stand-in-Bilder (erzeugte SVG-Gesichter) ueber /aa/units/<id>.webp eingespielt, nur um den Bildpfad im Match zu zeigen.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4492);
const W = Number(process.env.SHOT_W ?? 1600);
const H = Number(process.env.SHOT_H ?? 900);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r10');
mkdirSync(OUT, { recursive: true });
const TEAMS = {
  mix: ['sanji', 'honey', 'kakashi', 'tatsumaki', 'ulquiorra_evolved', 'tanjiro'],
  magic: ['nezuko', 'law', 'jotaro', 'dazai_evolved', 'goku_black', 'zoro'],
};
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p2-${name}.png`) });

async function setup(team) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(600);
  await page.evaluate(({ team }) => {
    let best = null;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) {
      const o = JSON.parse(localStorage.getItem(k));
      if (!best || o.rev > best.rev) best = o;
    }
    const p = best.profile;
    for (const id of team) p.units[id] = { level: 5, xp: 0, copies: 2, stars: 1, firstObtainedAt: '2026-10-08T00:00:00.000Z' };
    p.team = team;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) localStorage.setItem(k, JSON.stringify({ app: 'dw-meta', rev: best.rev + 5, profile: p }));
  }, { team });
  await page.evaluate(() => indexedDB.deleteDatabase('dw-meta'));
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card, .diff');
  if (await page.locator('.act-card').first().isVisible().catch(() => false)) await page.locator('.act-card').first().click();
  await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
  await page.locator('.diff[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  return page;
}

/** Vorspulen ohne Zeichnen, bis ein Gegner-Typ auf dem Feld steht (oder Welle erreicht). */
const spoolTo = (page, pred) =>
  page.evaluate((predSrc) => {
    const pred = new Function('st', `return (${predSrc})(st)`);
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    st.godMode = true;
    let guard = 0;
    while (guard++ < 200000 && !s.over && !pred(st)) {
      if (st.phase === 'prep' || st.enemies.length === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
      s.sim.drainEvents();
    }
    return { wave: st.wave, enemies: st.enemies.length, guard };
  }, pred.toString());

try {
  // ---- Lauf 1: Mix aus Nahkampf, Fernkampf, Flaeche --------------------------------------------------------------
  let page = await setup(TEAMS.mix);
  console.log('Units', await buildTeam(page, { units: [...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix], level: 3 }));
  console.log(await spoolTo(page, (st) => st.wave >= 6 && st.enemies.length >= 14));
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.godMode = true;
    s.setSpeed(1);
  });
  await sleep(900);
  await shot(page, 'match-mix-1');
  await sleep(700);
  await shot(page, 'match-mix-2');
  await sleep(500);
  await shot(page, 'match-mix-3');
  console.log('fx', await page.evaluate(() => window.__duskwardens.renderer().fx.active));

  // Platzier-Vorschau: Unit waehlen, Maus aufs Feld
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.setSpeed(1);
  });
  await page.locator('.shop [data-unit], .shop .unit, .shop button').first().click().catch(() => {});
  const box = await page.locator('canvas.board').boundingBox();
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.3);
  await sleep(300);
  await shot(page, 'placing-ghost');
  await page.keyboard.press('Escape');

  // ---- Boss ------------------------------------------------------------------------------------------------------
  console.log(await spoolTo(page, (st) => st.enemies.some((e) => e.boss)));
  await sleep(600);
  await shot(page, 'boss-entrance');
  await sleep(1200);
  await shot(page, 'boss-fight');
  await page.context().close();

  // ---- Lauf 2: Fähigkeits-Ansage -----------------------------------------------------------------------------------
  page = await setup(TEAMS.magic);
  console.log('Units', await buildTeam(page, { units: [...TEAMS.magic, ...TEAMS.magic, ...TEAMS.magic, ...TEAMS.magic], level: 7 }));
  console.log(await spoolTo(page, (st) => st.wave >= 4 && st.enemies.length >= 8));
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.godMode = true;
    s.setSpeed(1);
  });
  await sleep(400);
  await shot(page, 'match-magic');
  const fired = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    for (const id of ['zoro', 'goku_black', 'dazai_evolved', 'law', 'jotaro', 'nezuko']) {
      const r = s.useAbilityType(id);
      if (r) return { id, r };
    }
    return null;
  });
  console.log('Faehigkeit', fired);
  await sleep(380);
  await shot(page, 'ability-cutin');
  await sleep(350);
  await shot(page, 'ability-cutin-2');
  await sleep(900);
  await shot(page, 'ability-after');
  console.log('fx', await page.evaluate(() => window.__duskwardens.renderer().fx.active));
} finally {
  await browser.close();
  stop();
}
