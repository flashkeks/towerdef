/** Browser-Platzhalter fuer `node:fs`: die Sim importiert es nur fuer `loadGameData()`, das der Client nie aufruft (er baut die Daten aus den JSON-Importen, siehe `src/sim/data.ts`). */
const nope = (): never => {
  throw new Error('node:fs ist im Browser nicht verfuegbar');
};
export const readFileSync = (..._args: unknown[]): string => nope();
export const readdirSync = (..._args: unknown[]): string[] => nope();
