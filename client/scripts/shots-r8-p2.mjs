// Runde 8 / P2: Screenshots der importierten AA-Units: Summon nach einem 10er-Zug, Sammlung (550 Units), Match mit importierten Units.
// Braucht dist/ (npm run build). Schreibt client/docs/r8/p2-*.png. Port: SHOT_PORT (Standard 4441).
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4441);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r8');
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await page.screenshot({ path: resolve(OUT, 'p2-lobby-starter.png') });
  await page.locator('.lobby-summon').click();
  await page.waitForSelector('.pull-btn[data-count="10"]');
  await page.screenshot({ path: resolve(OUT, 'p2-summon-rates.png') });
  await page.locator('.pull-btn[data-count="10"]').click();
  await page.waitForSelector('.reveal');
  await sleep(500);
  await page.mouse.click(800, 60);
  await page.waitForSelector('.reveal.finished');
  await sleep(400);
  await page.screenshot({ path: resolve(OUT, 'p2-summon-10pull.png') });
  await page.locator('.reveal-done').click();
  await page.waitForSelector('.reveal', { state: 'detached' });
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile');
  await page.screenshot({ path: resolve(OUT, 'p2-units.png') });
  const n = await page.locator('.unit-count').textContent();
  console.log('Sammlung:', n);

  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
  await page.locator('.diff[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  const run = page;
  const TEAM = ['genos', 'kakyoin', 'piccolo', 'crocodile', 'frieza', 'goku_ssj3'];
  const placed = await buildTeam(run, { units: [...TEAM, 'goku_ssj3', 'genos'], level: 2 });
  console.log('Units gesetzt', placed);
  await fastForward(run, 6);
  await run.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.apply(0, { type: 'skipWave' });
    s.setSpeed(1);
  });
  await sleep(2500);
  await run.screenshot({ path: resolve(OUT, 'p2-match.png') });
} finally {
  await browser.close();
  stop();
}
