import { defineConfig } from 'vitest/config';

// Gacha-Test mit 1 Mio. Wuerfen braucht etwas Zeit.
export default defineConfig({ test: { environment: 'node', include: ['test/**/*.test.ts'], testTimeout: 30_000 } });
