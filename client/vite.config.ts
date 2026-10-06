import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const shim = (f: string): string => fileURLToPath(new URL(`./src/shims/${f}`, import.meta.url));

export default defineConfig({
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
