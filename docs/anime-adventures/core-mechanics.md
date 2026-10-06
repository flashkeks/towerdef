# Core Tower-Defense-System

> Legende: `ART · CONFIDENCE · [Quelle]` siehe [README](README.md#kennzeichnung). `S72:<Seite>` = Wiki-Volltext, `S65`/`S66`/`S67` = Wiki-Datenmodule (RR / LEGACY / Angriffe+Effekte). Stand Sitzung 2 (P2).

## Ablauf einer Partie

```text
Game Start (Lobby: Stage + Modus + Difficulty wählen, Party bilden)
↓
Map Loading (Teleport in eigenen Match-Server)
↓
Player Setup (Team aus dem Loadout; RR: Team vor Spielstart im Match änderbar)
↓
Initial Resources (Start-Yen pro Spieler)                        ← Wert UNKNOWN
↓
Wave Start (Wave 1; es gibt einen Wave-Timer und einen Skip-Wave-Button)
↓
Enemy Spawn (am Pfadanfang; Story: 1 Pfad, Shibuya/Event-Modifikatoren: mehrere Pfade)
↓
Enemy Movement (folgt festem Pfad zum Ende/Base)
↓
Unit Targeting (Units in Range wählen Ziel nach Targeting-Modus)
↓
Unit Attack (SPA-Takt; Single/AoE; Hits teilen den Damage)
↓
Damage Calculation (Basis × Level × Potential × Trait × (1 + ΣBuffs) × Affinität …)
↓
Status Effects (Burn/Bleed/Poison/Wither DoT, Stun/Freeze/Timestop, Slow, Knockback …)
↓
Enemy Death → Kill-Yen (Kill/Takedown-Zählung je Unit)
↓
Wave Completion → Wave-Yen + Farm-Unit-Einkommen + Healer-Units heilen die Basis
↓
Next Wave … bis letzte Wave (Story/Raid) oder Niederlage (Infinite)
↓
End-of-Game: Victory/Defeat-Screen → Gems, XP, Items, Drops; Rückkehr zur Lobby oder Replay
```
RECONSTRUCTED · HIGH (Reihenfolge) / UNKNOWN (exakte Werte) · [S06, S07, S28, S37, S13 → S72:Effects, S72:Infinite, S72:Update Log, S72:Frequently Asked Questions]

Belege für einzelne Schritte:

| Schritt | Beleg | Tag |
|---|---|---|
| Wave-Timer existiert | Eine Fähigkeit „stoppt alle Gegner-Spawns, den **Wave-Timer** und hält alle Gegner 20 s an“ | OBSERVED · HIGH · [S72:JIO (Over Heaven), S72:Effects] |
| Team vor Start änderbar | „You can now select units and change your team before the game starts“ (RR, Update 19/19.5) | OBSERVED · HIGH · [S72:Update Log] |
| Mehrere Pfade per Modifikator | Event-Modus: „pick options to add new enemy paths for significant increases in rewards“ (Update 19) | OBSERVED · HIGH · [S72:Update Log] |
| Kills vs. Takedowns | Kill = letzter Treffer durch diese Unit; Takedown = Unit hat den Gegner überhaupt getroffen („mob-sharing“). Takedowns sind Evolutions- und Worthiness-Ressource | OBSERVED · HIGH · [S72:Frequently Asked Questions] |
| Healer am Wave-Ende | Healer-Units stellen Basis-HP nach jeder Wave wieder her oder geben Extra-HP | OBSERVED · HIGH · [S72:Effects] |
| Auto-Aktivfähigkeiten | „Active Attacks can be automatically triggered when off cooldown“ (Update 13.5, LEGACY) | OBSERVED · HIGH · [S72:Update Log] |

## Ressourcen im Match: Yen

| Quelle | Beschreibung | Tag |
|---|---|---|
| Kills | Jeder getötete Gegner gibt Yen | OBSERVED · HIGH · [S42] (Sitzung 1 als VERIFIED geführt; im Wiki-Volltext kein Zahlenwert) |
| Wave-Abschluss | Yen pro abgeschlossener Wave | OBSERVED · MEDIUM · [S42] (im Wiki-Volltext nicht beschrieben) |
| Farm-Units | „Generate money after each wave“; feste Yen pro Wave je Upgrade-Stufe (Werte in `data/units.json`, Feld `farm`) | OBSERVED · HIGH · [S72:Effects, S65] |
| Treasure-Thief-Sonderfall | Eine Farm-Unit markiert Gegner beim Spawn mit Gold-Symbol; diese geben beim Kill Geld | OBSERVED · HIGH · [S72:Effects] |
| Golden-Trait | +20 % Yen „each time they make money“ | OBSERVED · HIGH · [S03, S47 → S72:Traits] |
| Start-Yen | **UNKNOWN** (in keiner der 661 Wiki-Seiten genannt) | UNKNOWN |
| Kill-Yen-Formel | **UNKNOWN** (pro Gegnertyp? HP-abhängig?) | UNKNOWN |
| Wave-Yen-Formel | **UNKNOWN**. Indiz: Das Wiki unterscheidet Portale mit „Infinite-Mode-oriented yen distribution“ und „normal yen distribution“, d. h. die Yen-Verteilung über die Waves ist modusabhängig | UNKNOWN (Werte) · OBSERVED · MEDIUM (Existenz) · [S72:Effects (Sunshine)] |

Yen ist **pro Spieler individuell**. Jeder Spieler platziert und upgradet aus seinem eigenen Konto. RECONSTRUCTED · MEDIUM (aus Farm-Unit-Logik und Koop-Design; kein direkter Beleg)

## Platzierung

| Regel | Wert | Tag |
|---|---|---|
| Team-Slots | 6 Units pro Spieler; Slots werden über das Spielerlevel freigeschaltet („Level requirement for unit slots reduced“, Update 14) | OBSERVED · MEDIUM · [S53; S72:Update Log] |
| Spawn Cap | Max. gleichzeitige Platzierungen **pro Unit-Typ**. Verteilung über 534 Units mit Wert: 4 (219), 3 (193), 5 (82), 6 (20), 1 (15), 2 (5). Beispiele: C.E.O. 3, Black Assassin 4 | OBSERVED · HIGH · [S65] / DERIVED (Zählung) |
| Globaler Spawn Cap | 4 Buff-Units (Commander, Wind Dragon, Elfy, Elfy (Sylph)) haben `spawnCapGlobal = true` (Cap 6). Wahrscheinlich gilt der Cap dann über alle Spieler der Partie | OBSERVED · HIGH (Flag) / RECONSTRUCTED · LOW (Bedeutung) · [S65] |
| Globales Unit-Limit pro Spieler | **UNKNOWN** | UNKNOWN |
| Ground-Units | Treffen **keine** Flying-Gegner. 461 von 561 Units | OBSERVED · HIGH · [S39 → S72:Enemy Mechanics, S73 Mechanics, S65] |
| Hill/Air-Units | Platz auf Hügeln (erhöhte Plattformen); treffen Boden **und** Luft. 71 Units | OBSERVED · HIGH · [S39, S73 Mechanics, S65] |
| Hybrid-Units | Treffen Boden und Luft; „can be placed on hill/ground“. 29 Units im Modul als `hybrid`; manche werden erst per Upgrade/Adaption hybrid | OBSERVED · HIGH · [S39, S73 Mechanics, S72:Divine General, S65] |
| Platzierungskosten | „Deployment Cost“ (Stufe 0 in `data/units.json`). Verteilung (553 Units): Median 1.350 ¥, Quartile 1.200 / 1.500 ¥, Ausreißer bis 112.150 ¥ | OBSERVED · HIGH · [S65] / DERIVED |
| Überlappung, Mindestabstand | **UNKNOWN** (Kollisionsradius pro Unit wahrscheinlich, nicht dokumentiert) | UNKNOWN |
| Challenge „High Cost“ | Platzieren und Upgraden ×1,5 | OBSERVED · HIGH · [S15 → S72:Challenges] |
| Challenge „Triple Cost“ | ×3 (nur Demon Academy Portal) | OBSERVED · HIGH · [S15 → S72:Challenges] |
| Challenge „Short Range“ / „Mini Range“ | Range „2/3 shorter“ bzw. „1/4 shorter“ (Wortlaut mehrdeutig); AoE-Größe wird bei Mini Range **nicht** verkleinert | OBSERVED · MEDIUM · [S72:Challenges] |
| Kostenrabatt | Eine Support-Unit (Idol-Linie) gibt Upgrade-Rabatte und hebt seit Update 19.5 High-Cost-Debuffs auf | OBSERVED · HIGH · [S72:Effects, S72:Update Log] |

## Verkaufen (Sell)

| Regel | Wert | Tag |
|---|---|---|
| Sell-Wert (Standard) | **25 %** der Summe aus Deployment-Kosten und bezahlten Upgrades. Von 528 Wiki-Seiten mit Abschnitt „Selling“ nennen 508 25 %, 1 nennt 30 %, 10 „cannot be sold“, 9 sind leer | OBSERVED · CONFIRMED · [S72: Unit-Seiten, Abschnitt „Selling“] / DERIVED (Zählung) |
| Ausnahme 30 % | Nur die Seite **C.E.O.** nennt 30 %. Ob echter Sonderwert oder Seitenfehler: UNKNOWN | OBSERVED · LOW · [S28 → S72:C.E.O.] |
| Unverkäufliche Units | 9 Units im Modul mit `unsellable = true`, u. a. die Farm-Units Bulby und Weather Girl (+ Evo), Lulu (+ Evo), Lyla (+ Evo), Usurper, Spirit Reaper (Final Dusk). Wiki-Seiten bestätigen dies („cannot be sold“); zusätzlich laut Wiki Idol, Idol (Star) und Griffin (Reincarnation) | OBSERVED · HIGH · [S65, S72: jeweilige Unit-Seiten] |
| Sonderfall Opfer-Mechanik | Units, die in eine andere Unit „geopfert“ wurden, werden beim Verkauf der Empfänger-Unit nicht erstattet | OBSERVED · HIGH · [S72:Griffin (Ascension)] |
| Gesperrte Units | „Locked units cannot be sold“ (Inventar-Sperre, Update 3) | OBSERVED · HIGH · [S72:Update Log] |
| Bedienung | Verkaufen per Unit-Overview (Taste F) oder Hotkey X (RR, Update 19.5) | OBSERVED · HIGH · [S72:Update Log] |
| Gold aus Unit-Verkauf | Units **im Inventar** gegen Gold verkaufen (nicht im Match) | OBSERVED · HIGH · [S20] |

`sellValue = floor?(0.25 × (deployCost + Σ paidUpgradeCosts))`. Die Rundung ist **UNKNOWN**. DERIVED aus der Wiki-Regel.

Das alte „Beispiel Oshi“ (Sitzung 1, [S19]) ist durch die Wiki-Liste ersetzt; der Konflikt 25 % vs. 30 % (C5) ist zugunsten von 25 % als Standardregel entschieden.

## Waves

| Aspekt | Wert | Tag |
|---|---|---|
| Wave-Anzahl Story | **UNKNOWN** pro Act (Bosse am Act-Ende). Gegnertypen debütieren laut Wiki u. a. in „Act 4 (Wave 15)“, „Act 2 (Wave 10)“ | UNKNOWN / OBSERVED · MEDIUM · [S72:Enemy Mechanics] |
| Infinite | Endlos, nur Hard; Bosse früherer Acts **alle 10 Waves** | OBSERVED · HIGH · [S06 → S72:Infinite] |
| Infinite-Gems pro Wave | Wave 1–5: 0; Wave 6: 18; Wave 7–15: 3; Wave 15–100: 5 je Wave; ab Wave 105 keine mehr, Maximum 497 | OBSERVED · HIGH · [S72:Infinite] |
| Event-/Portal-Modi | Teils 50 Waves mit Modifikator-Wahl „every few waves“ | OBSERVED · HIGH · [S72:Update Log] |
| Dungeon Cursed Womb | Boss „Finger Bearer“ in **Wave 15** | OBSERVED · MEDIUM · [S56] |
| Skip Wave | Button vorhanden (in Scripts als „Auto Skip Wave“ automatisiert); ob per Abstimmung im Koop: UNKNOWN | OBSERVED · MEDIUM · [S06] |
| Wave-Timer | Existiert (s. o.), Dauer **UNKNOWN** | OBSERVED · HIGH (Existenz) · [S72:Effects] / UNKNOWN (Wert) |
| Spawn-Reihenfolge und -Abstände | **UNKNOWN**. Sonderfall Burst-Gegner: schnell beim Spawn, werden zur Basis hin langsamer | UNKNOWN / OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Pfadlänge (Laufzeit) | Story-Maps: 8–36 s Laufzeit eines Normalgegners vom Spawn bis Pfadende (Stand 2023-12, LEGACY) | OBSERVED · MEDIUM · [S72:Map Lengths] |

Details in [waves.md](waves.md) und [maps.md](maps.md).

## Leaks und Base HP

| Aspekt | Wert | Tag |
|---|---|---|
| Base/Leak-System | Gegner, die das Pfadende erreichen, verursachen Schaden an der Basis; die Partie ist verloren, wenn die Basis-HP auf 0 fallen | RECONSTRUCTED · MEDIUM (Genre-Standard; Existenz von „base HP“ mehrfach belegt) · [S72:Effects, S72:Update Log] |
| Base-HP skaliert | „Adjusted base HP (now scales with level difficulty)“ – **Update 9, 14.01.2023, LEGACY** (nicht RR, wie in Sitzung 1 angenommen) | OBSERVED · HIGH · [S72:Update Log] |
| Base-HP-Wert | **UNKNOWN**. Indiz: Eine Healer-Unit heilte vor Update 9 „25 HP“ pro Wave, danach 3–5 % der Basis-HP pro Wave (stapelt je Unit). Base-HP liegt also in einer Größenordnung, in der 25 HP sinnvoll sind | UNKNOWN / OBSERVED · HIGH (Indiz) · [S72:Blossom, S72:Update Log] |
| Leak-Schaden pro Gegner | **UNKNOWN** (feste Zahl, Boss mehr? oder Rest-HP?) | UNKNOWN |
| Base Protection | Einige Units schützen die Basis für die Effektdauer vor **allem** Schaden | OBSERVED · HIGH · [S72:Effects] |
| Base-HP als Ressource | Eine Unit verbraucht Basis-HP für Angriffe; sie hört auf, wenn zu wenig HP da sind, und senkt die Basis nie auf 0 | OBSERVED · HIGH · [S72:Paragon (Devil)] |
| Heilung über Maximum | Healer können „extra HP to the base“ geben (Overheal) | OBSERVED · MEDIUM · [S72:Effects] |

### Version: Healer-Wirkung

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| LEGACY bis Update 9 (14.01.2023) | Healer +25 HP pro Wave | 3–5 % der Basis-HP pro Wave | 3–5 % (stapelt je Unit) | S72:Blossom, S72:Update Log |

> Für unseren Nachbau: `DESIGN` – Base HP 100; Leak-Schaden = `ceil(enemy.leakDamage)` mit `leakDamage` pro Gegnertyp (normal 1–5, Boss 50–100). Konfigurierbar, siehe [technical-reconstruction.md](technical-reconstruction.md). Healer prozentual (`DESIGN`, angelehnt an AA: 3–5 % pro Wave).

## Sieg und Niederlage

| Modus | Sieg | Niederlage | Tag |
|---|---|---|---|
| Story / Legend / Raid / Portal / Challenge | Alle Waves inkl. Boss überstanden | Base-HP = 0 | RECONSTRUCTED · HIGH |
| Infinite | – (Fortschritt pro Wave) | Base-HP = 0; Gems und Wave-Fortschritt werden automatisch gespeichert (seit Update 3), auch bei Disconnect. Ab Wave 10 gibt es bei Niederlage XP-Items; Verlassen mitten im Lauf gibt Gems, aber kein XP | OBSERVED · HIGH · [S06 → S72:Infinite, S72:Update Log] |
| Secret Portal (Host) | Clear ergibt garantierte Secret Unit für den Host | – | OBSERVED · HIGH · [S10] |

## Difficulty

- Story-Acts haben **Normal** und **Hard**. Hard bringt mehr Belohnung und ist schwieriger. Multiplikatoren: **UNKNOWN**. OBSERVED · MEDIUM · [S07]
- Infinite gibt es **nur auf Hard**. OBSERVED · HIGH · [S06 → S72:Infinite]
- Gegner-HP steigen mit der **Spielerzahl** in der Party (Story und Infinite). Formel: **UNKNOWN**. OBSERVED · HIGH · [S06]
- Base-HP skaliert mit der Level-Schwierigkeit (seit Update 9, LEGACY). OBSERVED · HIGH · [S72:Update Log]
- Challenges als Difficulty-Modifikatoren (Tank, High Cost, Shield, Regen, Short Range, Fast; Portal-only: Hyper-Regen, Flying, Steel-Plated, Godspeed, Mini Range, Triple Cost). Wechsel alle 30 min. Wirkung im Kampf siehe [combat-system.md](combat-system.md#10-gegner-mechaniken-im-kampf). OBSERVED · HIGH · [S72:Challenges]

## Für unseren Nachbau

`DESIGN` (keine AA-Werte):

| Größe | Vorschlag | Begründung |
|---|---|---|
| Start-Yen | 600–1.000 pro Spieler (≈ 1 Platzierung einer günstigen Unit) | Deployment-Median in AA 1.350 ¥, Rare-Units ab 300 ¥ |
| Wave-Yen | linear steigend, z. B. `100 + 25 × wave` | Indiz für modusabhängige „Yen-Verteilung“ in AA |
| Kill-Yen | pro Gegnertyp in den Gegnerdaten | AA-Formel UNKNOWN |
| Wave-Timer | fester Timer pro Wave (z. B. 30–45 s) plus Skip-Button | Existenz in AA belegt, Wert UNKNOWN |
| Sell | 25 % der investierten Yen, abgerundet | AA-Regel (Rundung DESIGN) |
| Base HP / Leak | s. o. | |
