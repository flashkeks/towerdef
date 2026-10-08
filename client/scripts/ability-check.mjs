// Runde 9 / P1: Pruefung der Faehigkeits-Bedienung im echten Browser (Klicks auf Ring in der Unit-Leiste, Knopf im Unit-Panel, Taste Q,
// Auto-Schalter) und der Beschwoerungen auf dem Feld. Braucht dist/ (npm run build). Port: ABILITY_PORT (Standard 4494).
// Aufbau wie in den Screenshot-Skripten: Profil mit Team (Wendy = Buff-Faehigkeit ohne Ziel, Erwin = Beschwoerer, Lucy), Units ueber die Sim gesetzt.
import { launch, sleep, startServer, buildTeam } from './lib/drive.mjs';

const PORT = Number(process.env.ABILITY_PORT ?? 4494);
const TEAM = ['wendy', 'erwin', 'lucy_evolved', 'goku_ssj3', 'sakura', 'hoshino'];
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};
const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(500);
  await page.evaluate(({ team }) => {
    let best = null;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) {
      const o = JSON.parse(localStorage.getItem(k));
      if (!best || o.rev > best.rev) best = o;
    }
    const p = best.profile;
    for (const id of team) p.units[id] = { level: 5, xp: 0, copies: 2, stars: 1, firstObtainedAt: '2026-10-08T00:00:00.000Z' };
    p.team = team;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) localStorage.setItem(k, JSON.stringify({ app: 'dw-meta', rev: best.rev + 5, profile: p }));
  }, { team: TEAM });
  await page.evaluate(() => indexedDB.deleteDatabase('dw-meta'));
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card, .diff');
  if (await page.locator('.act-card').first().isVisible().catch(() => false)) await page.locator('.act-card').first().click();
  await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
  await page.locator('.diff[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));

  // vor dem Setzen: kein Faehigkeits-Knopf in der Unit-Leiste
  check((await page.locator('.unit-btn.has-ability').count()) === 0, 'Unit-Leiste: ohne gesetzte Unit kein Faehigkeits-Knopf');
  const placed = await buildTeam(page, { units: ['wendy', 'wendy', 'erwin', 'lucy_evolved', 'hoshino'], level: 7 });
  check(placed === 5, `Units gesetzt: ${placed}`);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.godMode = true;
    s.cancel();
  });
  await sleep(400);
  const q = (fn, arg) => page.evaluate(fn, arg);
  const wendyAb = () => q(() => window.__duskwardens.session().sim.state.units.filter((u) => u.defId === 'wendy').map((u) => u.ab[0]));

  check((await page.locator('.unit-btn.has-ability').count()) >= 2, 'Unit-Leiste: Knopf bei Wendy und Erwin (gesetzte Units mit Knopf-Faehigkeit)');
  const wendyBtn = page.locator('.unit-btn[data-ability-unit="wendy"]');
  check((await wendyBtn.locator('.ab-count').innerText()) === '2/2', 'Unit-Leiste: Zaehler 2/2 bereit');
  // Klick auf den Ring: beide Wendys loesen aus
  await wendyBtn.locator('.ab-ring').click();
  await sleep(300);
  const after = await wendyAb();
  check(after.every((c) => c > 0), `Ring-Klick loest bei allen Wendys aus (Abklingzeit ${after.join(', ')})`);
  check((await wendyBtn.locator('.ab-ring').getAttribute('data-state')) === 'cooldown', 'Ring zeigt Abklingzeit');
  check((await wendyBtn.locator('.ab-ring .ab-time').innerText()).length > 0, 'Ring zeigt Restzeit als Text');
  const buffed = await q(() => window.__duskwardens.session().sim.state.units.filter((u) => (u.motDmgBp ?? 0) > 0).length);
  check(buffed >= 4, `Buff wirkt auf Verbuendete (${buffed} Units)`);
  // Zweiter Klick waehrend der Abklingzeit: Toast mit Grund, kein neuer Befehl
  await wendyBtn.locator('.ab-ring').click();
  const toast = await q(() => window.__duskwardens.session().toast?.key);
  check(toast === 'error.cooldown', `Klick waehrend der Abklingzeit: Toast ${toast}`);

  // Unit-Panel: Wendy waehlen, Faehigkeits-Block, Knopf, Auto-Schalter
  await q(() => {
    const s = window.__duskwardens.session();
    s.selectedUnit = s.sim.state.units.find((u) => u.defId === 'wendy').id;
  });
  await page.waitForSelector('.ab-block .ab-row');
  check((await page.locator('.ab-block .ab-name').first().innerText()) === 'Troia', 'Panel: Name der Faehigkeit aus den Daten');
  check((await page.locator('.ab-block .ab-ring').first().getAttribute('data-state')) === 'cooldown', 'Panel: Ring zeigt Abklingzeit');
  const auto = page.locator('.ab-block .ab-auto');
  check((await auto.innerText()) === 'Auto: off', 'Panel: Auto-Schalter aus');
  await auto.click();
  await sleep(200);
  check((await auto.innerText()) === 'Auto: on', 'Panel: Auto-Schalter an');
  check(await q(() => window.__duskwardens.session().sim.state.units.find((u) => u.defId === 'wendy' && u.auto === 1) !== undefined), 'Sim: auto = 1');
  // Auto loest nach Ablauf der Abklingzeit selbst aus (Gegner noetig): vorspulen
  const fired = await q(() => {
    const s = window.__duskwardens.session();
    const u = s.sim.state.units.find((x) => x.defId === 'wendy' && x.auto === 1);
    let g = 0;
    s.sim.drainEvents();
    while (g++ < 4000 && u.ab[0] > 0) {
      if (s.sim.state.enemies.length === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
    }
    let n = 0;
    while (s.sim.state.enemies.length === 0 && g++ < 8000) {
      if (s.sim.state.phase === 'prep' || s.sim.state.spawnQueue.length === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
    }
    for (let i = 0; i < 40; i++) {
      s.sim.step(1);
      n += s.sim.drainEvents().filter((e) => e.type === 'ability' && e.auto).length;
    }
    return n;
  });
  check(fired >= 1, `Auto-Schalter: Faehigkeit loest nach Ablauf selbst aus (${fired})`);
  // Taste Q (ausgewaehlte Unit, Auto aus)
  await auto.click();
  await q(() => {
    const s = window.__duskwardens.session();
    const u = s.sim.state.units.find((x) => x.defId === 'wendy' && x.id === s.selectedUnit);
    u.ab[0] = 0;
  });
  await page.keyboard.press('q');
  await sleep(200);
  check(await q(() => { const s = window.__duskwardens.session(); return s.sim.state.units.find((u) => u.id === s.selectedUnit).ab[0] > 0; }), 'Taste Q loest die Faehigkeit der gewaehlten Unit aus');

  // Beschwoerungen: Erwin ruft Soldaten (auto), Lucy ihre Tore; die Sim steht mit Gegnern, Figuren erscheinen auf dem Feld
  const summons = await q(() => {
    const s = window.__duskwardens.session();
    let g = 0;
    while (g++ < 6000 && (s.sim.state.summons?.length ?? 0) < 3) {
      if (s.sim.state.enemies.length === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
      s.sim.drainEvents();
    }
    return (s.sim.state.summons ?? []).map((x) => x.def);
  });
  check(summons.length >= 3, `Beschwoerungen stehen im Spiel: ${summons.join(', ')}`);
  await sleep(500);
  check(errors.length === 0, `keine Seitenfehler (${errors.slice(0, 2).join(' | ')})`);
  // Aura-Einheit: Hoshino gibt Verbuendeten dauerhaft Schaden
  const aura = await q(() => window.__duskwardens.session().sim.state.units.filter((u) => u.defId !== 'hoshino' && u.motDmgTicks > 0).length);
  check(aura >= 1, `Aura (Hoshino) buffed Verbuendete (${aura})`);
} finally {
  await browser.close();
  stop();
}
if (failures.length) {
  console.error(`\n${failures.length} Pruefung(en) fehlgeschlagen`);
  process.exit(1);
}
console.log('\nFaehigkeiten-Pruefung: alles ok');
