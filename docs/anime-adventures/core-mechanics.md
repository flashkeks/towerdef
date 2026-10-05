# Core Tower-Defense-System

## Ablauf einer Partie

```text
Game Start (Lobby: Stage + Modus + Difficulty wählen, Party bilden)
↓
Map Loading (Teleport in eigenen Match-Server)
↓
Player Setup (Team = bis zu 6 Units; jeder Spieler hat eigenes Team)
↓
Initial Resources (Start-Yen pro Spieler)                        ← Wert UNKNOWN
↓
Wave Start (Wave 1; Skip-Wave-Button vorhanden)
↓
Enemy Spawn (am Pfadanfang; Story: 1 Pfad, Shibuya: 2 Pfade)
↓
Enemy Movement (folgt festem Pfad zum Ende/Base)
↓
Unit Targeting (Units in Range wählen Ziel nach Targeting-Modus)
↓
Unit Attack (SPA-Takt; Single/AoE)
↓
Damage Calculation (Basis × Level × Potential × Trait × Buffs × Affinität …)
↓
Status Effects (Burn/Bleed/Poison DoT, Stun/Freeze/Timestop, Slow, Knockback …)
↓
Enemy Death → Kill-Yen
↓
Wave Completion → Wave-Yen + Farm-Unit-Einkommen (pro Wave)
↓
Next Wave … bis letzte Wave (Story/Raid) oder Niederlage (Infinite)
↓
End-of-Game: Victory/Defeat-Screen → Gems, XP, Items, Drops; Rückkehr zur Lobby oder Replay
```
RECONSTRUCTED · HIGH (Reihenfolge) / UNKNOWN (exakte Werte) · [S06, S07, S28, S37, S13]

## Ressourcen im Match: Yen

| Quelle | Beschreibung | Tag |
|---|---|---|
| Kills | Jeder getötete Gegner gibt Yen | VERIFIED · CONFIRMED · [S42] |
| Wave-Abschluss | Yen pro abgeschlossener Wave | VERIFIED · CONFIRMED · [S42] |
| Farm-Units | Feste Yen pro Wave je Upgrade-Stufe (z. B. C.E.O. 200 bis 2.500, Bulby 250 bis 10.000) | OBSERVED · HIGH · [S28, S37] |
| Golden-Trait | +20 % Yen der Unit | OBSERVED · HIGH · [S03, S47] |
| Start-Yen | **UNKNOWN** | UNKNOWN |
| Kill-Yen-Formel | **UNKNOWN** (pro Gegnertyp? HP-abhängig?) | UNKNOWN |
| Wave-Yen-Formel | **UNKNOWN** | UNKNOWN |

Yen ist **pro Spieler individuell**. Jeder Spieler platziert und upgradet aus seinem eigenen Konto. RECONSTRUCTED · MEDIUM (aus Farm-Unit-Logik und Koop-Design; kein direkter Beleg)

## Platzierung

| Regel | Wert | Tag |
|---|---|---|
| Team-Slots | 6 Units pro Spieler | OBSERVED · HIGH · [S53, Community-Konsens] |
| Spawn Cap | Max. gleichzeitige Platzierungen **pro Unit-Typ**, typisch 1–5 (C.E.O. 3, Black Assassin 4) | OBSERVED · HIGH · [S28, S36] |
| Globales Unit-Limit pro Spieler | **UNKNOWN** | UNKNOWN |
| Ground-Units | Nur auf Bodenflächen (in Pfadnähe) platzierbar; treffen **keine** Flying-Gegner | OBSERVED · HIGH · [S39] |
| Hill/Air-Units | Nur auf Hügeln (erhöhte Plattformen); treffen Boden **und** Luft | OBSERVED · HIGH · [S39] |
| Hybrid-Units | Treffen Boden und Luft. Meist erst durch ein Upgrade hybrid, einige schon beim Platzieren | OBSERVED · HIGH · [S39] |
| Platzierungskosten | „Deployment Cost“ pro Unit, z. B. 300 ¥ (Rare) bis 1.750 ¥ | OBSERVED · HIGH · [S29, S34] |
| Überlappung, Mindestabstand | **UNKNOWN** (Kollisionsradius pro Unit wahrscheinlich, nicht dokumentiert) | UNKNOWN |
| Challenge „High Cost“ | Platzieren und Upgraden ×1,5 | OBSERVED · HIGH · [S15] |
| Challenge „Triple Cost“ | ×3 (nur Demon Academy Portal) | OBSERVED · HIGH · [S15] |

## Verkaufen (Sell)

| Regel | Wert | Tag |
|---|---|---|
| Sell-Wert | **25 %** oder **30 %** von (Deployment + bezahlte Upgrades), je nach Unit | OBSERVED · MEDIUM · [S28 (30 %), S29, S31 (25 %)] |
| Unverkäufliche Units | Manche Units sind nach dem Platzieren nicht verkaufbar (Beispiel „Oshi“) | OBSERVED · MEDIUM · [S19] |
| Gold aus Unit-Verkauf | Units **im Inventar** gegen Gold verkaufen (nicht im Match) | OBSERVED · HIGH · [S20] |

Ob 25 % bzw. 30 % von der Rarität oder von der einzelnen Unit abhängt, ist **UNKNOWN**. Siehe [unknowns.md](unknowns.md).

## Waves

| Aspekt | Wert | Tag |
|---|---|---|
| Wave-Anzahl Story | **UNKNOWN** pro Act (Bosse am Act-Ende) | UNKNOWN |
| Infinite | Endlos; Bosse früherer Acts **alle 10 Waves** | OBSERVED · HIGH · [S06] |
| Dungeon Cursed Womb | Boss „Finger Bearer“ in **Wave 15** | OBSERVED · MEDIUM · [S56] |
| Skip Wave | Button vorhanden (in Scripts als „Auto Skip Wave“ automatisiert); ob per Abstimmung im Koop: UNKNOWN | OBSERVED · MEDIUM |
| Wave-Timer | **UNKNOWN** | UNKNOWN |
| Spawn-Reihenfolge und -Abstände | **UNKNOWN** | UNKNOWN |

Details in [waves.md](waves.md).

## Leaks und Base HP

| Aspekt | Wert | Tag |
|---|---|---|
| Base/Leak-System | Gegner, die das Pfadende erreichen, verursachen Schaden an der Basis; die Partie ist verloren, wenn die Basis-HP auf 0 fallen | RECONSTRUCTED · MEDIUM (Genre-Standard; RR-Patchnotes erwähnen „Base HP skaliert jetzt mit Level-Schwierigkeit“) |
| Base-HP-Wert | **UNKNOWN** | UNKNOWN |
| Leak-Schaden pro Gegner | **UNKNOWN** (feste Zahl, Boss mehr? oder Rest-HP?) | UNKNOWN |

> Für unseren Nachbau: `DESIGN` – Base HP 100; Leak-Schaden = `ceil(enemy.leakDamage)` mit `leakDamage` pro Gegnertyp (normal 1–5, Boss 50–100). Konfigurierbar, siehe [technical-reconstruction.md](technical-reconstruction.md).

## Sieg und Niederlage

| Modus | Sieg | Niederlage | Tag |
|---|---|---|---|
| Story / Legend / Raid / Portal / Challenge | Alle Waves inkl. Boss überstanden | Base-HP = 0 | RECONSTRUCTED · HIGH |
| Infinite | – (Fortschritt pro Wave) | Base-HP = 0; Gems und Wave-Fortschritt werden automatisch gespeichert | OBSERVED · HIGH · [S06] |
| Secret Portal (Host) | Clear ergibt garantierte Secret Unit für den Host | – | OBSERVED · HIGH · [S10] |

## Difficulty

- Story-Acts haben **Normal** und **Hard**. Hard bringt mehr Belohnung und ist schwieriger. Multiplikatoren: **UNKNOWN**. OBSERVED · MEDIUM · [S07]
- Infinite gibt es **nur auf Hard**. OBSERVED · HIGH · [S06]
- Gegner-HP steigen mit der **Spielerzahl** in der Party (Story und Infinite). Formel: **UNKNOWN**. OBSERVED · HIGH · [S06]
- RR: Base HP skaliert mit Level-Schwierigkeit. OBSERVED · LOW · [Suchauszug zu Update-Log]
