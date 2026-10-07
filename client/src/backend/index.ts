/** Tor zum Backend: `getBackend()` liefert die eine Instanz. M2 tauscht hier `LocalBackend` gegen `ServerBackend`, der Rest des Clients bleibt. Besitzer: P1. */
import type { Backend } from './backend';
import { LocalBackend } from './local';

export type { Backend, BResult, BFail, Saved } from './backend';
export type { Persistence } from './storage';
export { LocalBackend } from './local';
export { ProfileStorage, MemoryTier, LocalStorageTier, IndexedDbTier, defaultStorage, defaultTiers } from './storage';

let instance: Backend | null = null;

export function getBackend(): Backend {
  if (!instance) instance = new LocalBackend();
  return instance;
}

/** Nur fuer Tests: Instanz ersetzen oder zuruecksetzen. */
export function setBackendForTests(b: Backend | null): void {
  instance = b;
}
