// Bilder Runde 16 H (Startseite mit zehn Karten): npm run build && node scripts/shots-r16-h.mjs
// Ergebnis: docs/r16/h-*.png, 1280x720 und 1920x1080 (+1366x768), mit Profil aus ein paar Medaillen.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r16');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4173));
const browser = await launch();
const sizes = [[1280, 720], [1366, 768], [1920, 1080]];
const profile = {
  playerXp: 3600,
  medals: { meadow: { easy: true, medium: true, hard: true }, hollow: { easy: true, medium: true, hard: false }, marsh: { easy: true, medium: false, hard: false } },
  best: { meadow: { easy: { round: 40, livesLost: 12 }, medium: { round: 60, livesLost: 31 }, hard: { round: 80, livesLost: 100 } }, hollow: { easy: { round: 40, livesLost: 5 }, medium: { round: 60, livesLost: 20 } } },
  freeplayBest: { meadow: 73 },
};
const bad = [];
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = watchErrors(page);
  await page.goto(url + '?debug&seed=7');
  await page.waitForSelector('.maptile', { timeout: 20000 });
  await page.evaluate(async (pt) => { const s = __app.store; await s.update({ ...s.profile, ...pt, settings: { ...s.profile.settings, unlockAll: false } }); __app.go({ name: 'home' }); }, profile);
  for (const tier of ['intermediate', 'beginner', 'advanced', 'expert']) {
    await page.click(`.maptab[data-tier="${tier}"]`);
    await page.waitForFunction(() => document.querySelectorAll('.maptile canvas.pv').length >= document.querySelectorAll('.maptile').length, null, { timeout: 60000 });
    await page.waitForTimeout(200);
    const fit = await page.evaluate(() => { const sc = document.querySelector('.dw-screens'); return { sh: sc.scrollHeight, ch: sc.clientHeight }; });
    console.log(w, h, tier, JSON.stringify(fit));
    if (fit.sh > fit.ch + 1) bad.push(`${w}x${h} ${tier}`);
    await page.screenshot({ path: `${out}/h-start-${w}-${tier}.png` });
  }
  if (errs.length) console.log(errs);
  await page.close();
}
await browser.close();
stop();
if (bad.length) { console.log('SCROLL', bad); process.exit(1); }
