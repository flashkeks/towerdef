// Runde 9 / P2: Weltkarte mit 10 Welten und je ein Match-Screenshot aus Welt 4, 7 und 10 (1920x1080, grosse Karten).
// Braucht dist/ (npm run build) und einen Speicherstand mit geschafften Acts (SHOT_SAVE, siehe meta/test/make-save.test.ts, 9 Welten).
// Schreibt client/docs/r9/p2-*.png. Port: SHOT_PORT (Standard 4431).
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';
import { clickWorld, readGhost, readSpots, worldToScreen } from './lib/mouse.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4431);
const SAVE = process.env.SHOT_SAVE;
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r9');
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p2-${name}.png`) });
try {
  const page = await (await browser.newContext({ viewport: { width: Number(process.env.SHOT_W ?? 1920), height: Number(process.env.SHOT_H ?? 1080) } })).newPage();
  await page.goto(url);
  await page.waitForSelector('.lobby');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  if (SAVE) {
    await page.locator('.lobby-settings').click();
    await page.waitForSelector('.save-import');
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator('.save-import').click()]);
    await fc.setFiles(SAVE);
    await page.locator('.confirm-yes').click();
    await page.waitForSelector('.flash.good');
    await page.reload();
    await page.waitForSelector('.lobby');
  }
  if (await page.locator('.starter-claim').isVisible().catch(() => false)) {
    await page.locator('.starter-claim').click();
    await page.waitForSelector('.starter-card.done');
  }
  const worldMap = async (world) => {
    await page.locator('.lobby-play').click();
    await page.waitForSelector('.act-card');
    if (world) await page.locator(`.world-tab[data-world="${world}"]`).click();
    await sleep(500);
  };
  await worldMap(null);
  await shot(page, 'worldmap');
  await page.locator('.world-tab[data-world="greenie"]').click();
  await sleep(700);
  await shot(page, 'worldmap-world1');
  await page.locator('.world-tab[data-world="fiend-city"]').click();
  await sleep(700);
  await shot(page, 'worldmap-world6');

  for (const [world, stage] of [['sand-village', 'sand-village-1'], ['spirit-world', 'spirit-world-1'], ['haunted-academy', 'haunted-academy-1']]) {
    await page.goto(url);
    await page.waitForSelector('.lobby');
    await worldMap(world);
    if (await page.locator(`.act-card[data-stage="${stage}"]`).isDisabled()) {
      console.log(`${stage} gesperrt (Speicherstand fehlt?), uebersprungen`);
      continue;
    }
    await page.locator(`.act-card[data-stage="${stage}"]`).click();
    await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
    await page.locator('.diff[data-difficulty="normal"]').click();
    await page.waitForSelector('canvas.board');
    const units = await page.evaluate(() => window.__duskwardens.session().team ?? []);
    // Mausprobe auf der grossen Karte: Geist liegt unter dem Zeiger, ein echter Klick setzt die Unit dorthin
    const probe = units[0];
    await page.evaluate(() => { window.__duskwardens.session().sim.state.players[0].coins = 100000; });
    const order = await page.evaluate(() => [...document.querySelectorAll('.unit-btn')].map((b) => b.dataset.unit));
    await page.keyboard.press(String(order.indexOf(probe) + 1));
    const spot = (await readSpots(page, probe, 1, { ignoreCoins: true }))[0];
    const sp = await worldToScreen(page, spot[0], spot[1]);
    await page.mouse.move(sp.x, sp.y);
    await sleep(150);
    const gh = await readGhost(page);
    await clickWorld(page, spot[0], spot[1]);
    await sleep(150);
    const placed = await page.evaluate(() => window.__duskwardens.session().sim.state.units.map((u) => [u.x, u.y]));
    const hit = placed.some(([x, y]) => Math.abs(x - spot[0]) <= 60 && Math.abs(y - spot[1]) <= 60);
    console.log(stage, 'Mausprobe', { spot, ghost: gh && { ok: gh.ok, reason: gh.reason, unit: gh.unitId, x: gh.x, y: gh.y }, probe, placed: placed.length, hit });
    if (!hit || !gh?.ok) process.exitCode = 1;
    await buildTeam(page, { units: [...units, ...units], level: 2 });
    await fastForward(page, 8);
    await page.evaluate(() => window.__duskwardens.session().setSpeed(1));
    await sleep(1500);
    await shot(page, `match-${stage.replace(/-1$/, '')}`);
    console.log(stage, await page.evaluate(() => {
      const r = window.__duskwardens.renderer();
      const b = document.querySelector('canvas.board').getBoundingClientRect();
      return { grid: `${r.ctx.cols}x${r.ctx.rows}`, tile: r.tile, canvas: `${Math.round(b.width)}x${Math.round(b.height)}`, wave: window.__duskwardens.session().sim.state.wave };
    }));
  }
} finally {
  await browser.close();
  stop();
}
