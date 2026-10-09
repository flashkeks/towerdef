import { defineConfig } from 'vitest/config';

// Bot-Läufe dauern einige Sekunden; unter Last (parallele Agenten, CI) reicht das Standard-Timeout von 5 s nicht.
export default defineConfig({ test: { testTimeout: 30_000, setupFiles: ['test/setup.ts'] } });
