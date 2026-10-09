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
