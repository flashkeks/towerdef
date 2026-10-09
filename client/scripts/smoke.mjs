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

  // ---- Runde 12: Store, Reiter, Powers, Lautstaerke
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const err2 = watchErrors(p2);
  await p2.goto(url + '?debug');
  await p2.waitForSelector('.app-play', { timeout: 20000 });
  await p2.click('.navbtn:has-text("Store")');
  await p2.waitForSelector('.scard');
  check(await p2.locator('.scard').count() === 9, 'Store zeigt neun Karten');
  const e0 = Number(await p2.textContent('.chip.embers .ember-n'));
  check(e0 >= 100, `Embers-Anzeige im Store (${e0})`);
  await p2.click('.scard[data-power="goldDrop"] .sc-buy');
  await p2.waitForFunction((n) => Number(document.querySelector('.chip.embers .ember-n').textContent) === n, e0 - 40, { timeout: 3000 });
  check((await p2.textContent('.scard[data-power="goldDrop"] .sc-owned')).includes('2'), 'Gold Drop gekauft (Owned: 2, Embers -40)');
  await p2.click('.scard[data-power="instaWarden"] .sc-var[data-variant="bombardier"]');
  check(await p2.locator('.scard[data-power="instaWarden"] .sc-var.on[data-variant="bombardier"]').count() === 1, 'Insta-Warden: Variante waehlbar');
  await p2.click('.subtop .btn-small');
  await p2.waitForSelector('.app-play');
  await p2.click('.diff[data-diff="easy"]');
  await p2.click('.app-play');
  await p2.waitForSelector('.m-canvas', { timeout: 20000 });
  check(await p2.locator('.m-tab').count() === 3, 'drei Reiter (Towers, Powers, Wave)');
  await p2.click('.m-tab[data-tab="powers"]');
  await p2.waitForSelector('.pw-slot[data-power="goldDrop"].st-ready');
  const cash0 = await p2.evaluate(() => __dw.game.state.cash);
  await p2.click('.pw-slot[data-power="goldDrop"]');
  await p2.waitForFunction((c) => __dw.game.state.cash >= c + 500, cash0, { timeout: 3000 });
  check(true, 'Powers-Reiter: Gold Drop eingesetzt (+500 Gold)');
  await p2.waitForSelector('.pw-slot[data-power="goldDrop"].st-used', { timeout: 3000 });
  check(true, 'Gold Drop danach ausgegraut (Used this round)');
  await p2.keyboard.press('Tab');
  await p2.waitForSelector('.wv-row');
  check(await p2.locator('.m-pane-wave:not(.hidden) .wv-title').textContent() === 'Round 1', 'Tab oeffnet Wave-Reiter mit Vorschau Runde 1');
  await p2.keyboard.press('Tab');
  check(await p2.locator('.m-pane-towers:not(.hidden)').count() === 1, 'Tab wechselt reihum zurueck zu Towers');
  await p2.click('.m-vol .vol-btn');
  await p2.waitForSelector('.vol-pop:not(.hidden) .vol-row[data-kind="music"]');
  check(await p2.locator('.vol-row').count() === 2, 'Lautstaerke-Pop-over: Musik und Effekte getrennt');
  check(err2.length === 0, `keine Konsolenfehler in Store/Powers (${err2.join(' | ')})`);

  // ---- Runde 13: Longshot und Market im Match, Wissensbaum, Menue-Ton
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const err3 = watchErrors(p3);
  await p3.goto(url + '?debug');
  await p3.waitForSelector('.app-play', { timeout: 20000 });
  // Menue-Ton: schon der erste Klick im Hauptmenue entsperrt den AudioContext (vorher blieb alles stumm bis nach einem Match)
  check(await p3.evaluate(() => __audio.ctxState) === null, 'Audio vor dem ersten Klick noch nicht entsperrt');
  await p3.click('.navbtn:has-text("Knowledge")');
  await p3.waitForSelector('.knode');
  check(await p3.evaluate(() => __audio.ctxState) !== null, 'erster Klick im Menue erzeugt den AudioContext');
  check(await p3.evaluate(() => __audio.log.includes('ui.click')), 'Klick-Ton im Menue ausgeloest');
  check(await p3.locator('.knode').count() === 40, 'Wissensbaum zeigt 40 Knoten');
  check(await p3.locator('.kband').count() === 5, 'Wissensbaum zeigt fuenf Aeste');
  check(await p3.evaluate(() => { const sc = document.querySelector('.dw-screens'); return sc.scrollWidth <= sc.clientWidth; }), 'Wissensbaum bei 1280 x 720 ohne Quer-Scrollen');
  check(await p3.evaluate(() => { const sc = document.querySelector('.dw-screens'); return sc.scrollHeight <= sc.clientHeight; }), 'Wissensbaum bei 1280 x 720 ohne Scrollen (alle Aeste auf einer Flaeche)');
  check(await p3.evaluate(() => __audio.musicTimer === null), 'Menue ohne Musik (kein Musik-Timer)');
  await p3.click('.subtop .btn-small');
  await p3.waitForSelector('.app-play');
  await p3.click('.diff[data-diff="easy"]');
  await p3.click('.app-play');
  await p3.waitForSelector('.m-canvas', { timeout: 20000 });
  check(await p3.locator('.m-card').count() === 8, 'Turm-Leiste: sieben Tuerme und der Held');
  check((await p3.locator('.m-card .m-card-n').allTextContents()).slice(3, 7).join('|') === 'Longshot|Lantern Market|Thornweaver|Alchemist', 'Longshot, Market, Thornweaver und Alchemist in der Leiste');
  check(await p3.evaluate(() => { const s = document.querySelector('.m-panes'); const c = [...document.querySelectorAll('.m-card')]; return s.scrollHeight <= s.clientHeight && Math.max(...c.map((e) => e.getBoundingClientRect().bottom)) <= s.getBoundingClientRect().bottom; }), 'Turm-Leiste bei 1280 x 720 ohne Scrollen');
  const rect3 = await p3.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const at3 = (mx, my) => [rect3.x + (mx / 640) * rect3.w, rect3.y + (my / 360) * rect3.h];
  await p3.evaluate(() => __dw.game.sandbox.setCash(9000));
  const spot = (ty, x, y) => p3.evaluate(([t, xx, yy]) => { let b = null, bd = 1e9; for (let py = 20; py < 345; py += 4) for (let px = 20; px < 625; px += 4) { const d = Math.hypot(px - xx, py - yy); if (d < bd && __dw.game.canPlace(t, px * 1000, py * 1000).ok) { bd = d; b = [px, py]; } } return b; }, [ty, x, y]);
  const sl = await spot('longshot', 150, 150);
  await p3.keyboard.press('t');
  await p3.mouse.move(...at3(...sl));
  await p3.mouse.click(...at3(...sl));
  await p3.waitForFunction(() => __dw.game.state.towers.some((t) => t.type === 'longshot'), null, { timeout: 3000 });
  check(true, 'Longshot per Taste T und Klick platziert');
  const sm = await spot('market', 230, 190);
  await p3.keyboard.press('z');
  await p3.mouse.move(...at3(...sm));
  await p3.waitForTimeout(150);
  check(await p3.evaluate(() => __dw.r.rangeRing.visible === false && __dw.r.auraSpr.visible === true), 'Market-Geist zeigt Aura statt Reichweitenring');
  await p3.mouse.click(...at3(...sm));
  await p3.waitForFunction(() => __dw.game.state.towers.some((t) => t.type === 'market'), null, { timeout: 3000 });
  await p3.waitForFunction(() => document.querySelector('.m-panel:not(.hidden) .ps-info')?.textContent.includes('per round'), null, { timeout: 3000 });
  check(true, 'Market-Panel zeigt den Ertrag je Runde');
  // Bank (B2) kaufen, Runde spielen, Ertrag sichtbar, Withdraw
  await p3.evaluate(() => { const g = __dw.game; const m = g.state.towers.find((t) => t.type === 'market'); g.apply({ type: 'upgrade', towerId: m.id, path: 1 }); g.apply({ type: 'upgrade', towerId: m.id, path: 1 }); });
  const cashBefore = await p3.evaluate(() => __dw.game.state.cash);
  await p3.evaluate(() => { __dw.game.apply({ type: 'startRound' }); __dw.match.skip(60 * 45); });
  check(await p3.evaluate(() => __dw.game.state.stats.income > 0), 'Market-Ertrag nach der Runde (stats.income > 0)');
  await p3.waitForSelector('.pi-withdraw');
  check((await p3.textContent('.m-panel .pi-withdraw')).includes('Withdraw'), 'Bank: Withdraw-Knopf im Panel');
  const bank = await p3.evaluate(() => __dw.game.state.towers.find((t) => t.type === 'market').bank);
  const cash1 = await p3.evaluate(() => __dw.game.state.cash);
  if (bank > 0) {
    await p3.click('.pi-withdraw');
    await p3.waitForFunction((c) => __dw.game.state.cash >= c + 1, cash1, { timeout: 3000 });
    check(true, `Withdraw hebt die Bank ab (+${bank})`);
  } else check(false, 'Bank hatte nach einer Runde nichts');
  void cashBefore;
  await p3.waitForTimeout(400);
  check(err3.length === 0, `keine Konsolenfehler mit Longshot/Market/Wissensbaum (${err3.join(' | ')})`);

  // ---- Runde 14: Thornweaver, Alchemist, Wall of Trees, Wissensbaum scrollen
  const p4 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const err4 = watchErrors(p4);
  await p4.goto(url + '?debug&level=30&seed=5');
  await p4.waitForSelector('.app-play', { timeout: 20000 });
  await p4.click('.navbtn:has-text("Knowledge")');
  await p4.waitForSelector('.knode');
  const vis = await p4.evaluate(() => { const e = [...document.querySelectorAll('.knode.available')].find((n) => { const r = n.getBoundingClientRect(); return r.top > 60 && r.bottom < 700; }); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  check(vis !== null, 'im gescrollten Wissensbaum ist ein kaufbarer Knoten sichtbar');
  await p4.mouse.click(...vis);
  await p4.waitForSelector('.knode.bought');
  await p4.waitForTimeout(250);
  check(await p4.evaluate(() => { const sc = document.querySelector('.dw-screens'); return sc.scrollTop === 0 && document.querySelectorAll('.knode').length === 40; }), 'Wissensbaum nach einem Kauf neu gezeichnet, weiter ohne Scrollen');
  await p4.click('.subtop .btn-small');
  await p4.waitForSelector('.app-play');
  await p4.click('.diff[data-diff="medium"]');
  await p4.click('.app-play');
  await p4.waitForSelector('.m-canvas', { timeout: 20000 });
  const rect4 = await p4.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const at4 = (mx, my) => [rect4.x + (mx / 640) * rect4.w, rect4.y + (my / 360) * rect4.h];
  await p4.evaluate(() => { __dw.game.sandbox.setCash(90000); __dw.game.state.lives = 5000; });
  const spot4 = (ty, x, y) => p4.evaluate(([t, xx, yy]) => { let b = null, bd = 1e9; for (let py = 20; py < 345; py += 4) for (let px = 20; px < 625; px += 4) { const d = Math.hypot(px - xx, py - yy); if (d < bd && __dw.game.canPlace(t, px * 1000, py * 1000).ok) { bd = d; b = [px, py]; } } return b; }, [ty, x, y]);
  const sw = await spot4('thornweaver', 200, 228);
  await p4.keyboard.press('d');
  await p4.mouse.move(...at4(...sw));
  await p4.mouse.click(...at4(...sw));
  await p4.waitForFunction(() => __dw.game.state.towers.some((t) => t.type === 'thornweaver'), null, { timeout: 3000 });
  check(true, 'Thornweaver per Taste D und Klick platziert');
  const sa = await spot4('alchemist', 80, 190);
  await p4.keyboard.press('a');
  await p4.mouse.move(...at4(...sa));
  await p4.mouse.click(...at4(...sa));
  await p4.waitForFunction(() => __dw.game.state.towers.some((t) => t.type === 'alchemist'), null, { timeout: 3000 });
  check(true, 'Alchemist per Taste A und Klick platziert');
  check(await p4.evaluate(() => __dw.game.state.autoStart === false), 'Taste A schaltet nicht mehr Auto-Start (jetzt G)');
  await p4.evaluate(() => { const g = __dw.game; for (const t of g.state.towers) { const path = t.type === 'thornweaver' ? 1 : 0; for (let i = 0; i < 3; i++) g.apply({ type: 'upgrade', towerId: t.id, path }); } });
  await p4.evaluate(() => { __dw.game.apply({ type: 'startRound' }); });
  await p4.waitForFunction(() => __dw.game.state.enemies.length > 0, null, { timeout: 8000 });
  await p4.evaluate(() => { for (const a of __dw.game.state.abilities) { a.ready = true; a.cdLeft = 0; } });
  await p4.locator('.ab-btn[data-ab="wallOfTrees"]').click();
  await p4.waitForFunction(() => __dw.game.state.walls.length > 0, null, { timeout: 5000 });
  check(true, 'Wall of Trees per Faehigkeitsknopf eingesetzt (Baumwand auf dem Weg)');
  await p4.evaluate(() => __dw.match.setSpeed(3));
  await p4.waitForFunction(() => __dw.game.state.round >= 2 || __dw.game.state.phase === 'build', null, { timeout: 60000 });
  check(true, 'Runde mit Thornweaver und Alchemist gespielt');
  await p4.evaluate(() => { const r = __dw.r; r.handle({ type: 'gate', tick: 0, enemy: 1, etype: 'red' }); r.handle({ type: 'heal', tick: 0, tower: 0, lives: 1 }); r.handle({ type: 'bounty', tick: 0, tower: 1, x: 200000, y: 200000, gold: 40, reason: 'lead' }); });
  await p4.waitForTimeout(500);
  check(err4.length === 0, `keine Konsolenfehler mit Thornweaver/Alchemist (${err4.join(' | ')})`);
} finally {
  await browser.close();
  stop();
}
console.log(failures.length ? `\n${failures.length} Fehler` : '\nalles gruen');
process.exit(failures.length ? 1 : 0);
