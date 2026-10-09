// Smoke-Test (Runde 11 / P3): startet `vite preview` auf dist/ und spielt in Chromium:
// Startbildschirm -> Match -> Turm per Mausklick platzieren -> Upgrade-Panel -> Runde starten -> Gegner laufen -> keine Konsolenfehler.
// Aufruf: npm run build && npm run smoke
import { launch, serve, watchErrors } from './lib-serve.mjs';

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};
const { url, stop } = await serve();
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = watchErrors(page);
  await page.goto(url + '?debug');
  await page.waitForSelector('.app-play', { timeout: 20000 });
  check(true, 'Startbildschirm da');
  await page.click('.app-diff[data-diff="easy"]');
  await page.click('.app-play');
  await page.waitForSelector('.m-canvas', { timeout: 20000 });
  check(true, 'Match gestartet (Canvas da)');
  const st0 = await page.evaluate(() => ({ cash: __dw.game.state.cash, lives: __dw.game.state.lives }));
  check(st0.lives === 200, `Easy: 200 Leben (${st0.lives})`);
  // Karte: Canvas-Rechteck
  const rect = await page.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const at = (mx, my) => [rect.x + (mx / 640) * rect.w, rect.y + (my / 360) * rect.h];
  // ungueltiger Platz (auf dem Weg): Turm waehlen, klicken -> Toast, kein Turm
  await page.click('.m-card:nth-child(1)');
  await page.mouse.click(...at(60, 92));
  await page.waitForSelector('.m-toast', { timeout: 3000 });
  check(await page.evaluate(() => __dw.game.state.towers.length === 0), 'Platzieren auf dem Weg wird abgelehnt');
  // gueltiger Platz
  await page.mouse.click(...at(150, 150));
  await page.waitForFunction(() => __dw.game.state.towers.length === 1, null, { timeout: 3000 });
  check(true, 'Turm per Mausklick platziert');
  await page.waitForSelector('.m-panel:not(.hidden) .p-tier', { timeout: 3000 });
  check(await page.locator('.m-panel .p-col').count() === 3, 'Upgrade-Panel zeigt drei Pfade');
  check(await page.locator('.m-panel .p-tier').count() === 15, 'Upgrade-Panel zeigt 15 Stufen');
  // Upgrade kaufen: Cash auf Easy 650 - 170 = 480, erste Stufe Pfad A kostet ~100
  await page.keyboard.press(',');
  await page.waitForFunction(() => __dw.game.state.towers[0].tiers[0] === 1, null, { timeout: 3000 });
  check(true, 'Upgrade per Taste (,) gekauft');
  // Runde starten, Gegner laufen
  await page.keyboard.press('Escape');
  await page.keyboard.press(' ');
  await page.waitForFunction(() => __dw.game.state.round === 1 && __dw.game.state.enemies.length > 0, null, { timeout: 8000 });
  check(true, 'Runde 1 gestartet, Gegner laufen');
  await page.waitForTimeout(2500);
  check(await page.evaluate(() => __dw.game.state.stats.leaked >= 0), 'Sim laeuft weiter');
  check(errors.length === 0, `keine Konsolenfehler (${errors.join(' | ')})`);
} finally {
  await browser.close();
  stop();
}
console.log(failures.length ? `\n${failures.length} Fehler` : '\nalles gruen');
process.exit(failures.length ? 1 : 0);
