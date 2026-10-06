# Anime Expeditions - Mechanik

Kennzeichnung `Wert [Herkunft/Sicherheit Quelle]`, Quellen in [sources.md](sources.md). Zurück zu [overview.md](overview.md).

## Platzierung

| Aspekt | Regel | Kennzeichnung |
|---|---|---|
| Platzierungstypen | `Ground`, `Hill`, `Hybrid` (Feld PlacementType je Unit). Beispiel: Elf Mage = Hill, Elf Mage (Unleashed) = Hybrid, die meisten Units = Ground. Luft-Platzierung: kein Beleg | [O/HIGH AE-S7] |
| Raster oder frei | UNKNOWN (kein Beleg in Daten oder Wiki; Pfad-Summons wie "Toy" spawnen auf allen Pfaden in Reichweite) | [U/UNKNOWN] |
| Limit je Unit | `PlacementLimit` pro Unit, beobachtet 1 bis 5. Typisch: Rare/Epic/Legendary 3-4, Mythic 2-3 (Puppet 2, Vegetable 2, Dark Mage 2), Farm 1 (Ramen Guy) bzw. 3 (Stone Alchemist), Flame Emperor 5, Toy Maker (Exclusive) 1 | [O/HIGH AE-S7] |
| Gesamtlimit Story/Raid | UNKNOWN. Star Missions "Win with only 5 units placed" / "only 3 units placed" lassen ein höheres Gesamtlimit oder gar keines vermuten | [U/UNKNOWN AE-S3] |
| Gesamtlimit Expedition | 14 Units geteilt (bis 4 Spieler), und dort 1 Platzierung je Unit | [O/HIGH AE-S13] |
| Team-Größe (Loadout) | UNKNOWN | [U/UNKNOWN] |
| Hill-Units | Hybrid-Units können vermutlich Boden und Hügel nutzen (Name), Regel nicht ausdrücklich belegt | [R/LOW AE-S7] |
| Verschieben/Verkaufen | Sell mit Multiplikator; Ramen Guy: 10 % ("Capital Lock"). Standardwert UNKNOWN | [O/HIGH AE-S7] |

## Targeting

Die Daten nennen **keine** wählbaren Targeting-Modi. Belegte Zielregeln aus Passiven:

| Regel | Beleg |
|---|---|
| "strongest enemy in this unit's range" (Puppet-Mark, Djinn-Strike, Kitsune "strongest unit") | [O/HIGH AE-S7, AE-S21] |
| "10 strongest enemies" (Lightning God: Electricity auf die 10 stärksten) | [O/HIGH AE-S7] |
| "random enemy within range" (Storm Cloud) | [O/HIGH AE-S7] |
| Auto-Ziel Boss (Sovereign Djinn: "auto targets the Boss") | [O/MEDIUM AE-S21] |
| Wählbare Modi (First/Last/Strongest/Closest) und deren Regeln | [U/UNKNOWN] (drei Versuche: Wiki-Seiten Mechanics/Rules/Gamemodes enthalten nichts) |

## Angriffszyklus und Treffer

Jede Attacke ("Skill") hat in `SkillInfo` folgende Felder [O/HIGH AE-S7]:

| Feld | Bedeutung (abgeleitet aus Namen) | Beispielwerte |
|---|---|---|
| DelayBeforeAttack | Windup bis zum ersten Treffer | 0,2 s (Rapid Fire) bis 2,87 s (Greed: Ruthless Prey) |
| Ticks | Anzahl Treffer pro Attacke (Multi-Hit) | 1 bis 7 |
| DelayBetweenTicks | Abstand der Ticks (Zahl oder Liste je Tick) | 0,05 bis 1 s |
| DelayAfterAttack | Nachlauf | 0,5 bis 2 s |
| AttackSpeed | Animationsgeschwindigkeits-Faktor | 1 bis 1,5 |
| HitboxType | `Circle`, `Line`, `Cone`, `Full` (ganze Reichweite) | |
| HitboxSize | Radius bzw. Länge bzw. Kegelwinkel | Circle 3-10, Line 5-8, Cone 40-60 |

- Neue Attacken werden durch Upgrade-Stufen freigeschaltet (Feld `Attack` in einer Stufe), z. B. Elf Mage: Reality Drift (Stufe 1), Mana Release (Stufe 6) [O/HIGH AE-S7].
- `SPA` pro Stufe ist der Cooldown-Wert, der in der UI steht (z. B. 6,5 s). Wie SPA mit Delay-Feldern zusammenspielt (additiv oder umfassend): UNKNOWN [U/UNKNOWN].
- Treffer-Bestimmung: Hitbox am Ziel bzw. in Richtung Ziel; Gegner im Bereich werden getroffen. Pierce/Kollision im Detail UNKNOWN. Burrowing-Gegner sind für 2 s unzielbar [O/HIGH AE-S5].

## Schaden, Resistenzen, Crits

| Aspekt | Wert | Kennzeichnung |
|---|---|---|
| Schadensformel | Modul `AEOfficial/DamageCalculator` ist im Wiki leer (nur Lizenzzeile). UNKNOWN | [U/UNKNOWN AE-S26] |
| Schadensarten | Archetypen Physical, Magical, Psychic; Elemente Neutral, Flame, Hydro, Terra, Gale, Storm, Light, Dark, Farm | [O/HIGH AE-S6] |
| Element-Resistenz in Stages | Mastery-Stage-Effekte: eine Element-Resistenz 0,5x und ein Element-Verwundbarkeit 1,5x je Map (z. B. School Grounds: Flame 0,5x, Dark 1,5x; Flower Forest: Hydro 0,5x, Flame 1,5x; Rose Kingdom: Dark 0,5x, Neutral 1,5x; Fairy King Forest: Storm 0,5x, Terra 1,5x; King's Tomb: Terra 0,5x, Storm 1,5x) | [O/HIGH AE-S3] |
| Resistance-Modifier | Resistenzen rotieren alle 30 s: Flame, Hydro, Gale, Terra, Light, Storm, Dark | [O/HIGH AE-S5] |
| Mirror-Modifier | Gegner kopieren die Elemente aller platzierten Units als Resistenzen | [O/HIGH AE-S5] |
| Gegner-Schadensminderung | Reinforced -30 % von allem; Armored -33 % von Full-AoE; Corruption +50 % erhaltener Schaden | [O/HIGH AE-S5] |
| Crits | Basis-Chance/-Schaden UNKNOWN. Traits: Precision 1 (+10 % Chance, +5 % Crit-DMG), Precision 2 (+20 %, +10 %), Forsaken (+35 %, +35 %) | [O/HIGH AE-S10] |
| Boss-Bonus | Greed: +20 % Schaden gegen Boss-Typ; Soul Rend (Ice Queen): +20 % gegen Gegner unter 20 % HP | [O/HIGH AE-S7] |

## Statuseffekte (Datenmodul MechanicData)

| Effekt | Typ | Stärke / Dauer | Stacking/Cooldown | Kennz. |
|---|---|---|---|---|
| Stun | Hard CC | 2 s, verhindert Aktionen und Bewegung | Cooldown 5 s | [O/HIGH AE-S6] |
| Freeze | Hard CC | 2 s, wie Stun | Cooldown 5 s | [O/HIGH AE-S6] |
| Slow | Soft CC | SpeedScaling 0,5, 5 s | Cooldown 5 s | [O/HIGH AE-S6] |
| Sandstorm | Soft CC | SpeedScaling 0,2 (Text: "-0,2"), 5 s | Cooldown 5 s | [O/MEDIUM AE-S6] |
| Dismembered | Soft CC | dauerhaft Speed 0,85x | permanent | [O/HIGH AE-S6] |
| Stagger | Soft CC | 2 s, 4 Ticks à 0,5 s | Cooldown 5 s | [O/HIGH AE-S6] |
| Rewind | Hard CC | schiebt 3 s rückwärts entlang des Pfads | ApplyCap 10, CD 10 s | [O/HIGH AE-S6] |
| Shadow Rewind | Hard CC | teleportiert Richtung Gegner-Basis | ApplyCap 2, CD 1 s | [O/HIGH AE-S6] |
| Electricity | Hard CC | Stun 1 s, Kettenblitz auf bis zu 3 Gegner à 0,15x Schaden | CD 0 | [O/HIGH AE-S6] |
| Burn | DoT | Scaling-Feld 1, 4 Ticks über 4 s (Text sagt 0,5x) - Widerspruch im Modul | | [O/LOW AE-S6] |
| Bleed | DoT | 0,65x Schaden, 6 Ticks über 6 s | | [O/HIGH AE-S6] |
| Austere Flames | DoT | 0,75x, 4 Ticks über 4 s | | [O/HIGH AE-S6] |
| Mana Burn | DoT | 0,5x, 8 Ticks über 8 s | | [O/HIGH AE-S6] |
| Poison | DoT | 0,3x, 6 Ticks über 6 s, zusätzlich 0,5x pro Tick | | [O/MEDIUM AE-S6] |
| Black Fire | DoT | 2x, 12 Ticks über 12 s | | [O/HIGH AE-S6] |
| Puppet Mark | Mark | +20 % erhaltener Schaden | ApplyCap 3, CD 10 s | [O/HIGH AE-S6] |
| The Drink Mark | Mark | +10 % Follow-Up-Schaden und 10 % Physical-Schwäche | CD 10 s | [O/HIGH AE-S6] |
| Bio Gel | Mark | Slow 60 %, bei Ablauf Stun 3 s | 5 s, CD 10 s | [O/HIGH AE-S6] |
| Crimson Mark | Mark | explodiert nach 5 s mit 15 % des aktuellen Schadens | CD 10 s | [O/HIGH AE-S6] |
| Illusion | Mark | speichert Schaden, danach 0,25x in 2 Range | CD 10 s | [O/HIGH AE-S6] |

Allgemein: Cleanse entfernt Debuffs; "Cooldown" im Modul = Sperrzeit bis zur Wiederanwendung (Anti-Chain-CC). Gegner-Immunität: Modifier "Immunity" gegen alle Soft/Hard-CC [O/HIGH AE-S5].

## Fähigkeiten und Buffs

- **Passiv**: jede Unit hat 0-3 Passive in Textform (Meter, Marken, Aura) [O/HIGH AE-S7].
- **Aktiv**: Feld `Abilities` (z. B. "Stormseeker" bei Lightning God: Position für Storm Cloud wählen) [O/HIGH AE-S7]. Cooldowns der aktiven Fähigkeiten: UNKNOWN.
- **Meter**: Voltage Meter (max 60, +5 % Electricity-Schaden je Punkt), Rock (max 4), Arcane Magic (max 10 laut Modul bzw. 7 laut Passivtext), Frostbite (max 20), Black Magic (max 100) [O/HIGH AE-S6, AE-S7].
- **Aura**: The Hero "Hero Blessing" = Damage-Buff für alle Physical-Units in Reichweite, +5 % pro Upgrade; Cap UNKNOWN [O/HIGH AE-S7].
- **Follow-Up Attacks**: eigener Schadens-Typ, getriggert durch Fähigkeiten (z. B. String Demon: Units mit String führen 100 % Follow-Up aus; String bricht, 15 s Sperre) [O/HIGH AE-S6, AE-S7].
- **Summons/Klone**: Path-Summons (Toy: Gesundheit = 100 % des aktuellen Damage des Toy Maker), Path-Traps (Stone Wall 15 s Intervall, Kapazität 2, HP = 75 %/50 % des Damage), Unit-Klone [O/HIGH AE-S6, AE-S7].
- **Raid Totems**: je Totem +0,10x Schaden im jeweiligen Raid, max 10 Totems (x2) [O/HIGH AE-S15].

## Upgrade-Struktur

- Eine Unit hat 5-12 Stufen (`UpgradeInfo`-Einträge): Rare 5, Epic 6, Legendary 6-7, Mythic 7-10, Evolved/Secret 9-12 [O/HIGH AE-S7].
- **Der erste Eintrag trägt die Kosten des Platzierens** (Stufe 0, enthält `Attack` und Basiswerte); jede weitere Stufe ist ein Upgrade. Das ist eine Lesart des Moduls (Ramen Guy: Eintrag 1 mit `SellMultiplier`, Kosten 750 und 425 Farm) [R/MEDIUM AE-S7].
- Pro Stufe steigen Damage, Range, SPA fällt in der Regel; neue Attacke an festen Stufen (typisch alle 2-3 Stufen) [O/HIGH AE-S7].
- Kein Pfad-System (kein Branching): lineare Stufenleiter. Stufen-Sprung bei Attackenwechsel ist groß (Elf Mage: Damage 526 auf 886 bei Wechsel auf Mana Release, SPA 6,0 auf 9,5) [O/HIGH AE-S7].
- **Evolution**: eigene Unit-Variante (z. B. "Elf Mage (Unleashed)") mit eigener, längerer Upgrade-Leiter; siehe [meta.md](meta.md) [O/HIGH AE-S7, AE-S16].
- Match-Beschränkungen als Modifier: "Upgrade Cap" (nur 25 Upgrades über alle Units), "No Anvils", "No Repair", "No Research Tree", "No Tomes", "Traitless", "Short Range" (-25 % Range), "Speedy" (+50 % Gegnergeschwindigkeit), "Shielded" (alle Gegner 10 Shield), "Cards Disabled" [O/HIGH AE-S5]. Hinweis: Anvils, Repair Hammer, Research Tree, Cards (Blood Money, Bounty Hunter) und Tomes existieren als Systeme, Details UNKNOWN.
