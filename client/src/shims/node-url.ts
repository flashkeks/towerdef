/** Browser-Platzhalter fuer `node:url` (siehe node-fs.ts). */
export const fileURLToPath = (u: string | URL): string => new URL(u).pathname;
