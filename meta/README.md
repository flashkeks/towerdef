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

## Runde 12: Embers, Inventar, Store

- Profil (Schema bleibt 11): `embers`, `inventory: Record<PowerKey, number>`, `starterPack` (Flag). Neue Profile starten mit **100 Embers + 1 Gold Drop + 1 Lantern Bomb**; bestehende 11er-Profile ohne die Felder bekommen das Paket einmalig beim Laden/Import (`grantStarterPack` in `sanitize`), alles andere bleibt.
- `applyMatch` schreibt Embers gut: je Runde `1 + floor(r/5)` (Runden 1-20, Freeplay zählt nicht, R1-20 = 54), Sieg 20/30/50, erste Medaille +50, Level-Up +25 je Level (`matchEmbers`). `MatchResult.powersUsed` (= `state.stats.powersUsed`) wird vom Inventar abgezogen. Idempotent je `matchId`. `MatchReport`: `embersGained`, `embers { rounds, win, medal, levelUp }`, `powersUsed`.
- `buyPower(profile, key, count = 1)`: Preis aus `sim/data/powers.json` (`powerPrice`), Fehlercodes `unknown-power`, `bad-count`, `not-enough-embers`.
- `matchOptions(profile)` liefert zusätzlich `powers` (Inventar-Kopie) für `createGame`.

## Runde 13: Wissensbaum mit 28 Knoten, Freischalt-Level, neue Türme

- **Türme:** `TOWER_TYPES` = ranger, bombardier, frostcaller, longshot, market. `LEVEL_UNLOCKS`: Longshot ab Level 5, Lantern Market ab Level 6; wer schon darüber ist, bekommt sie beim nächsten Laden (`matchOptions` rechnet aus dem Level). Profil-Schema bleibt 11: `towerXp` / `towerTiers` bekommen für `longshot`/`market` per zod-Default Startwert 100 bzw. `[0,0,0]` (Migration, nichts wird zurückgesetzt). `MatchResult` darf die neuen Typen weglassen (Vorgabe 0 / `[0,0,0]`; `MatchResult` ist jetzt `z.input`).
- **Wissensbaum** (`KNOWLEDGE`, `BRANCHES`, `BRANCH_NAMES`): 28 Knoten, 5 Äste (economy 6, primary 7, specialists 4, wardens 7, powers 4), Summe 52 Punkte; die 10 alten IDs bleiben (Ast `towers` heißt `primary`). `requires` = mindestens einer; `col`/`row` je Ast für die Anzeige. Punkte: `knowledgePoints.total` = Level − 1 + erste Medaillen (`medalCount`, je Karte und Schwierigkeit eine); `sanitize` setzt zurück, wenn mehr ausgegeben ist.
- **Wirkung:** Sim-Mods in `matchOptions` (`startCash` 100 + 200, `lives` 10 + 15, `t2DiscountBp`, `tempoBp`, `freezeAddTicks`, `marketBp`, `bankRateBp`, `supplyBonus`, `marketRadiusBp`, `marketPriceBp`, `heroXpBp`, `heroStartLevel` 3/5, `powerUses`, `freePowers`). Meta-Wirkungen: Scholar (+10 % Spieler-XP in `applyMatch`/`matchXp(…, extraBp)`), Ember Pouch (+10 % Embers, `MatchReport.embers.pouch`), Bulk Buyer (`powerCost(profile, key)`, `buyPower` zieht den Rabattpreis ab), Starter Kit (ein Gold Drop je Match gratis, vom Inventarabzug ausgenommen). Field Medic fehlt bis Runde 14.
- Tests: `test/r13.test.ts` (Struktur, Punkte, Migration, jede Wirkung, Sim-Kopplung).
