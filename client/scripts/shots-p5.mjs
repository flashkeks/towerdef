// P5-Screenshots: Effekte im Kampf (Treffer, Schadenszahlen, Tod) und Boss mit Telegraph / offenem Fenster.
// Braucht dist/ (npm run build). Schreibt client/docs/screenshot-p5-combat.png, -boss-telegraph.png, -boss-window.png.
// Aufbau ueber die Session-Schnittstelle (Units setzen, ohne Zeichnen vorspulen), danach laeuft die Seite im normalen Takt.
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, openRun, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs');
const TEAM = ['striker', 'gunner', 'blaster', 'lancer', 'frost', 'titan', 'blaster', 'gunner'];
const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await openRun(page, url);
  await buildTeam(page, { units: TEAM, level: 1 });
  await fastForward(page, 7);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.apply(0, { type: 'skipWave' });
    s.setSpeed(1);
  });
  // Kampf: Aufnahmen, wenn Effekte, Splitter und Zahlen im Bild sind
  let best = 0;
  for (let i = 0; i < 300 && best < 3; i++) {
    await sleep(120);
    const a = await page.evaluate(() => window.__duskwardens.renderer().fx.active);
    if (a.effects >= 5 && a.particles >= 12 && a.numbers >= 3) {
      // Effekte leben nur 0,1-0,4 s, ein Screenshot braucht laenger: Effekt-Takt anhalten, Bild steht
      await page.evaluate(() => {
        const r = window.__duskwardens.renderer();
        window.__fxUpdate = r.fx.update;
        r.fx.update = () => undefined;
      });
      await sleep(60);
      await page.screenshot({ path: resolve(OUT, `screenshot-p5-combat${best ? '-' + best : ''}.png`) });
      await page.evaluate(() => {
        window.__duskwardens.renderer().fx.update = window.__fxUpdate;
      });
      best++;
      await sleep(600);
    }
  }
  console.log('combat shots', best);

  // Boss: Welle 10 (Warden). Vorspulen bis kurz vor den Boss, dann in Echtzeit bis zum ersten Telegraph.
  await fastForward(page, 9);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.enemies.length = 0;
    s.sim.apply(0, { type: 'skipWave' });
    s.setSpeed(1);
  });
  let gotTele = false;
  let gotWin = false;
  for (let i = 0; i < 400 && !(gotTele && gotWin); i++) {
    await sleep(120);
    const st = await page.evaluate(() => {
      const s = window.__duskwardens.session();
      const b = s.sim.state.enemies.find((e) => e.boss);
      if (!b) return null;
      const tl = s.tracker.telegraphs.get(b.id);
      return { tele: !!tl, left: tl ? tl.fireTick - s.sim.state.tick : 0, win: s.tracker.windows.has(b.id), hp: b.hp / b.maxHp };
    });
    if (!st) continue;
    if (st.tele && st.left < 28 && !gotTele) {
      await page.screenshot({ path: resolve(OUT, 'screenshot-p5-boss-telegraph.png') });
      gotTele = true;
    }
    if (st.win && !gotWin) {
      await sleep(250);
      await page.screenshot({ path: resolve(OUT, 'screenshot-p5-boss-window.png') });
      gotWin = true;
    }
  }
  console.log('boss shots', { gotTele, gotWin });
} finally {
  await browser.close();
  stop();
}
