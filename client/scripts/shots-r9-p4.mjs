// Runde 9 / P4: Screenshots der ueberarbeiteten Bildschirme (Lobby, Einstellungen, Credits, Shop, Team, Stufenwahl, Ladefehler, Bestaetigung,
// Hilfe, Pause, Ergebnis Sieg/Niederlage). 1920x1080. Braucht dist/ (npm run build). Schreibt client/docs/r9/p4-*.png.
// Port: SHOT_PORT (Standard 4443), SHOT_DIR aendert das Ziel. Lokal gibt es keine Porträt-Bilder: die gestalteten Ersatzkarten sind normal.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, openRun, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4443);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r9');
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p4-${name}.png`) });
const back = async (page) => {
  await page.locator('.meta-head .menu-back, .dialog .menu-back').first().click();
  await page.waitForSelector('.lobby:not(.loading)');
  await sleep(500);
};
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await sleep(1200);
  await shot(page, 'lobby-fresh');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(1500);
  await shot(page, 'lobby');

  await page.locator('.lobby-settings').click();
  await page.waitForSelector('.settings');
  await sleep(500);
  await shot(page, 'settings');
  await page.locator('.save-reset').click();
  await page.waitForSelector('.confirm-layer');
  await sleep(300);
  await shot(page, 'confirm');
  await page.locator('.confirm-no').click();
  await back(page);

  await page.locator('.menu-credits').click();
  await page.waitForSelector('.credits');
  await sleep(500);
  await shot(page, 'credits');
  await back(page);

  await page.locator('.lobby-shop').click();
  await page.waitForSelector('.product');
  await sleep(600);
  await shot(page, 'shop');
  await page.locator('.buy-btn').nth(1).click();
  await sleep(1500);
  await shot(page, 'shop-bought');
  await back(page);

  await page.locator('.lobby-team').click();
  await page.waitForSelector('.team-slot');
  await sleep(800);
  await shot(page, 'team');
  await back(page);

  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  await sleep(600);
  await page.locator('.act-card[data-stage="greenie-1"]').click();
  await page.waitForSelector('.stage-card');
  await sleep(700);
  await shot(page, 'stage');

  // Match: Hilfe, Pause
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  await sleep(800);
  await page.keyboard.press('h');
  await page.waitForSelector('.help:not(.hidden)');
  await sleep(400);
  await shot(page, 'help');
  await page.keyboard.press('Escape');
  await page.keyboard.press(' ');
  await page.waitForSelector('.paused:not(.hidden) .pause');
  await sleep(400);
  await shot(page, 'pause');
  await page.keyboard.press(' ');
  await sleep(200);

  // Ergebnis Niederlage: ohne Verteidigung durchspielen (ueber die Session, damit Recorder und Replay stimmen)
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.setSpeed(3);
    for (let i = 0; i < 400000 && !s.over; i++) {
      if (s.sim.state.enemies.length === 0) s.startNextWave();
      s.advance(250);
    }
  });
  await page.waitForSelector('.dialog.end', { timeout: 20000 });
  await page.waitForSelector('.reward-box[data-state="ok"], .reward-box[data-state="error"]', { timeout: 30000 });
  await sleep(1200);
  await shot(page, 'result-loss');
  console.log('Belohnung (Niederlage):', await page.locator('.reward-box').getAttribute('data-state'));

  // Ergebnis Sieg: neues Match, Sim ohne Gegner vorspulen
  await page.locator('.dialog.end .btn.menu').click();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  await page.locator('.act-card[data-stage="greenie-1"]').click();
  await page.waitForSelector('.stage-card');
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await sleep(600);
  // Ergebnis Sieg: das Team setzt und hochruesten laeuft ueber die Session (Befehle werden aufgezeichnet, das Replay stimmt)
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.setSpeed(3);
    let placed = 0;
    const place = () => {
      for (const d of s.teamCatalog().filter((x) => x.id === 'goku_ssj3')) {
        const spots = [...s.sim.placementGrid(d.id)].sort((a, b) => s.sim.coverage(b.x, b.y, 3500) - s.sim.coverage(a.x, a.y, 3500));
        for (const sp of spots.slice(0, 40)) {
          s.choosePlacing(d.id);
          const before = s.sim.state.units.length;
          s.clickBoard(sp.x, sp.y);
          if (s.sim.state.units.length > before) {
            placed++;
            if (placed >= 8) break;
          } else if (s.sim.state.players[0].coins < s.sim.placeCost(0, d.id)) break;
        }
      }
      s.cancel();
    };
    const upgrade = () => {
      for (let n = 0; n < 40; n++) {
        let did = false;
        for (const u of s.sim.state.units) {
          const c = s.sim.upgradeCost(u.id);
          if (c !== null && c !== undefined && c <= s.sim.state.players[0].coins) {
            s.selectedUnit = u.id;
            s.upgrade();
            did = true;
          }
        }
        if (!did) break;
      }
    };
    for (let i = 0; i < 600000 && !s.over; i++) {
      if (i % 20 === 0) {
        place();
        upgrade();
      }
      if (s.sim.state.enemies.length === 0) s.startNextWave();
      s.advance(250);
    }
  });
  await page.waitForSelector('.dialog.end', { timeout: 20000 });
  await page.waitForSelector('.reward-box[data-state="ok"], .reward-box[data-state="error"]', { timeout: 30000 });
  await sleep(1400);
  await shot(page, 'result-win');
  console.log('Ergebnis:', await page.locator('.dialog.end .title').textContent(), '| Belohnung:', await page.locator('.reward-box').getAttribute('data-state'));
  await ctx.close();

  // Ladefehler
  const c2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p2 = await c2.newPage();
  await p2.addInitScript(`localStorage.setItem('dw.meta.profile.a', 'kein json')`);
  await p2.goto(url);
  await p2.waitForSelector('.load-error');
  await sleep(500);
  await shot(p2, 'load-error');
  await c2.close();
  // Lobby mit echtem Portraet: lokal gibt es keine Bilder, deshalb liefert der Test ein Platzhalter-SVG unter /aa/units/ID.webp aus
  // (nur zum Pruefen des Bildpfads: grosse Karte, Schnitt, Rahmen; die Datei heisst p4-lobby-portrait-test.png)
  const c3 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p3 = await c3.newPage();
  const fake = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#c0392b"/></linearGradient></defs><rect width="256" height="256" fill="none"/><path d="M40 256c0-70 40-96 88-96s88 26 88 96z" fill="#1c2a5a"/><circle cx="128" cy="96" r="52" fill="#f2c9a0"/><path d="M70 100c-10-70 40-96 60-96s72 24 60 96c-14-30-30-40-60-40s-46 10-60 40z" fill="url(#g)"/><circle cx="108" cy="102" r="6" fill="#222"/><circle cx="148" cy="102" r="6" fill="#222"/></svg>`;
  await p3.route('**/aa/units/*.webp', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: fake }));
  await p3.route('**/aa/index.json', async (r) => {
    const m = await (await fetch(new URL('/aa/manifest.json', url))).json();
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.keys(m.units ?? {})) });
  });
  await p3.goto(url);
  await p3.waitForSelector('.lobby:not(.loading)');
  await p3.locator('.starter-claim').click();
  await p3.waitForSelector('.starter-card.done');
  await sleep(2200);
  await shot(p3, 'lobby-portrait-test');
  console.log('Held mit Bild:', await p3.locator('.hero-main .pc-img').count());
  await c3.close();
  console.log('Seitenfehler:', errors.length ? errors.slice(0, 3) : 'keine');
} finally {
  await browser.close();
  stop();
}
