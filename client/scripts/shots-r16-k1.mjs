// Bilder Runde 16 K1 im echten Spiel (Karten hollow, marsh, bastion, skyreach): node scripts/shots-r16-k1.mjs [karte ...]
// Das Menue kennt die Karten noch nicht (Meta), daher startet das Skript `startMatch` ueber den Vite-Dev-Server direkt.
// Ergebnis: docs/r16/k1-match-KARTE.png (Karte mit Tuermen und laufender Runde), Konsolenfehler werden gemeldet.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r16');
mkdirSync(out, { recursive: true });
const maps = process.argv.slice(2).length ? process.argv.slice(2) : ['hollow', 'marsh', 'bastion', 'skyreach'];
const port = 5199, url = `http://127.0.0.1:${port}/?debug&seed=7`;
const dev = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-dev.pid, 'SIGTERM'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) { try { if ((await fetch(url)).ok) break; } catch { /* noch nicht */ } await new Promise((r) => setTimeout(r, 250)); }
const browser = await launch();
const errors = [];
for (const map of maps) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  errors.push(...watchErrors(page).map((e) => `${map}: ${e}`));
  await page.goto(url);
  await page.waitForTimeout(1500);
  await page.evaluate(async (m) => {
    const mod = await import('/src/match/match.ts');
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;inset:0;z-index:99;background:#181425';
    document.body.append(root);
    mod.startMatch(root, { map: m, difficulty: 'medium', seed: 7, debug: true, mods: { startCash: 20000 } });
  }, map);
  await page.waitForSelector('.m-canvas', { timeout: 40000 });
  await page.waitForTimeout(800);
  // Tuerme: je 6 Ranger/Bomber auf freie Raster-Stellen nahe am Weg
  await page.evaluate(() => {
    const g = __dw.game;
    const kinds = ['ranger', 'bombardier', 'frostcaller', 'ranger', 'ranger', 'bombardier', 'longshot', 'ranger'];
    let n = 0;
    const cand = [];
    for (let y = 30_000; y < 330_000; y += 6_000) for (let x = 30_000; x < 610_000; x += 6_000) cand.push([x, y]);
    // nahe am Weg zuerst: nach Abstand zu Wegpunkten sortieren
    const pts = g.state ? [] : [];
    void pts;
    const place = (k, x, y) => g.apply({ type: 'place', tower: k, x, y }).ok;
    const spread = [];
    for (const [x, y] of cand) {
      if (!g.canPlace('ranger', x, y).ok) continue;
      if (spread.every(([sx, sy]) => Math.hypot(sx - x, sy - y) > 70_000)) spread.push([x, y]);
    }
    for (const [x, y] of spread) { if (n >= kinds.length) break; if (place(kinds[n], x, y)) n++; }
  });
  await page.evaluate(() => { __dw.game.apply({ type: 'startRound' }); });
  await page.waitForTimeout(14000);
  await page.screenshot({ path: `${out}/k1-match-${map}.png` });
  await page.close();
}
await browser.close();
stop();
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'keine Konsolenfehler');
