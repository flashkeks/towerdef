// Runde 6, P4: Screenshots der Lesbarkeits-Hinweise (Flieger-Warnung in der Vorschau, Shop-Symbole mit Aufschlag, Niederlage-Tipps).
// Braucht dist/ (npm run build). Schreibt client/docs/screenshot-r6-p4-{preview,shop,defeat}.png. Aufbau ueber die Session-Schnittstelle.
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, openRun, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs');
const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await openRun(page, url);
  // nur Boden-Units: keine Luftabwehr. Sieben Striker -> Aufschlag ab dem 6. Exemplar sichtbar im Shop
  const placed = await buildTeam(page, { units: Array(7).fill('striker') });
  console.log('striker placed', placed);
  const firstFlyer = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    for (let n = 1; n <= s.totalWaves; n++) if (s.sim.previewWave(n)?.groups.some((g) => g.flying)) return n;
    return null;
  });
  console.log('first flyer wave', firstFlyer);
  await fastForward(page, firstFlyer - 1);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.enemies.length = 0;
    s.blocked = true; // Sim steht, kein Pause-Menue
  });
  await sleep(500);
  await page.screenshot({ path: resolve(OUT, 'screenshot-r6-p4-preview.png') });
  await page.locator('footer.shop').screenshot({ path: resolve(OUT, 'screenshot-r6-p4-shop.png') });
  const txt = await page.evaluate(() => ({ warn: document.querySelector('.flyer-warning')?.textContent, start: document.querySelector('.btn.start')?.textContent }));
  console.log(txt);

  // Niederlage: Spieler spielt weiter, bis alles durchbricht; Befehle und Ereignisse laufen ueber Session und Bus (Recorder sieht sie)
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.blocked = false;
    s.sim.state.godMode = false;
    s.sim.state.lives = Math.min(s.sim.state.lives, 12);
    s.sim.state.players[0].coins = 400;
    s.sim.state.enemies.length = 0;
    s.setSpeed(3);
    for (let i = 0; i < 40000 && !s.over; i++) {
      if (s.sim.state.enemies.length === 0) s.startNextWave();
      s.advance(250);
    }
  });
  await page.waitForSelector('.dialog.end', { timeout: 15000 });
  await sleep(300);
  console.log(await page.evaluate(() => [...document.querySelectorAll('.tip-list li')].map((l) => `${l.dataset.tip}: ${l.textContent}`)));
  await page.screenshot({ path: resolve(OUT, 'screenshot-r6-p4-defeat.png') });
} finally {
  await browser.close();
  stop();
}
