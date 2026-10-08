// Runde 10 / P4: je Welt ein Screenshot der leeren Karte, einer beim Setzen (Zonen hervorgehoben) und einer mitten im Kampf (1920x1080).
// Braucht dist/ (npm run build) und einen Speicherstand mit geschafften Acts aller 10 Welten (SHOT_SAVE):
//   cd meta && SAVE_OUT=/pfad/save.json npx vitest run test/make-save.test.ts
// Schreibt client/docs/r10/p4-<welt>-leer.png, -setzen.png, -kampf.png (SHOT_DIR aendert das Ziel). Port: SHOT_PORT (Standard 4441).
// SHOT_WORLDS=greenie,navy-bay beschraenkt die Welten. Gibt je Welt die Malzeit der Karte aus (ms, steht in `window.__duskwardens.renderer().map`).
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, closeReveal, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';
import { readSpots, worldToScreen } from './lib/mouse.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4441);
const SAVE = process.env.SHOT_SAVE;
if (!SAVE) throw new Error('SHOT_SAVE fehlt (Speicherstand mit geschafften Acts, siehe Kopfkommentar)');
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r10');
const ALL = ['greenie', 'walled-city', 'snowy-town', 'sand-village', 'navy-bay', 'fiend-city', 'spirit-world', 'ant-kingdom', 'magic-town', 'haunted-academy'];
const WORLDS = process.env.SHOT_WORLDS ? process.env.SHOT_WORLDS.split(',') : ALL;
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p4-${name}.png`) });
let failed = false;
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
    await closeReveal(page);
    await page.waitForSelector('.starter-card.done');
  }
  for (const world of WORLDS) {
    const stage = `${world}-1`;
    await page.goto(url);
    await page.waitForSelector('.lobby');
    await page.locator('.lobby-play').click();
    await page.waitForSelector('.act-card');
    await page.locator(`.world-tab[data-world="${world}"]`).click();
    await sleep(400);
    if (await page.locator(`.act-card[data-stage="${stage}"]`).isDisabled()) {
      console.log(`${stage} gesperrt (Speicherstand?), uebersprungen`);
      failed = true;
      continue;
    }
    await page.locator(`.act-card[data-stage="${stage}"]`).click();
    await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
    await page.locator('.diff[data-difficulty="normal"]').click();
    await page.waitForSelector('canvas.board');
    await sleep(900);
    // die Maus aus dem Spielfeld, damit kein Geist die leere Karte verdeckt
    await page.mouse.move(5, 5);
    await shot(page, `${world}-leer`);
    const units = await page.evaluate(() => window.__duskwardens.session().team ?? []);
    // Setzen: erste Unit anwaehlen, Maus aufs Feld -> passende Zonen leuchten, Rest gedimmt
    await page.evaluate(() => { window.__duskwardens.session().sim.state.players[0].coins = 100000; });
    const order = await page.evaluate(() => [...document.querySelectorAll('.unit-btn')].map((b) => b.dataset.unit));
    await page.keyboard.press(String(order.indexOf(units[0]) + 1));
    const spot = (await readSpots(page, units[0], 1, { ignoreCoins: true }))[0];
    if (spot) {
      const sp = await worldToScreen(page, spot[0], spot[1]);
      await page.mouse.move(sp.x, sp.y);
      await sleep(250);
      await shot(page, `${world}-setzen`);
    }
    await page.keyboard.press('Escape');
    await page.mouse.move(5, 5);
    await buildTeam(page, { units: [...units, ...units, ...units], level: 2 });
    await fastForward(page, 8);
    await page.evaluate(() => window.__duskwardens.session().setSpeed(1));
    await sleep(1800);
    await page.mouse.move(5, 5);
    await shot(page, `${world}-kampf`);
    const info = await page.evaluate(() => {
      const r = window.__duskwardens.renderer();
      const s = window.__duskwardens.session();
      return { grid: `${r.ctx.cols}x${r.ctx.rows}`, tile: r.tile, wave: s.sim.state.wave, units: s.sim.state.units.length, enemies: s.sim.state.enemies.length };
    });
    console.log(world, info);
  }
  if (errors.length) {
    console.log('Seitenfehler:', errors.slice(0, 5));
    failed = true;
  }
} finally {
  await browser.close();
  stop();
}
if (failed) process.exitCode = 1;
