# Anime Vanguards (AV) - Überblick

Kennzeichnung: `Wert [Herkunft/Sicherheit Quelle]`, siehe [sources.md](sources.md). Stand der Abrufe: 2026-10-06.

## Stammdaten

| Feld | Wert | Tag |
|---|---|---|
| Name (laut API, Untertitel wechselt je Update) | Anime Vanguards: Wrathful Assault | V/CONFIRMED AV-S1 |
| Entwickler | Kitawari (Roblox-Gruppe, ID 17219742) | V/CONFIRMED AV-S1 |
| Plattform | Roblox (Einzelplattformen nicht geprüft) | V/CONFIRMED AV-S1 |
| Universe-ID / Root-Place | 5578556129 / 16146832113 | V/CONFIRMED AV-S1 |
| Erstellt | 2024-01-28 | V/CONFIRMED AV-S1 |
| Letztes Update laut API | 2026-10-05 | V/CONFIRMED AV-S1 |
| Status | aktiv (Updates laufen, Event "Extermination 14.0" erwähnt im Wiki) | V/HIGH AV-S1, AV-S24 |
| Besuche | 2 059 602 017 | V/CONFIRMED AV-S1 |
| Gleichzeitige Spieler (CCU) | 20 544 (Abruf 2026-10-06) | V/CONFIRMED AV-S1 |
| Favoriten | 1 997 592 | V/CONFIRMED AV-S1 |
| max. Spieler je Server | 24 | V/CONFIRMED AV-S1 |
| Genre laut Roblox | Strategy / Tower Defense | V/CONFIRMED AV-S1 |
| Startbasis | Wiki nennt "Release (0.0)", Updates in 0.5er-Schritten bis mindestens 14.0 | O/MEDIUM AV-S17 |

## Core Loop (5 Sätze)

1. Der Spieler beschwört (Gacha, Währung Gems) Einheiten und stellt ein Team von bis zu 6 Slots zusammen [O/MEDIUM AV-S6, AV-S16].
2. In einer Story-Stage, einem Infinite-/Dungeon-/Raid-Match platziert er Einheiten auf Boden-Pfadkarten, bezahlt mit Match-Geld (Yen) und upgradet sie.
3. Wellen laufen entlang eines Pfades, Bosse tauchen pro Act auf (Story: 6 Acts je Stage, Normal und Nightmare) [O/HIGH AV-S13].
4. Belohnungen (Gems, Gold, Evolutionsmaterial, Trait Rerolls, Stat Chips, Unit-XP-Futter) fließen in Meta-Progression: Level, Evolution, Traits, Stat-Potential.
5. Bessere Einheiten und Rolls erschließen härtere Modi (Legend Stages, Dungeons, Elemental Towers, Raids, Odyssey), die wiederum die Rolls als Belohnung liefern.

## Was AV einzigartig macht

- **Trait-System mit Platzierungslimit als Trade-off:** Monarch = +300 % Schaden, aber nur eine Platzierung. Der Gewinn skaliert invers mit dem Limit der Einheit (siehe [meta.md](meta.md)) [O/HIGH AV-S7, AV-S8].
- **Fünf Ebenen individueller Einheiten-Stärke:** Rarity, Evolution, Trait, Stat-Rang (D bis Godly, getrennt für Schaden/SPA/Range), Level. Dazu Shiny/Serialized als Variante.
- **Riesige Einheitenmenge mit Kit-Mechaniken** (Meter, Stacks, Ketten, Repulse-Tiers, Unit-Gruppen-Buffs) statt reinem Stat-Vergleich [O/HIGH AV-S11].
- **Modifier-Karten** (Dungeons, Odyssey, Challenges) als Rogue-like Schicht über Standard-TD [O/HIGH AV-S6].
- **Enemies als Boss-Kits:** Stun auf Einheiten, Summon, Evolution (Phasenwechsel), SPA-/DMG-Debuffs [O/HIGH AV-S5, AV-S13].
- **Hybrid aus kooperativem TD und PvP** (PvP-Modus mit Gegner-Senden) [O/MEDIUM AV-S12].

## Dateien

[mechanics.md](mechanics.md) | [economy.md](economy.md) | [units.md](units.md) | [enemies-waves.md](enemies-waves.md) | [meta.md](meta.md) | [design-lessons.md](design-lessons.md) | [sources.md](sources.md) | `data/*.json`
