# meta - Fortschritt (Duskwardens, Runde 11)

Reine Funktionen ohne DOM: Profil (Schema 11), Spieler-Level, Turm-XP, Wissensbaum, Medaillen, Export/Import.
Zahlen und Begründung: `docs/design/meta.md`. Test: `npx vitest run && npx tsc --noEmit`.

- `src/data.ts` feste Zahlen (Level-Kurve, Kosten, Freischalt-Level, Wissensknoten)
- `src/profile.ts` Schema, `newProfile`, `loadProfile` (alte Stände -> frisch + `showResetNotice`), `sanitize`
- `src/progress.ts` `applyMatch` (idempotent je `matchId`), `unlockTier` (Turm-Detail außerhalb des Matches), `buyNode`, `matchOptions(profile)` -> `{ unlocks, towerXp, mods }` für `createGame` (`mods.towerXpBp` = Fast Learner), `unlockEverything` (Testhilfe)
- `src/io.ts` Export/Import mit Prüfsumme

Der Client greift über `client/src/meta/` zu (Speicher: IndexedDB, Rückfall localStorage, Arbeitsspeicher).

## Runde 11b: Turm-XP kommt aus dem Match

- Startguthaben **100** je Turm (`STARTER_TOWER_XP`, genau Stufe 1). Alte 11er-Profile (250) bleiben gültig, keine Zurücksetzung.
- `applyMatch` rechnet keine Pops-Formel mehr. Das `MatchResult` trägt optional `towerXp` (Endkonto), `towerTiers` (Endstufen, `state.maxTier`) und `towerXpGained` (im Match verdient, für den Bericht). Das Profil übernimmt Konto und Stufen (Stufen sinken nie; mit `settings.unlockAll` bleiben die echten Stufen unangetastet, weil im Match alles frei ist). Fehlen die Felder, bleibt das Turm-Profil unverändert. Idempotent je `matchId`; `tierBuys` ist entfallen.
- Der Topf und seine Aufteilung stehen in der Sim (`sim/src/xp.ts`), Kosten in `sim/data/xp.json`; `TIER_COST` in `data.ts` spiegelt sie (Test vergleicht).
- Ein Match, das in Runde 0 verlassen wird, wird nicht verbucht (auch nicht die im Match freigeschalteten Stufen).
