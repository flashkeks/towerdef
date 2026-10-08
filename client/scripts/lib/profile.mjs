// Gemeinsamer Aufbau fuer die Runde-10-Skripte: frisches Profil, Starter-Geschenk, Team im Speicherstand eintragen, Stage starten.
// Das Aufstocken des Profils (Units mit Level/Sternen, Team) ist reiner Testaufbau und gilt nur fuer dieses Browser-Profil.
import { closeReveal, sleep } from './drive.mjs';

/** Neue Seite im eigenen Kontext, Team im Profil, Lobby -> Weltkarte -> Act -> Schwierigkeit -> Spielfeld. */
export async function setupRun(browser, url, team, { width = 1920, height = 1080, stage = null, difficulty = 'normal' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await closeReveal(page);
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
  }, { team });
  await page.evaluate(() => indexedDB.deleteDatabase('dw-meta'));
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card, .diff');
  if (await page.locator('.act-card').first().isVisible().catch(() => false)) {
    await (stage ? page.locator(`.act-card[data-stage="${stage}"]`) : page.locator('.act-card').first()).click();
  }
  await page.waitForSelector(`.diff[data-difficulty="${difficulty}"]:not([disabled])`);
  await page.locator(`.diff[data-difficulty="${difficulty}"]`).click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  return page;
}
