# Powers, Embers und Store (Runde 12) — verbindlich für Runde 12

Entscheidung Max (09.10.2026 abends): rechte Leiste mit Reitern, Sonderwährung aus Runden-Belohnungen, Store auf der Hauptseite
mit Verbrauchs-Items (wie Monkey Money + Powers in BTD6). Ideen-Sammlung: `ideen-runde12.md`. Spielertexte Englisch.

## Embers (Sonderwährung, Meta)

| Quelle | Embers |
|---|---:|
| je geschaffter Runde | 1 + ⌊Runde / 5⌋ (R1–20 zusammen 54) |
| Sieg | Easy 20 / Medium 30 / Hard 50 |
| erste Medaille einer Schwierigkeit | +50 |
| Level-Up (Spieler) | +25 |
| Startguthaben (neue **und** bestehende Profile, einmalig) | 100 + 1 Gold Drop + 1 Lantern Bomb |

Volle Medium-Partie mit Sieg ≈ 84 Embers (+50 bei erster Medaille) → etwa 2 Powers je Partie. Embers gibt es auch bei Niederlage
(für die geschafften Runden). Kein Kauf mit echtem Geld (internes Spiel).

## Powers (Verbrauchs-Items)

Im Match aus dem Inventar einsetzen; **je Art höchstens 1 Einsatz pro Runde** (Abklingzeit = bis zum nächsten Rundenstart).
Verbraucht wird nur bei Erfolg. Medaillen zählen trotzdem; das Ergebnis zeigt „Powers used: N“.

| ID | Name | Preis | Einsatz | Wirkung |
|---|---|---:|---|---|
| `goldDrop` | Gold Drop | 40 | Knopf | +500 Gold sofort |
| `lanternBomb` | Lantern Bomb | 30 | Ziel auf der Karte | Explosion Radius 40 px, 20 Schaden (`explosive`) an bis zu 40 Gegnern, Boss 100 |
| `caltrops` | Caltrops | 25 | auf den Weg legen | Haufen auf dem Weg: knackt die nächsten 20 Schichten (je Gegner 1 Schaden, `magic`), dann weg; bleibt höchstens bis Rundenende +1 |
| `frostTrap` | Frost Trap | 30 | auf den Weg legen | friert die nächsten 15 Gegner, die darüberlaufen, 3 s ein (nicht Boss, nicht Emberling), dann weg |
| `timeWarp` | Time Warp | 50 | Knopf | alle Gegner 10 s lang −50 % Tempo (Boss −25 %) |
| `lanternOil` | Lantern Oil | 60 | Knopf | Pop-Cash +25 % für den Rest dieser und die ganze nächste Runde |
| `extraLives` | Extra Lives | 35 | Knopf | +25 Leben |
| `heroBoost` | Hero Boost | 80 | Knopf (Held muss stehen) | Wren +3 Level (max. 20), XP auf die Schwelle gesetzt |
| `instaWarden` | Insta-Warden | 150 | wie Turm platzieren | ein fertig ausgebauter Turm gratis; Variante beim Kauf wählen: Ranger 2-0-3, Bombardier 3-0-1, Frostcaller 0-2-3. Zählt nicht gegen Turm-XP-Sperren (BTD6 Insta Monkey). Verkaufswert 0 |

`instaWarden` liegt im Inventar je Variante getrennt (`instaWarden:ranger` …).

## Sim (deterministisch, replaybar)

- `GameOptions.powers?: Record<PowerKey, number>` (Inventar beim Start). `state.powers` (Restbestand), `state.powerUsedRound`
  (je Art die Runde des letzten Einsatzes), `state.traps: { id, kind: 'caltrops'|'frostTrap', progress, x, y, charges }[]`.
- Befehl `{ type: 'power'; power: PowerKey; x?: number; y?: number }`. Gründe: `no-power`, `used-this-round`, `not-on-path`
  (Fallen: Abstand zur Wegmitte ≤ `pathHalfWidth`), `no-hero`, `invalid-target`, sonst die Platzier-Gründe (Insta).
- Events `power { power, x?, y? }`, `trap { id, kind, charges }` (Ladung verbraucht), `trapGone`.
- Ergebnis: `state.stats.powersUsed: Record<PowerKey, number>`.
- **Wellen-Vorschau:** `game.roundPreview(r)` → `{ round, groups: { type, n, camo }[], rbe, hasCamo, hasArmor, hasEmber, hasBoss }`.

## Meta

- Profil: `embers`, `inventory: Record<PowerKey, number>`, einmaliges Startpaket (Flag). Migration für bestehende 11er-Profile
  (nichts zurücksetzen).
- `buyPower(profile, key)` (Preis aus Daten), Embers aus dem Match-Ergebnis (idempotent je Match-ID), Inventar minus
  `powersUsed`.
- `matchOptions` liefert `powers` (Inventar).

## Client

- **Rechte Leiste mit Reitern** oben: **Towers** (wie heute) · **Powers** (Inventar mit Anzahl, Klick → einsetzen bzw. Ziel wählen
  mit Vorschau-Kreis/Weg-Markierung, „used this round“ ausgegraut) · **Wave** (Vorschau der nächsten Runde: Gegner-Sprites mit
  Anzahl, Warn-Symbole Camo/Panzer/Ember/Boss, RBE). Tasten: Tab wechselt Reiter.
- **Store** auf der Hauptseite (neuer Knopf „Store“): Pixel-Laden mit Händler-Figur, Karten je Power mit Pixel-Icon, Preis, Anzahl im
  Besitz, Kaufen mit Ton/Effekt; Embers-Anzeige oben auf der Startseite und im Store. Ergebnis-Bildschirm zeigt verdiente Embers.
- Pixel-Art für alle Powers: Icons 16 × 16 (×3), Fallen auf dem Weg (Krähenfüße, Eiskristall), Effekte (Bombe, Zeitblase,
  Goldregen, Öl-Schimmer, Herz +25, Held-Aufstieg). Palette wie immer.

## Umsetzung Runde 12 (Paket A, Sim + Meta) — Abweichungen und Präzisierungen

Die Namen oben gelten unverändert. Konkretisiert beziehungsweise ergänzt:

**Sim**
- `PowerKey` = `goldDrop | lanternBomb | caltrops | frostTrap | timeWarp | lanternOil | extraLives | heroBoost | instaWarden:ranger | instaWarden:bombardier | instaWarden:frostcaller`. Export `POWER_KEYS` (Anzeigereihenfolge = `DATA.powerOrder`).
- `DATA.powers[key]` = `{ name, desc (Englisch), price (Embers), use: 'button' | 'target' | 'path' | 'place', params, tower?, tiers? }`. `use` sagt dem Client, wie eingesetzt wird: `button` (Knopf), `target` (Lantern Bomb: Ziel auf der Karte), `path` (Fallen: nur auf den Weg), `place` (Insta-Warden: wie ein Turm). Zahlen in `params` (z. B. `lanternBomb.radiusPx = 40`).
- `state.powerUsedRound[key]` = Runde (`state.round`) des letzten Einsatzes, **-1 = nie**. Gesperrt, solange der Wert `state.round` entspricht; Runde 0 (vor dem ersten Start) zählt auch als Runde. "Art" = `PowerKey`, die drei Insta-Warden-Varianten sperren sich also nicht gegenseitig.
- Zusätzlich zu den Gründen aus der Tabelle: `unknown-power` (Schlüssel ungültig), `maxed` (Hero Boost bei Level 20, nichts verbraucht). `invalid-target` auch bei fehlenden Koordinaten und bei Lantern Bomb außerhalb der Karte. Reihenfolge: `unknown-power`, `no-power`, `used-this-round`, `no-hero`/`maxed`, `invalid-target`, `not-on-path` bzw. Platziergründe.
- Insta-Warden: Platziergründe ohne `no-cash` (`out-of-bounds`, `on-path`, `water`, `blocked`, `overlap`, `locked` = Turmtyp im Profil gesperrt, `unknown-tower`). Die Stufen-Sperren (`maxTier`) ignoriert er, `state.maxTier` bleibt unverändert. Weitere Ausbauten gelten wie bei jedem Turm.
- Fallen: `state.traps[i]` hat zusätzlich `until` (Innenleben, Runde, an deren Ende die Falle verschwindet; 0 = nie). Caltrops: `until = state.round + 1` beim Legen, also gelegt in der Bauphase nach Runde r hält die Falle bis Ende von Runde r+1; Frost Trap hat kein Zeitlimit. Ladung wird je Gegner abgezogen, der die Falle **überläuft** (Wegfortschritt von vor nach hinter die Falle im selben Tick); Kinder, die an der Stelle entstehen, an der der Elter die Falle schon passiert hat, lösen sie nicht erneut aus. Frost Trap lässt Boss, Emberling und schon Eingefrorene durch (keine Ladung verbraucht). Falle liegt immer auf der Wegmitte (x/y werden auf den Weg gerastet).
- Events: `trap { id, kind, charges }` je Ladung (Rest nach Abzug); `trapGone { id, kind, reason: 'spent' | 'expired' }`; `power { power, x?, y? }` (bei Fallen die gerasterte Position). Lantern Bomb sendet zusätzlich `explode` (`kind: 'bomb'`, `radius: 40000`), Hero Boost je Stufe `heroLevel`, Insta-Warden ein normales `place`. Gold Drop, Extra Lives, Time Warp, Lantern Oil senden nur `power`.
- Time Warp: global, wirkt auch auf Gegner, die in den 10 s erst entstehen; multiplikativ zu anderen Verlangsamungen (`state.warpLeft` Restticks).
- Lantern Oil: Pop-Cash +25 % mit Bruchrest (`state.oilCarry`), sonst gäbe es bei 2 Gold je Schicht nie einen Aufschlag. Aktiv, solange `state.round <= state.oilRound`; `oilRound = state.round + 1` beim Einsatz. Nur Pop-Cash, nicht Rundenbonus.
- Lantern Bomb: Quelle ohne Turm, die Pops zählen für keinen Turm (kein Turm-XP, kein Held-XP).
- Zusatz-API für den Client: `game.canUsePower(power, x?, y?)` (Trockenlauf, gleiche Gründe wie `apply`, ändert nichts, für Geist/Vorschau-Kreis); `game.roundPreview(r)` liefert `null` außerhalb 1..20; `hasArmor`/`hasEmber` zählen auch Nachkommen (Brute -> Ironshell + Emberling); gleiche Typ/Camo-Gruppen sind zusammengefasst; `rbe` mit Boss-HP der Schwierigkeit.

**Meta**
- Profil-Schema bleibt **11** (neue Felder mit Standardwert, kein Reset): `embers`, `inventory` (alle 11 Schlüssel), `starterPack` (Flag). Das Startpaket wird in `sanitize` (also beim Laden und beim Import) vergeben, wenn das Flag fehlt; neue Profile haben es schon.
- `MatchResult.powersUsed?: Record<PowerKey, number>` (= `state.stats.powersUsed`), `roundsCleared`, `won`, `difficulty` wie bisher. Embers: Runden 1..min(roundsCleared, 20) (Freeplay-Runden zählen nicht), Sieg, `newMedal` (erste Medaille dieser Schwierigkeit auf der Karte), Level-Ups je +25. `MatchReport` trägt `embersGained`, `embers { rounds, win, medal, levelUp }` und `powersUsed` (Summe, für "Powers used: N").
- `buyPower(profile, key, count = 1)` -> `{ ok, profile, cost }` oder `Fail` (`unknown-power`, `bad-count`, `not-enough-embers`). `matchOptions(profile).powers` = Kopie des Inventars.
- Der Client muss ein Match, das in Runde 0 verlassen wird, wie bisher nicht verbuchen (dann bleibt auch das Inventar).
