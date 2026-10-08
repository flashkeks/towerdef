// Runde 9 / P1: Screenshots der Faehigkeiten im Match: Unit-Panel mit Faehigkeits-Block, Unit-Leiste mit Abklingzeit-Ring, Beschwoerungen auf dem Feld.
// Braucht dist/ (npm run build). Schreibt client/docs/r9/p1-*.png. Port: SHOT_PORT (Standard 4491).
// Das Profil wird nach dem Starter-Geschenk im localStorage mit den Test-Units und einem Team aufgestockt (nur Testaufbau).
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4491);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r9');
mkdirSync(OUT, { recursive: true });
const TEAM = ['gojo_evolved', 'lucy_evolved', 'erwin', 'eren', 'homura_evolved', 'lelouch_evolved'];
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p1-${name}.png`) });
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(600);
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
  // Aufbau: je Team-Unit eine, Stufe 7 (alle Faehigkeiten frei), Wellen vorspulen
  const placed = await buildTeam(page, { units: TEAM, level: 7 });
  console.log('Units gesetzt', placed);
  await fastForward(page, 3);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.godMode = true;
    s.setSpeed(1);
    for (const u of s.sim.state.units) s.sim.apply(0, { type: 'autoAbility', entityId: u.id, on: u.defId === 'lucy_evolved' || u.defId === 'erwin' || u.defId === 'lelouch_evolved' || u.defId === 'eren' });
  });
  // vorspulen (ohne Zeichnen), bis Beschwoerungen stehen und Gojos Faehigkeit ein Ziel in Reichweite hat
  const ready = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    const gojo = st.units.find((x) => x.defId === 'gojo_evolved');
    let guard = 0;
    while (guard++ < 6000 && !(s.sim.abilityBlocked(gojo.id, 0) === null && (st.summons?.length ?? 0) > 2)) {
      if (st.enemies.length === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
      s.sim.drainEvents();
    }
    // derselbe Weg wie der Klick auf den Ring der Unit-Leiste (Session.useAbilityType), im selben Tick wie das Vorspulen
    const fired = s.useAbilityType('gojo_evolved');
    return { guard, tick: st.tick, summons: st.summons?.length ?? 0, fired };
  });
  console.log('vorgespult', ready);
  // Gojo: Domain Expansion per Klick auf den Ring der Unit-Leiste
  await page.evaluate(() => {
    window.__duskwardens.session().setSpeed(1);
    const s = window.__duskwardens.session();
    const u = s.sim.state.units.find((x) => x.defId === 'gojo_evolved');
    s.selectedUnit = u.id;
  });
  await sleep(300);
  await shot(page, 'panel-ready');
  await sleep(1300);
  await shot(page, 'match-ability-summons');
  console.log(
    await page.evaluate(() => {
      const s = window.__duskwardens.session();
      const st = s.sim.state;
      return { wave: st.wave, enemies: st.enemies.length, summons: (st.summons ?? []).map((x) => x.def), stunned: st.enemies.filter((e) => e.stunTicks > 0).length, ab: st.units.map((u) => [u.defId, u.ab]) };
    }),
  );
  // Aufnahme des Panels: Lucy waehlen
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.selectedUnit = s.sim.state.units.find((x) => x.defId === 'lucy_evolved').id;
  });
  await sleep(400);
  await shot(page, 'panel-lucy');
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.selectedUnit = s.sim.state.units.find((x) => x.defId === 'gojo_evolved').id;
  });
  await sleep(400);
  await shot(page, 'panel-cooldown');
} finally {
  await browser.close();
  stop();
}
