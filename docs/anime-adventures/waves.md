# Waves

> **Stand:** Für **keine** Map konnte eine vollständige Wave-Tabelle (Gegner pro Wave, Anzahl, Spawn-Delay, HP, Reward) aus öffentlichen Quellen gewonnen werden. Wave-Daten sind in AA serverseitig und wurden von der Community nicht tabelliert, oder die Seiten waren nicht abrufbar. Alle Tabellenfelder sind daher **UNKNOWN**.

## Was belegt ist

| Aspekt | Wert | Tag |
|---|---|---|
| Story-Act-Struktur | Waves mit Boss am Ende des Acts; Act 6 = Welt-Endboss | OBSERVED · HIGH · [S07] |
| Infinite | endlos; **Bosse früherer Acts alle 10 Waves** | OBSERVED · HIGH · [S06] |
| Infinite-Scaling | Gegner bekommen pro Wave mehr HP; „ab einer bestimmten Wave steigt die HP signifikant“ | OBSERVED · HIGH (qualitativ) · [S06] |
| Party-Scaling | Gegner-HP steigen mit der Spielerzahl (Story und Infinite) | OBSERVED · HIGH · [S06] |
| Dungeon Cursed Womb | Boss in **Wave 15** | OBSERVED · MEDIUM · [S56] |
| Infinite-Gems | Wave 6: 18 Gems; Waves 7–15: 3; Waves 15–100: 5; ab Wave 105 keine mehr; Maximum 497 | OBSERVED · HIGH · [S06] (Konflikt siehe unten) |
| Infinite-Daily | Wave 10: 90 Gems; Wave 25: 180; Wave 50: 330 (täglich) | OBSERVED · HIGH · [S23] |
| Challenges | modifizieren alle Gegner einer Wave (Tank, Shield, Regen, Fast …) | OBSERVED · HIGH · [S15] |
| Wave-Yen | existiert; Formel UNKNOWN | OBSERVED (Existenz) |
| Farm-Yen | wird **pro Wave** ausgezahlt | OBSERVED · HIGH · [S28, S37] |

### Konflikt: Infinite-Gem-Summe (DERIVED)

`18 + 9×3 (W7–15) + 89×5 (W16–104) = 490` bzw. mit W16–105 `= 495`. Die angegebene Obergrenze ist **497**. Die Bereiche „7–15“ und „15–100“ überlappen in der Quelle, und für W101–104 fehlt eine Angabe. Die Differenz von 2–7 Gems ist ungeklärt → [unknowns.md](unknowns.md).

## Wave-Tabellen-Vorlage (für spätere Befüllung)

| Wave | Enemy | Count | Spawn Delay (s) | HP | Speed | Mods | Reward ¥ | Tag |
|---:|---|---:|---:|---:|---:|---|---:|---|
| 1 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | – | UNKNOWN | UNKNOWN |
| … | | | | | | | | |
| Boss | (Act-Boss) | 1 | – | UNKNOWN | UNKNOWN | Boss | UNKNOWN | UNKNOWN |

Datenstruktur: [technical-reconstruction.md](technical-reconstruction.md#datenmodell).

## Spawn-Logik (Rekonstruktion für den Nachbau)

```text
Wave {
  groups: [ { enemyId, count, interval, startDelay, pathId, mods[] } ]
  bossId?            // Act-Ende bzw. infinite: wave % 10 == 0
  rewardYen          // bei Abschluss
}
WaveManager:
  state ∈ {PREP, SPAWNING, CLEARING, DONE}
  - Wave startet: alle Gruppen spawnen parallel nach startDelay im Takt interval
  - Wave "abgeschlossen": alle Gegner der Wave tot oder geleakt  (AA-Detail UNKNOWN:
    ob die nächste Wave auch per Timer startet, während Gegner leben)
  - Skip Wave: startet nächste Wave sofort (Belohnung/Bonus UNKNOWN)
  - onWaveComplete: payout(waveYen + Σ farmIncome)
```
RECONSTRUCTED · MEDIUM

## Infinite-Generator (DESIGN – kein AA-Wert)

Weil AA-Werte fehlen, folgt ein Vorschlag, der die **qualitativen** Belege respektiert: monoton steigende HP, ein Sprung ab einer Schwelle, Boss alle 10 Waves und Party-Scaling.

```text
hp(w)    = baseHP × g^(w−1) × (w > W_jump ? J : 1) × partyMult(n)
g        = 1.08 … 1.12           // DESIGN
W_jump   = 50, J = 2.0           // DESIGN ("signifikanter Anstieg")
partyMult(n) = 1 + 0.5·(n−1)     // DESIGN
boss     = (w % 10 == 0) ? pickFrom(previousActBosses) : none
```
