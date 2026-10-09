# meta - Fortschritt (Duskwardens, Runde 11)

Reine Funktionen ohne DOM: Profil (Schema 11), Spieler-Level, Turm-XP, Wissensbaum, Medaillen, Export/Import.
Zahlen und Begründung: `docs/design/meta.md`. Test: `npx vitest run && npx tsc --noEmit`.

- `src/data.ts` feste Zahlen (Level-Kurve, Kosten, Freischalt-Level, Wissensknoten)
- `src/profile.ts` Schema, `newProfile`, `loadProfile` (alte Stände -> frisch + `showResetNotice`), `sanitize`
- `src/progress.ts` `applyMatch` (idempotent je `matchId`), `unlockTier`, `buyNode`, `matchOptions(profile)` -> `{ unlocks, mods }` für `createGame`, `unlockEverything` (Testhilfe)
- `src/io.ts` Export/Import mit Prüfsumme

Der Client greift über `client/src/meta/` zu (Speicher: IndexedDB, Rückfall localStorage, Arbeitsspeicher).
