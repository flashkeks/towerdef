// Runde 9 / P3: Legend Stages, Raids, Raid-Shop, Evolution mit Material (1920x1080).
// Braucht dist/ (npm run build) und einen Speicherstand (SHOT_SAVE): `SAVE_OUT=/pfad/save.json SAVE_P3=1 npx vitest run test/make-save.test.ts` in meta/.
// Schreibt client/docs/r9/p3-*.png. Port: SHOT_PORT (Standard 4432). Die Ergebnis-Bildschirme kommen aus ECHTEN Spielen
// (Befehle ueber die Session, Schnellvorlauf per advance), ihre Belohnung wird aus dem nachgerechneten Replay gebucht.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4432);
const SAVE = process.env.SHOT_SAVE;
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r9');
mkdirSync(OUT, { recursive: true });
if (!SAVE) throw new Error('SHOT_SAVE fehlt (Speicherstand mit SAVE_P3=1)');
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p3-${name}.png`) });

/**
 * Im Browser ehrlich spielen (wie der Bot `mono-<unit>` der Sim): Units ueber die Session setzen und hochruesten (nur Befehle, die ein Mensch
 * auch geben kann), Wellen rufen, im Takt der Session vorspulen. Gibt das Ergebnis zurueck; die Belohnung bucht danach der Ergebnis-Bildschirm.
 */
const playOut = (page, unit, { maxSeconds = 1500 } = {}) =>
  page.evaluate(
    ({ unit, maxSeconds }) => {
      const s = window.__duskwardens.session();
      const sim = s.sim;
      const st = sim.state;
      const def = (id) => sim.catalog().find((d) => d.id === id);
      const score = (lv) => (lv.attack ? Math.floor(((lv.damageCenti * 20) / lv.spaTicks) * (lv.attack.kind === 'single' ? 1 : 2)) : 0);
      const d0 = def(unit);
      const bestSpot = () => {
        let best = null;
        let bc = -1;
        for (const p of sim.placementGrid(unit)) {
          if (sim.canPlace(0, unit, p.x, p.y) === 'overlap') continue;
          const c = sim.coverage(p.x, p.y, d0.levels[0].rangeMilli);
          if (c > bc) { bc = c; best = p; }
        }
        return best;
      };
      let guard = 0;
      while (!s.over && guard++ < 400000) {
        if (st.tick % 20 === 0) {
          for (let k = 0; k < 30; k++) {
            const coins = st.players[0].coins;
            const opts = [];
            const pc = sim.placeCost(0, unit);
            opts.push({ ratio: score(d0.levels[0]) / pc, cost: pc, run: () => { const sp = bestSpot(); if (!sp) return false; s.choosePlacing(unit); const n = st.units.length; s.clickBoard(sp.x, sp.y); s.choosePlacing(null); return st.units.length > n; } });
            for (const u of st.units) {
              const c = sim.upgradeCost(u.id);
              if (c === null || c === undefined) continue;
              const d = def(u.defId);
              opts.push({ ratio: (score(d.levels[u.level + 1]) - score(d.levels[u.level])) / c, cost: c, run: () => { s.selectedUnit = u.id; s.upgrade(); return true; } });
            }
            const best = opts.reduce((x, y) => (y.ratio > x.ratio ? y : x));
            if (coins < best.cost || !best.run()) break;
          }
          if (st.phase === 'prep' || st.enemies.length === 0) s.startNextWave();
        }
        s.advance(50);
        if (st.tick > maxSeconds * 20) break;
      }
      return { result: st.result, wave: st.wave, lives: st.lives, units: st.units.length, tick: st.tick };
    },
    { unit, maxSeconds },
  );

try {
  const page = await (await browser.newContext({ viewport: { width: Number(process.env.SHOT_W ?? 1920), height: Number(process.env.SHOT_H ?? 1080) } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('.lobby');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  await page.locator('.lobby-settings').click();
  await page.waitForSelector('.save-import');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator('.save-import').click()]);
  await fc.setFiles(SAVE);
  await page.locator('.confirm-yes').click();
  await page.waitForSelector('.flash.good');
  await page.reload();
  await page.waitForSelector('.lobby');
  if (await page.locator('.starter-claim').isVisible().catch(() => false)) {
    await page.locator('.starter-claim').click();
    await page.waitForSelector('.starter-card.done');
  }
  await sleep(400);
  await shot(page, 'lobby');

  const worldMap = async (mode, card) => {
    await page.locator('.lobby-play').click();
    await page.waitForSelector('.act-card');
    if (mode) await page.locator(`.mode-btn[data-mode="${mode}"]`).click();
    if (card) await page.locator(`.world-tab[data-world="${card}"]`).click();
    await sleep(600);
  };
  const toLobby = async () => {
    await page.goto(url);
    await page.waitForSelector('.lobby:not(.loading)');
  };

  // Weltkarte: Story, Legend Stages, Raids
  await worldMap('worlds', 'greenie');
  await shot(page, 'worldmap-story');
  await page.locator('.mode-btn[data-mode="legend"]').click();
  await page.locator('.world-tab[data-world="spirit-invasion"]').click();
  await sleep(500);
  await shot(page, 'worldmap-legend');
  await page.locator('.world-tab[data-world="space-center"]').click();
  await sleep(500);
  await shot(page, 'worldmap-legend-space-center');
  await page.locator('.mode-btn[data-mode="raids"]').click();
  await page.locator('.world-tab[data-world="ant-kingdom-midnight"]').click();
  await sleep(500);
  await shot(page, 'worldmap-raids');
  await page.locator('.world-tab[data-world="sacred-planet"]').click();
  await sleep(500);
  await shot(page, 'worldmap-raids-sacred-planet');

  // Stufenwahl eines Raids
  await page.locator('.world-tab[data-world="sand-village-midnight-attack"]').click();
  await sleep(400);
  await page.locator('.act-card[data-stage="raid-sand-village-midnight-attack"]').click();
  await page.waitForSelector('.stage-card');
  await sleep(400);
  await shot(page, 'stage-raid');

  // Raid-Match (Sand Village, Deidara): Team setzen, bis kurz vor den Boss vorspulen
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  const units = await page.evaluate(() => window.__duskwardens.session().team ?? []);
  await buildTeam(page, { units: [units[0], units[0], units[0], units[0], units[0], units[0]], level: 3 });
  await fastForward(page, 19);
  await page.evaluate(() => window.__duskwardens.session().setSpeed(1));
  await sleep(1800);
  await shot(page, 'raid-match');
  console.log('raid-match', await page.evaluate(() => ({ stage: window.__duskwardens.session().stageId, waves: window.__duskwardens.session().totalWaves, wave: window.__duskwardens.session().sim.state.wave })));

  // Legend-Match (Spirit Invasion Act 2, Resistenzen im Kopf der Stufenwahl)
  await toLobby();
  await worldMap('legend', 'spirit-invasion');
  await page.locator('.act-card[data-stage="legend-spirit-invasion-2"]').click();
  await page.waitForSelector('.stage-card');
  await sleep(400);
  await shot(page, 'stage-legend');
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await buildTeam(page, { units: [units[0], units[0], units[0], units[0]], level: 3 });
  await fastForward(page, 12);
  await page.evaluate(() => window.__duskwardens.session().setSpeed(1));
  await sleep(1500);
  await shot(page, 'legend-match');

  // Echte Siege: Legend Stage (Material) und Raid (Raid-Marken, Meilenstein) mit Ergebnis-Bildschirm
  const real = async (modeBtn, tab, stage, name) => {
    await toLobby();
    await worldMap(modeBtn, tab);
    await page.locator(`.act-card[data-stage="${stage}"]`).click();
    await page.waitForSelector('.stage-card');
    await page.locator('.stage-card[data-difficulty="normal"]').click();
    await page.waitForSelector('canvas.board');
    const r = await playOut(page, 'goku_ssj3');
    console.log(name, r);
    await page.waitForSelector('.dialog.end', { timeout: 15000 });
    await page.waitForSelector('.reward-box[data-state="ok"], .reward-box[data-state="error"]', { timeout: 40000 });
    await sleep(1800);
    console.log(name, 'Belohnung', await page.evaluate(() => [...document.querySelectorAll('.reward-line')].map((e) => e.textContent)));
    await shot(page, name);
  };
  await real('legend', 'space-center', 'legend-space-center-3', 'result-legend');
  await real('raids', 'sand-village-midnight-attack', 'raid-sand-village-midnight-attack', 'result-raid');

  // Raid-Shop
  await toLobby();
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  await page.locator('.mode-shop').click();
  await page.waitForSelector('.rs-card');
  await sleep(500);
  await shot(page, 'raidshop');
  await page.locator('.rs-card[data-offer="mat-crystallite"] .rs-buy').click();
  await page.waitForSelector('.flash.good');
  await sleep(800);
  await shot(page, 'raidshop-bought');

  // Evolution mit Material (Goku SSJ3 braucht 15 Crystallite)
  await toLobby();
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile');
  await page.locator('.unit-tile[data-unit="goku_ssj3"]').click();
  await page.waitForSelector('.ud-evo');
  await sleep(700);
  await shot(page, 'evolution');
  console.log('evolution', await page.evaluate(() => document.querySelector('.ud-evo')?.innerText.replace(/\n+/g, ' | ')));
  if (errors.length) console.log('Seitenfehler:', errors.slice(0, 3));
} finally {
  await browser.close();
  stop();
}
