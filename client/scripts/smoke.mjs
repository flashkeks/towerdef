// Smoke-Test (Runde 11 / P0, wird mit P3/P4 ausgebaut): startet `vite preview` auf dem vorhandenen dist/,
// oeffnet die Seite in Chromium (Playwright) und prueft: Seite laedt, keine Konsolenfehler, Spiel-Wurzel gefuellt.
// Aufruf: npm run build && npm run smoke
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const URL_ = `http://127.0.0.1:${PORT}/`;
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};
if (!existsSync(resolve(root, 'dist/index.html'))) {
  console.error('dist/ fehlt: erst `npm run build`.');
  process.exit(2);
}
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stopServer = () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    /* schon weg */
  }
};
process.on('exit', stopServer);
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(URL_)).ok) break;
  } catch {
    /* noch nicht da */
  }
  await new Promise((r) => setTimeout(r, 250));
}
const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL_);
  await page.waitForFunction(() => (document.getElementById('app')?.children.length ?? 0) > 0, null, { timeout: 15000 });
  check(true, 'Seite laedt, Spiel-Wurzel gefuellt');
  check(errors.length === 0, `keine Konsolenfehler (${errors.join(' | ')})`);
} finally {
  await browser.close();
}
console.log(failures.length ? `\n${failures.length} Fehler` : '\nalles gruen');
process.exit(failures.length ? 1 : 0);
