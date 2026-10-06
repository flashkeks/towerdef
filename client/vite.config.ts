import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const shim = (f: string): string => fileURLToPath(new URL(`./src/shims/${f}`, import.meta.url));

/** Kurzer Commit-Hash zur Build-Zeit, ohne Git (oder ohne Repo) "dev". */
function buildHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'dev';
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    // vom Replay-Recorder (P2) gelesen
    __APP_VERSION__: JSON.stringify(`${buildHash()} ${new Date().toISOString().slice(0, 10)}`),
  },
  // Die Sim zieht `node:fs`/`node:url` nur fuer ihren Datei-Lader mit; im Browser laufen Platzhalter (sim/ bleibt unveraendert).
  resolve: {
    alias: [
      { find: /^node:fs$/, replacement: shim('node-fs.ts') },
      { find: /^node:url$/, replacement: shim('node-url.ts') },
    ],
  },
  server: { fs: { allow: ['..'] } },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
