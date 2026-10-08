// Runde 10 / P2: Screenshots des Matches: viele Units (Nahkampf, Fernkampf, Flaeche), Angriffe je Element, Faehigkeits-Ansage, Boss, Platzier-Vorschau.
// Braucht dist/ (npm run build). Schreibt client/docs/r10/p2-*.png. Port: SHOT_PORT (Standard 4492). Aufloesung: SHOT_W x SHOT_H (Standard 1920 x 1080).
// Das Profil wird nach dem Starter-Geschenk im localStorage mit den Test-Units und einem Team aufgestockt (nur Testaufbau, wie shots-r9-p1).
// Bilder: lokal gibt es keine Porträts (/aa/index.json fehlt), also zeigen die Screenshots die gestalteten Ersatzfiguren. Mit SHOT_PORTRAITS=1 werden
// fuer die Team-Units Stand-in-Bilder (erzeugte SVG-Gesichter) ueber /aa/units/<id>.webp eingespielt, nur um den Bildpfad im Match zu zeigen.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, launch, root, sleep, startServer } from './lib/drive.mjs';
import { setupRun } from './lib/profile.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4492);
const W = Number(process.env.SHOT_W ?? 1920);
const H = Number(process.env.SHOT_H ?? 1080);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r10');
mkdirSync(OUT, { recursive: true });
const TEAMS = {
  mix: ['sanji', 'honey', 'kakashi', 'tatsumaki', 'ulquiorra_evolved', 'tanjiro'],
  magic: ['nezuko', 'law', 'jotaro', 'dazai_evolved', 'goku_black', 'zoro'],
};
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p2-${name}.png`) });

/** Mehrere Aufnahmen kurz nacheinander, die zwei mit den meisten laufenden Effekten bleiben (Angriffe mitten im Flug). */
async function bestOf(page, name, n, gap) {
  const got = [];
  for (let i = 0; i < n; i++) {
    const a = await page.evaluate(() => window.__duskwardens.renderer().fx.active);
    const buf = await page.screenshot();
    got.push({ score: a.effects * 3 + a.particles, buf });
    await sleep(gap);
  }
  got.sort((x, y) => y.score - x.score);
  const { writeFileSync } = await import('node:fs');
  got.slice(0, 2).forEach((g, i) => writeFileSync(resolve(OUT, `p2-${name}-${i + 1}.png`), g.buf));
}

const setup = (team) => setupRun(browser, url, team, { width: W, height: H });

/** Vorspulen ohne Zeichnen, bis ein Gegner-Typ auf dem Feld steht (oder Welle erreicht). */
const spoolTo = (page, pred) =>
  page.evaluate((predSrc) => {
    const pred = new Function('st', `return (${predSrc})(st)`);
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    st.godMode = true;
    let guard = 0;
    while (guard++ < 200000 && !s.over && !pred(st)) {
      if ((st.phase === 'prep' || st.enemies.length === 0) && st.wave < 14) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
      s.sim.drainEvents();
    }
    return { wave: st.wave, enemies: st.enemies.length, guard };
  }, pred.toString());

try {
  // ---- Lauf 1: Mix aus Nahkampf, Fernkampf, Flaeche --------------------------------------------------------------
  let page = await setup(TEAMS.mix);
  console.log('Units', await buildTeam(page, { units: [...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix], level: 1 }));
  console.log(await spoolTo(page, (st) => st.wave >= 7 && st.enemies.length >= 12));
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
  await bestOf(page, 'attacks-mix', 10, 140);

  // Platzier-Vorschau: Unit waehlen, Maus auf eine freie, gueltige Stelle (gruen) und auf den Pfad (rot)
  const spots = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    const id = 'sanji';
    s.sim.state.godMode = true;
    const T = window.__duskwardens.renderer().tile;
    const sp = [...s.sim.placementGrid(id)].filter((q) => !s.sim.state.units.some((u) => Math.hypot(u.x - q.x, u.y - q.y) < 1300));
    // Stelle nahe der Kartenmitte, damit der Reichweitenkreis ganz im Bild liegt
    const cx = (window.__duskwardens.renderer().ctx.cols / 2) * 1000;
    const cy = (window.__duskwardens.renderer().ctx.rows * 0.42) * 1000;
    sp.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
    const q = sp[0];
    return q ? { x: (q.x / 1000 + 0.5) * T, y: (q.y / 1000 + 0.5) * T } : null;
  });
  const box = await page.locator('canvas.board').boundingBox();
  await page.keyboard.press('1');
  if (spots) await page.mouse.move(box.x + spots.x, box.y + spots.y);
  await sleep(350);
  await shot(page, 'placing-ghost');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.12);
  await sleep(250);
  await shot(page, 'placing-ghost-red');
  if (spots) {
    // Setzen: Aufsetz-Effekt (Hopser, Staubring) gleich nach dem Klick
    await page.mouse.move(box.x + spots.x, box.y + spots.y);
    await sleep(120);
    await page.mouse.click(box.x + spots.x, box.y + spots.y);
    await sleep(210);
    await shot(page, 'place-drop');
    await sleep(160);
    await shot(page, 'place-landed');
  }
  await page.keyboard.press('Escape');

  // ---- Boss ------------------------------------------------------------------------------------------------------
  console.log(await spoolTo(page, (st) => st.enemies.some((e) => e.boss)));
  await sleep(500);
  await shot(page, 'boss-entrance');
  // Boss ein Stueck laufen lassen (ohne Zeichnen), dann in voller Groesse auf dem Pfad
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    for (let i = 0; i < 330 && !s.over; i++) {
      s.sim.step(1);
      s.sim.drainEvents();
    }
  });
  await sleep(700);
  await shot(page, 'boss-fight');
  await sleep(500);
  await shot(page, 'boss-fight-2');
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
