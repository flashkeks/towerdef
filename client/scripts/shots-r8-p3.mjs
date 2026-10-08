// Runde 8 / P3: Screenshots der Weltkarte und je eines Matches in Welt 1, 2 und 3 (andere Karten, andere Farben).
// Braucht dist/ (npm run build). Schreibt client/docs/r8/p3-*.png. Port: SHOT_PORT (Standard 4430).
// Welt 2 und 3 sind erst nach Fortschritt offen: ein Speicherstand mit geschafften Acts wird ueber Einstellungen -> Import geladen
// (Datei: SHOT_SAVE, erzeugt aus meta/ mit einem Profil mit Starter-Team und Act 1-3 von Welt 1 und 2).
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer, closeReveal } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4430);
const SAVE = process.env.SHOT_SAVE;
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r8');
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p3-${name}.png`) });
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
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
  } else if (await page.locator('.starter-claim').isVisible().catch(() => false)) {
    await page.locator('.starter-claim').click();
    await closeReveal(page);
    await page.waitForSelector('.starter-card.done');
  }
  const worldMap = async (world) => {
    await page.locator('.lobby-play').click();
    await page.waitForSelector('.act-card');
    if (world) await page.locator(`.world-tab[data-world="${world}"]`).click();
    await sleep(200);
  };
  await worldMap(null);
  await shot(page, 'worldmap');
  await page.locator('.world-tab[data-world="walled-city"]').click().catch(() => {});
  await sleep(200);
  await shot(page, 'worldmap-world2');

  for (const [i, [world, stage]] of [['greenie', 'greenie-1'], ['walled-city', 'walled-city-1'], ['snowy-town', 'snowy-town-1']].entries()) {
    await page.goto(url);
    await page.waitForSelector('.lobby');
    await worldMap(world);
    if (await page.locator(`.act-card[data-stage="${stage}"]`).isDisabled()) {
      console.log(`${stage} gesperrt (Speicherstand fehlt?), uebersprungen`);
      continue;
    }
    await page.locator(`.act-card[data-stage="${stage}"]`).click();
    await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
    if (i === 0) await shot(page, 'stage-select');
    await page.locator('.diff[data-difficulty="normal"]').click();
    await page.waitForSelector('canvas.board');
    const units = await page.evaluate(() => window.__duskwardens.session().team ?? []);
    await buildTeam(page, { units: [...units, ...units], level: 2 });
    await fastForward(page, 8);
    await page.evaluate(() => window.__duskwardens.session().setSpeed(1));
    await sleep(1500);
    await shot(page, `match-world${i + 1}`);
    console.log(stage, await page.evaluate(() => ({ wave: window.__duskwardens.session().sim.state.wave, units: window.__duskwardens.session().sim.state.units.length })));
  }
} finally {
  await browser.close();
  stop();
}
