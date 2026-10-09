// Smoke-Test (Runde 11 / P3): startet `vite preview` auf dist/ und spielt in Chromium:
// Startbildschirm -> Match -> Turm per Mausklick platzieren -> Turm-Panel (Kauf per Knopf, Freischalten per Popup) -> Runde starten -> Gegner laufen -> ein paar Runden auf 3x -> keine Konsolenfehler.
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
  await page.click('.diff[data-diff="easy"]');
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
  await page.waitForSelector('.m-panel:not(.hidden) .ps-row', { timeout: 3000 });
  check(await page.locator('.m-panel .ps-row').count() === 3, 'Turm-Panel zeigt drei Pfadzeilen');
  check(await page.locator('.m-panel .ps-next').count() === 3 && await page.locator('.m-panel .p-tier').count() === 0, 'Turm-Panel zeigt je Pfad nur einen Knopf (nicht 15 Stufen)');
  // Upgrade ueber den Panel-Knopf kaufen (?debug: alles freigeschaltet): Cash auf Easy 650 - 170 = 480, erste Stufe Pfad A kostet ~100
  await page.waitForSelector('.m-panel .ps-row[data-path="0"] .ps-next.k-buy');
  await page.click('.m-panel .ps-row[data-path="0"] .ps-next');
  await page.waitForFunction(() => __dw.game.state.towers[0].tiers[0] === 1, null, { timeout: 3000 });
  check(true, 'Upgrade ueber den Panel-Knopf gekauft');
  await page.keyboard.press('.');
  await page.waitForFunction(() => __dw.game.state.towers[0].tiers[1] === 1, null, { timeout: 3000 });
  check(true, 'Upgrade per Taste (.) gekauft');
  // Freischalten per Pop-up: Stufe sperren (Sim-Zustand), Knopf zeigt XP, Klick -> Pop-up -> Enter -> Preis im Knopf
  await page.evaluate(() => { const s = __dw.game.state; s.maxTier.ranger = [1, 1, 0]; s.towerXp.ranger = 400; });
  await page.waitForSelector('.m-panel .ps-row[data-path="0"] .ps-next.k-unlock');
  check(true, 'nicht freigeschaltete Stufe zeigt XP-Knopf');
  await page.click('.m-panel .ps-row[data-path="0"] .ps-next');
  await page.waitForSelector('.m-confirm:not(.hidden) .cf-yes', { timeout: 3000 });
  check(true, 'Klick auf gesperrte Stufe oeffnet das Bestaetigungs-Popup');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.m-confirm', { state: 'hidden' });
  check(await page.evaluate(() => __dw.game.state.maxTier.ranger[0]) === 1, 'Esc im Popup schaltet nichts frei');
  await page.click('.m-panel .ps-row[data-path="0"] .ps-next');
  await page.waitForSelector('.m-confirm:not(.hidden) .cf-yes');
  await page.click('.m-confirm .cf-yes');
  await page.waitForSelector('.m-panel .ps-row[data-path="0"] .ps-next.k-buy', { timeout: 3000 });
  check(await page.evaluate(() => __dw.game.state.maxTier.ranger[0]) === 2, 'Popup Ja: Stufe freigeschaltet, Knopf zeigt sofort den Goldpreis');
  await page.evaluate(() => { __dw.game.state.maxTier.ranger = [5, 5, 5]; });
  await page.click('.m-panel .ps-row[data-path="0"] .ps-next');
  await page.waitForFunction(() => __dw.game.state.towers[0].tiers[0] === 2, null, { timeout: 3000 });
  check(true, 'freigeschaltete Stufe direkt gekauft');
  // Runde starten, Gegner laufen
  await page.keyboard.press('Escape');
  await page.keyboard.press(' ');
  await page.waitForFunction(() => __dw.game.state.round === 1 && __dw.game.state.enemies.length > 0, null, { timeout: 8000 });
  check(true, 'Runde 1 gestartet, Gegner laufen');
  await page.waitForTimeout(2500);
  check(await page.evaluate(() => __dw.game.state.stats.leaked >= 0), 'Sim laeuft weiter');
  // ein paar Runden auf 3x mit Auto-Start (Tempo-Knopf per Klick), dann Pause per Taste und wieder weiter
  await page.locator('.m-speed button, .m-side button', { hasText: '3x' }).first().click();
  await page.locator('.m-toggle').first().click();
  await page.waitForFunction(() => __dw.game.state.round >= 4 && __dw.game.state.phase !== 'lost', null, { timeout: 60000 });
  check(true, 'mehrere Runden auf 3x gespielt (Runde ' + (await page.evaluate(() => __dw.game.state.round)) + ')');
  await page.keyboard.press('p');
  const t0 = await page.evaluate(() => __dw.game.state.tick);
  await page.waitForTimeout(600);
  check((await page.evaluate(() => __dw.game.state.tick)) === t0, 'Pause haelt die Sim an');
  check(errors.length === 0, `keine Konsolenfehler (${errors.join(' | ')})`);
} finally {
  await browser.close();
  stop();
}
console.log(failures.length ? `\n${failures.length} Fehler` : '\nalles gruen');
process.exit(failures.length ? 1 : 0);
