// Runde 8 / P1: Screenshots eines Matches mit AA-Units aus sim/data/units/sample.json (Baukasten: Formen und Effekte sichtbar).
// Braucht dist/ (npm run build). Schreibt client/docs/r8/p1-match-*.png. Port: SHOT_PORT (Standard 4430).
// Aufbau ueber die Session-Schnittstelle wie shots-p5.mjs (Units setzen, ohne Zeichnen vorspulen), danach laeuft die Seite im normalen Takt.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, openRun, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4430);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r8');
mkdirSync(OUT, { recursive: true });
// Kreis + Blutung, Linie, Kegel, voller Radius + Wither, Slow-Linie, Knockback + Treffer-Kreis, Timestop, Wild Card
const TEAM = ['stain', 'monet', 'shigaraki_evolved', 'emilia', 'tatsumaki_evolved', 'goku_ssj3'];
const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await openRun(page, url);
  const placed = await buildTeam(page, { units: [...TEAM, 'goku_ssj3', 'monet'], level: 3 });
  console.log('Units gesetzt', placed);
  await fastForward(page, 7);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.apply(0, { type: 'skipWave' });
    s.setSpeed(1);
  });
  let shots = 0;
  for (let i = 0; i < 400 && shots < 3; i++) {
    await sleep(100);
    const a = await page.evaluate(() => {
      const r = window.__duskwardens.renderer().fx.active;
      const st = window.__duskwardens.session().sim.state;
      const dots = st.enemies.filter((e) => e.dots.length > 0 || e.slowTicks > 0 || e.stunTicks > 0 || e.physTakenBp > 0 || e.magicTakenBp > 0 || e.backTicks > 0).length;
      return { ...r, dots, enemies: st.enemies.length };
    });
    if (i % 20 === 0) console.log(JSON.stringify(a));
    if (a.effects >= 3 && a.particles >= 6 && a.dots >= 2) {
      // Effekte leben nur Sekundenbruchteile: den Effekt-Takt anhalten, das Bild steht
      await page.evaluate(() => {
        const r = window.__duskwardens.renderer();
        window.__fxUpdate = r.fx.update;
        r.fx.update = () => undefined;
      });
      await sleep(60);
      await page.screenshot({ path: resolve(OUT, `p1-match-combat${shots ? '-' + shots : ''}.png`) });
      await page.evaluate(() => {
        window.__duskwardens.renderer().fx.update = window.__fxUpdate;
      });
      shots++;
      await sleep(900);
    }
  }
  console.log('Kampfaufnahmen', shots);
  // Unit-Panel: eine Unit mit Angriffswechsel und Effekt anwaehlen (Werte je Stufe, Form, Effekte)
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.setSpeed(1);
    const u = s.sim.state.units.find((x) => x.defId === 'shigaraki_evolved') ?? s.sim.state.units[0];
    s.selectedUnit = u.id;
  });
  await sleep(300);
  await page.screenshot({ path: resolve(OUT, 'p1-match-unitpanel.png') });
  await page.locator('.unitpanel').first().screenshot({ path: resolve(OUT, 'p1-match-unitpanel-detail.png') }).catch(() => {});
  const info = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    return s.sim.state.units.map((u) => u.defId + ':' + u.level).join(', ');
  });
  console.log('Units im Match:', info);
} finally {
  await browser.close();
  stop();
}
