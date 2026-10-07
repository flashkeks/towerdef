/**
 * Einziges Tor des Clients zu `meta/` (wie `src/sim/index.ts` fuer die Sim). Der Rest des Clients importiert Meta-Typen nur von hier
 * oder ueber `backend/`. Meta hat kein DOM und wird spaeter auch auf dem Server genutzt.
 */
export * from '../../../meta/src/index';
