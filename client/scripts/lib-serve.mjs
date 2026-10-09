// Gemeinsamer Helfer fuer smoke.mjs und shots-*.mjs: startet `vite preview` auf dist/ und oeffnet Chromium.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function serve(port = Number(process.env.SMOKE_PORT ?? 4173)) {
  const url = `http://127.0.0.1:${port}/`;
  if (!existsSync(resolve(root, 'dist/index.html'))) throw new Error('dist/ fehlt: erst `npm run build`.');
  const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
  const stop = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch { /* schon weg */ } };
  process.on('exit', stop);
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return { url, stop };
}

// Hinweis: mit --use-gl=swiftshader liefert Chromium bei teilweise ueberdeckten WebGL-Canvas transparente Loecher im Screenshot
// ("weisses Rechteck" neben dem Upgrade-Panel). ANGLE+SwiftShader behebt das.
export async function launch() {
  return chromium.launch({
    executablePath: process.env.SMOKE_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  });
}

/** Sammelt Konsolenfehler (WebGL-Leistungshinweise der Software-Grafik zaehlen nicht). */
export function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`PAGEERR ${e.message}`));
  return errors;
}
