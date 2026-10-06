# Anime Expeditions - Units

Kein Vollkatalog. Kennzeichnung `Wert [Herkunft/Sicherheit Quelle]`, Quellen in [sources.md](sources.md). Daten stammen aus dem Wiki-Datenmodul `AEOfficial/UnitData/data` (AE-S7); Teilmenge als [data/units.json](data/units.json). Zurück zu [overview.md](overview.md); Kosten-Kontext in [economy.md](economy.md).

Lesehilfe: "Platz." = Kosten des ersten Eintrags (Platzieren), "Max-Summe" = alle Einträge addiert, Damage = Wert der letzten Stufe (ob pro Tick oder pro Attacke: UNKNOWN), Limit = Platzierungs-Limit je Unit.

## Rarity-Verteilung

| Rarity | Gacha-Rate (Standard-/Mini-Banner) | Einheiten im Pool | Weitere Quellen | Kennz. |
|---|---|---|---|---|
| Rare | 74,68 % (12,45 % je Unit) | 6 | Stages (ohne Traits) | [O/HIGH AE-S9], [D/MEDIUM 74,68/12,45 = 6] |
| Epic | 15,06 % (2,51 % je Unit) | 6 | | [O/HIGH AE-S9], [D/MEDIUM 15,06/2,51 = 6] |
| Legendary | 10 % (1,43 % je Unit), Pity 50 | 7 | | [O/HIGH AE-S9], [D/MEDIUM 10/1,43 = 7] |
| Mythic | 0,25 % gesamt, Pity 400; Banner-Mitte 0,125 %, Seiten je 0,0625 % | 3 pro Standard-Banner (rotierend alle 30 min), 1 pro Mini, 8 pro Beginner | Evolution | [O/HIGH AE-S9] |
| Secret | 0,01 % (Standard-Banner), Pity 10 000; auf Mini-Banner nicht erhältlich | wenige | per Evolution oder Secret Portal/Crafting | [O/HIGH AE-S9, AE-S7, AE-S21] |
| Exclusive | nicht im Gacha | wenige (Jester, Kitsune, Toy Maker, Cubert, True Saint, Crimson ...) | Event/Turnier/Quest | [O/HIGH AE-S7] |

Gesamtzahl Units zum Stand Update 1: 43 laut Tier-List-Seite (Update 2 hat weitere) [O/LOW AE-S22].

### Typische Spannen je Rarity (aus 43 Units im Modul, nicht evolviert, ohne Farm)

| Rarity | Anzahl Stichprobe | Platz. | Stufen-Einträge | Max-Summe Yen | Max-Damage | Range max | SPA max-Stufe | Limit |
|---|---|---|---|---|---|---|---|---|
| Rare | 6 | 225-300 | 5 | 3 375-4 250 | 45-63 | 7-14 | 2,3-3,3 | 4 |
| Epic | 5 | 325-400 | 6 | 5 350-6 700 | 125-215 | 14-21 | 2,3-4,5 | 3-4 |
| Legendary | 7 | 600-800 | 6-7 | 9 800-14 250 | 325-515 | 12-25 | 4,5-6,5 | 3-4 |
| Mythic | 8 | 550-1 250 | 7 | 14 550-30 350 | 293-2 358 | 21-28 | 5-9,2 | 2-5 |
| Mythic evolviert | 8 | 550-1 250 | 9-10 | 26 550-57 150 | 518-5 093 | 25-32 | 4,5-10,6 | 2-5 |
| Exclusive | 3+2 evolviert | 900-2 200 | 7-12 | 17 500-53 000 | 592-3 804 | 15-27 | 4,8-7,8 | 1-3 |
| Secret | 12 Einträge im Modul (inkl. Evolutionen: Lightning God, Sovereign, Prodigy, Crow, Shadow, 8th Sword) | 950-2 000 | 7-12 | 26 900-92 800 | 1 108-4 112 | 22-29 | 4-8,4 | 2-3 |

Alle Spannen [D/HIGH AE-S7] (Min/Max aus Modul-Einträgen). Hinweis: Stat-Potenzial (Buchstabennoten) und Trait verschieben diese Basiswerte noch einmal um zweistellige Prozent (siehe [meta.md](meta.md)).

## Archetypen und Beispiel-Units

Der Spielbegriff "Archetype" bezeichnet die Schadensart (Physical, Magical, Psychic); die **Rollen** unten sind unsere Einordnung aus den Passiven [R/MEDIUM AE-S7].

### Single-Target / Boss-DPS

| Unit | Rarity | Platz. | Max-Summe | Max-Damage / SPA / Range | Limit | Besonderheit | Kennz. |
|---|---|---|---|---|---|---|---|
| Greed | Legendary | 650 | 13 800 | 325 / 4,8 / 25 | 3 | +20 % Schaden gegen Boss; Bleed | [O/HIGH AE-S7] |
| Kid Assassin | Rare | 250 | 3 375 | 59 / 2,3 / 12 | 4 | Rare-Starter, 4 Ticks Lightning Slash | [O/HIGH AE-S7] |
| 8th Sword (Berserk) | Secret | 2 000 | 92 800 | 3 794 / 8,4 / 23 | 2 | Aura-Schaden 5 %/s in Reichweite, Berserk-Modus nach 25 Takedowns | [O/HIGH AE-S7, AE-S21] |
| Reaper | Legendary | 700 | 13 850 | 510 / 6,5 / 21 | 3 | Basis-DPS-Stufenleiter | [O/HIGH AE-S7] |

### AoE (Flächenschaden)

| Unit | Rarity | Platz. | Max-Summe | Max-Damage / SPA / Range | Limit | AoE-Form | Kennz. |
|---|---|---|---|---|---|---|---|
| Lady Giant | Mythic | 850 | 15 250 | 1 056 / 6,2 / 27 | 4 | Cone 60 (Shockwave), Circle 10 (Earth Meteor, 4 Ticks); Stone Wall (Pfad-Trap) alle 15 s | [O/HIGH AE-S7] |
| Elf Mage | Mythic | 1 000 | 25 125 | 926 / 9,2 / 21 | 3 | Circle 7 (Reality Drift), Full (Mana Release, Arcane-Spells als Follow-Up: Line, Circle, Full) | [O/HIGH AE-S7] |
| Scissor | Legendary | 600 | 10 550 | 450 / 6,0 / 24 | 3 | Cone 40 (3 Ticks), Line 8; +5 % je Folgetreffer, Cap 20 % | [O/HIGH AE-S7] |
| Demon Cyborg | Epic | 325 | 5 350 | 125 / 3,2 / 16 | 3 | Line 5 (6 Ticks), Circle 5; Burn | [O/HIGH AE-S7] |

### Support / Buffer

| Unit | Rarity | Platz. | Max-Summe | Max-Damage / SPA / Range | Limit | Effekt | Kennz. |
|---|---|---|---|---|---|---|---|
| The Hero | Legendary | 800 | 9 800 | 330 / 4,5 / 12 | 4 | Damage-Aura auf Physical-Units in Reichweite, +5 % je Upgrade | [O/HIGH AE-S7] |
| Kitsune | Exclusive | 1 300 | 48 650 | 2 308 / 5,7 / 26 | 3 | Dreamdiver: -25 % SPA und +25 % Attack-Speed auf die stärkste Unit in Reichweite für 20 s; Showtime-Meter | [O/HIGH AE-S7, AE-S21] |
| Jester | Exclusive | 1 250 | 42 250 | 2 385 / 5,9 / 25 | 2 | Zufallswaffe pro Wave bzw. 20 s (Scythe/Rifle/Mace; Mace spawnt Klon 15 s) | [O/HIGH AE-S7, AE-S21] |

### Debuffer / Crowd Control

| Unit | Rarity | Platz. | Max-Summe | Max-Damage / SPA / Range | Limit | Effekt | Kennz. |
|---|---|---|---|---|---|---|---|
| Puppet | Mythic | 1 150 | 29 150 | 2 358 / 6,3 / 24 | 2 | Puppet Mark alle 15 s auf stärksten Gegner: +20 % erhaltener Schaden, 15 s | [O/HIGH AE-S7] |
| Ice Queen | Legendary | 650 | 13 450 | 330 / 4,9 / 22 | 4 | Freeze (2 s) auf Treffer; +20 % Schaden gegen Gegner unter 20 % HP | [O/HIGH AE-S7] |
| Lightning God | Secret | 1 050 | 30 950 | 1 848 / 6,1 / 24 | 3 | Electricity (Stun 1 s + Kette) auf die 10 stärksten Gegner; Storm Cloud | [O/HIGH AE-S7] |
| Elf Mage / Flame Emperor | Mythic | 550-1 000 | 14 550-25 125 | siehe Datei | 3-5 | Mana Burn bzw. hohe Reichweite (23-28), Limit 5 bei Flame Emperor | [O/HIGH AE-S7] |

### Farm

Siehe [economy.md](economy.md): Stone Alchemist (Epic, Limit 3) und Ramen Guy (Legendary, Limit 1, Selbstkosten 40 000, Verkauf 10 %) [O/HIGH AE-S7].

### Summoner / Pfad-Blocker

| Unit | Rarity | Platz. | Max-Summe | Effekt | Kennz. |
|---|---|---|---|---|---|
| Toy Maker | Exclusive | 2 200 | 48 350 | Greift nicht an, spawnt "Toy" auf allen Pfaden in Reichweite; Toy-HP = 100 % des aktuellen Damage des Maker (3 804 am Ende), geteilt durch Anzahl Pfade; Limit 1 | [O/HIGH AE-S7] |
| Lady Giant | Mythic | 850 | 15 250 | Stone Wall alle 15 s (Kapazität 2) | [O/HIGH AE-S7] |

### Anti-Air und Hidden-Detection

**UNKNOWN / vermutlich nicht vorhanden.** Weder Unit-Daten noch Gegner-Modifier enthalten Flug- oder Stealth-Eigenschaften; nächstliegende Konter-Mechaniken sind "Burrowing" (unzielbar 2 s alle 8 s) und "Bulwark" (3 s Immunität alle 10 s) [O/MEDIUM AE-S5]. Drei Versuche (UnitData, EnemyData, ModifierData) ohne Fund.

## Evolution als Stat-Sprung (Beispiele)

| Basis | Evolution | Max-Damage Basis | Max-Damage evolviert | Max-Summe Basis | Max-Summe evolviert | Kennz. |
|---|---|---|---|---|---|---|
| Elf Mage | Elf Mage (Unleashed) | 926 | 3 000 | 25 125 | 42 650 | [D/HIGH AE-S7] |
| Lady Giant | Lady Giant (Envy) | 1 056 | 2 860 | 15 250 | 30 000 | [D/HIGH AE-S7] |
| Puppet | Puppet (Telekinetic) | 2 358 | 5 093 | 29 150 | 57 150 | [D/HIGH AE-S7] |
| Hollow | Hollow (Blaze) | 479 | 1 388 | 26 400 | 55 150 | [D/HIGH AE-S7] |

Evolution verdoppelt etwa die Gesamt-Upgrade-Kosten (Faktor 1,7-2,1) und macht den Max-Damage 2,2- bis 3,2-fach (Puppet 2,2; Lady Giant 2,7; Hollow 2,9; Elf Mage 3,2). Der Zusatzgewinn kommt vor allem aus 2-3 zusätzlichen Stufen mit einer neuen Attacke [D/HIGH AE-S7].
