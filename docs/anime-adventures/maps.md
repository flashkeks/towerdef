# Maps und Welten

> **Stand (Sitzung 2, P6):** Weltnamen LEGACY ↔ RR sind jetzt direkt belegt. Die Wiki-Seite *Story* nennt in jeder Welt-Box das Feld `location` mit dem LEGACY-Namen (S72:Story). Konflikt C12 ist damit gelöst. Map-Längen liegen für 21 Welten vor (S72:Map Lengths, Stand 2023-12, LEGACY).
>
> Tag-Format: `ART · CONFIDENCE · [Quelle]`, Legende siehe [README](README.md#kennzeichnung).

## Story-Welten (Reihenfolge)

LEGACY-Name = Feld `location` der Story-MapBox [S72:Story]; Reihenfolge und Update aus [S72:Update Log] und [S72:Map Lengths]. Map-Länge = Laufzeit eines Basis-Speed-Gegners vom Pfadanfang bis zum Pfadende in Sekunden, laut Wiki approximativ. AFK-Gems/Zeit: Gems und Spieldauer, wenn man Infinite ohne Units laufen lässt (exakt laut Wiki) [S72:Map Lengths].

| # | LEGACY-Name | RR-Name | Update (LEGACY) | Mapping-Tag | Länge (s) | AFK-Inf. Gems / Zeit | Besonderheit |
|---:|---|---|---|---|---:|---|---|
| 1 | Planet Namak | Planet Greenie | Release (2022-07-03) | OBSERVED · HIGH | 14 | 21 / 2:06 | „fairly long path“ |
| 2 | Shiganshinu District | Walled City | Release | OBSERVED · HIGH | **8 (kürzeste)** | 18 / 1:22 | „complex-looking path“; Cloner, Shield, Regen |
| 3 | Snowy Town | Snowy Town | Release | OBSERVED · HIGH | 11 | 0 / 1:10 | kurzer Pfad, eine Kurve um die Mitte |
| 4 | Hidden Sand Village | Sand Village | Release | OBSERVED · HIGH | 16 | 18 / 1:42 | führt Explosive ein |
| 5 | Marine's Ford | Navy Bay | U1 (2022-07-15) | OBSERVED · HIGH | 14 | 18 / 1:48 | führt Fortify ein |
| 6 | Ghoul City | Fiend City | U2 (2022-08-01) | OBSERVED · HIGH | 20 | 21 / 2:13 | starke Regen-Gegner |
| 7 | Hollow World | Spirit World | U3 (2022-08-19) | OBSERVED · HIGH | 24 | 27 / 4:04 | erste Flying-Gegner |
| 8 | Ant Kingdom | Ant Kingdom | U4 (2022-09-04) | OBSERVED · HIGH | 15 | 24 / 2:35 | Egg-Spawner |
| 9 | Magic Town | Magic Town | U5 (2022-09-20) | OBSERVED · HIGH | 22 | 27 / 3:41 | Fire-/Ice-Gegner |
| 10 | Cursed Academy | Haunted Academy | U6 (2022-10-08) | OBSERVED · HIGH | 23 | 21 / 2:12 | Womb-Curse-Key in Infinite |
| 11 | Clover Kingdom | Magic Hills | U7 (2022-11-12) | OBSERVED · HIGH | 21 | 21 / 1:52 | Ice Demons ab Act 1 |
| 12 | Cape Canaveral | Space Center | U8 (2022-12-21) | OBSERVED · HIGH | 18 | 27 / 3:04 | kein Flying in Act 1 |
| – | Devil City | – (nicht im RR) | U9 (2023-01-14) | OBSERVED · MEDIUM | – | – | Event-Welt (Devil Portal, „Devil City Event“) |
| 13 | Alien Spaceship | Alien Spaceship | U10 (2023-01-28) | OBSERVED · HIGH | 20 | 24 / 2:39 | Alien Portal |
| 14 | Fabled Kingdom | Fabled Kingdom | U11 (2023-02-25) | OBSERVED · HIGH | 27 | 27 / 3:57 | Demon Leader's Portal |
| 15 | Hero City | Ruined City | U12 (2023-03-31) | OBSERVED · HIGH | 15 | 21 / 2:26 | – |
| 16 | Puppet Island | Puppet Island | U13 (2023-05) | OBSERVED · HIGH | 23 | 21 / 2:00 | Puppet Portal |
| 17 | Virtual Dungeon | Virtual Dungeon | U14 (2023-06-16) | OBSERVED · HIGH | 14 | 21 / 2:05 | erste Armored-Gegner in Story |
| 18 | Windhym | Snowy Kingdom | U15 (2023-07-03) | OBSERVED · HIGH | 20 | 21 / 1:59 | Eclipse-Portal-Quelle |
| 19 | **Undead Tomb** | Dungeon Throne | U16 (2023-08-19) | OBSERVED · HIGH | **36 (längste)** | 27 / 3:16 | – |
| 20 | Mountain Temple | Mountain Temple | U17 (2023-09-30) | OBSERVED · HIGH | 18 | 24 / 2:27 | Noble/Golden Portal |
| 21 | Rain Village | Rain Village | U18 (2023-11-18) | OBSERVED · HIGH | 20 | 21 / 1:59 | Path Portal |
| 22 | – | Shibuya District | U20 (RR, 2025-03-09) | OBSERVED · HIGH | UNKNOWN | – | **Doppelpfad**; Shibuya Portal |

Quellen der Tabelle: [S07, S45 → S72:Story, S72:Update Log, S72:Map Lengths].

**Korrektur gegenüber Sitzung 1:** Position 19 war als „The Eclipse ↔ Dungeon Throne“ rekonstruiert. Richtig ist **Undead Tomb ↔ Dungeon Throne**. „The Eclipse“ kam mit Update 15 zusammen mit Windhym, ist aber eine **Portal-Map** (Eclipse Portal „The Eclipse: The Eclipse“, King's Portal „The Eclipse: The Wings of Darkness“) [S72:Portals]. Die Updates für Cape Canaveral (U8) und Puppet Island (U13) sind jetzt belegt.

Jede Story-Welt hat **6 Acts** (Act 6 = Welt-Endboss), Normal/Hard und ein **Infinite**, das nach Abschluss aller Acts freigeschaltet wird. Infinite gibt es nur auf Hard. OBSERVED · HIGH · [S06 → S72:Infinite, S72:Frequently Asked Questions]. Die Bosse pro Act stehen in [enemies.md](enemies.md#bosse-pro-story-welt-rr-stand).

**Story-Belohnung:** 80 Gems + 50 Level-XP beim Erstabschluss eines Acts, danach 20 Gems + 50 XP. OBSERVED · HIGH · [S72:Quests]. Vor „Update X“ waren es 15 bzw. 75 Gems. OBSERVED · LOW · [S72:Story]

## Legend Stages (RR)

Voraussetzung: Act 6 der zugehörigen Story-Welt geschafft. OBSERVED · HIGH · [S16 → S72:Legend Stages]. Das Feld `location` nennt auch hier den LEGACY-Namen.

| Legend Stage (RR) | LEGACY-Name (`location`) | Acts | Bosse | Belohnungs-Schwerpunkt |
|---|---|---:|---|---|
| Magic Hills (Elf Invasion) | Clover Kingdom (Elf Invasion) | 3 | Patelo; Zagrad (Sealed); Patelo (Dark) / Zagrad | Magic Stones, Relic-Materialien |
| Spirit Invasion | Hollow Invasion | 6 | Tiel; Toshe; Wes → Wes (Abomination); Barrago (Returned); Ging (Traitor); Aizo | Souls, Aranca Masks |
| Space Center | Cape Canaveral | 3 | Ungulo; Ricki; Donatallo | DISCs, Final-Disc-Fragmente |
| Fabled Kingdom (Generals) | Fabled Kingdom (Ten Commandments) | 3 | Fairy Traitor; Snake Demon; Esta | Demon Leader's Portal 20 % |
| Ruined City (Midnight) | Hero City (Midnight) | 6 | Gecko; Giganto; Shigaruko; Muscle; Dabo; Shigaruko (Awakened) | Hero Gauntlet, Quirk-Items |
| Virtual Dungeon (Bosses) | Virtual Dungeon (Bosses) | 3 | Fatal Scythe; Crystal Wyrm; Skull Reaper | Crystallites |
| Dungeon Throne | Undead Tomb | 3 | Principality Observation; Archangel Flame; Dominion Authority | Overlord's Rings |
| Rain Village | Rain Village | 3 | Hell Path; Puppet Path; Animal Path | Ninja Scrolls, Path Portal |

Tag für die ganze Tabelle: OBSERVED · HIGH · [S72:Legend Stages]. Weitere LEGACY-Legend-Stages: Karakora Town „The Final Standoff“ (U7.6) und „Hollow Invasion“ (U7.6 Part 1) [S72:Update Log]. Gegner in Legend Stages haben Resistenzen und Schwächen [S72:Damage Affinities / Elements].

**Korrektur gegenüber Sitzung 1:** Die alte Liste führte LEGACY- und RR-Namen derselben Stage als getrennte Einträge (z. B. „Magic Hills (Elf Invasion)“ und „Clover Kingdom (Elf Invasion)“, „Cape Canaveral“ und „Space Center“). Es sind **8** Legend Stages, nicht 10.

## Weitere Maps (andere Modi)

| Map | Modus | Version | Tag |
|---|---|---|---|
| Ant Kingdom (Midnight) | Raid | RR | OBSERVED · HIGH · [S72:Raids] |
| Sacred Planet | Raid, 5 Acts (Mage Marks, Relic Shards) | U18.5 (LEGACY) → RR | OBSERVED · HIGH · [S72:Raids, S72:Update Log] |
| Strange Town | Raid, 5 Acts (Killer Coins); LEGACY-Name Bizarre Town (U16.5) | RR | OBSERVED · MEDIUM · [S72:Raids, S72:Update Log] |
| Marine's Ford (Buddha) | Raid (U15); seit Update 19 entfernt | LEGACY | OBSERVED · HIGH · [S72:Raids] |
| Ruined City (The Menace) | Raid; LEGACY „Hero City – The Hero Slayer“ (U14) | RR | OBSERVED · MEDIUM · [S72:Raids, S72:Update Log] |
| Cursed Festival | Raid; LEGACY „Entertainment District“ (U12.5)? | RR | OBSERVED · LOW (Zuordnung) · [S72:Raids] |
| Future City (Tyrant's Invasion) | Raid; LEGACY „West City: Freezo's Invasion“ (U11.7.5)? | RR | OBSERVED · LOW (Zuordnung) · [S72:Raids] |
| Future City | Raid (Power Cells, Chunks); LEGACY „West City – Android Attack“ (U5.6)? | VER? | OBSERVED · LOW (Zuordnung) · [S72:Raids] |
| Storm Hideout | Raid (U10.7.5) | LEGACY → RR | OBSERVED · HIGH · [S72:Raids] |
| Nightmare Train | Raid; LEGACY „Infinity Train – Demonic Invasion“ (U2.5) | VER? | OBSERVED · HIGH · [S72:Raids, S73] |
| Shigashinu District | Raid „The Rumbling“, 20 Waves; seit Update 19 entfernt | LEGACY | OBSERVED · HIGH · [S72:Raids, S73] |
| Sand Village | Raid „Midnight Attack“, 20 Waves | LEGACY → RR | OBSERVED · HIGH · [S72:Raids, S73] |
| The Spider | Raid (U19.5) | RR | OBSERVED · HIGH · [S72:Update Log] |
| Witch City | Portal (Witch Portal Tier 5–11, Walpurges) | LEGACY | OBSERVED · HIGH · [S09 → S72:Portals] |
| The Eclipse | Portal-Map (Eclipse Portal, King's Portal) | LEGACY | OBSERVED · HIGH · [S72:Portals] |
| Sky Club | Portal-Map (Port Agency, Detective) | LEGACY | OBSERVED · HIGH · [S72:Portals] |
| Devil City | Event-Welt / Devil Portal | LEGACY | OBSERVED · HIGH · [S72:Portals, S72:Titles] |
| Varianten: „(Frozen)“, „(Winter)“, „(Summer)“, „(Birdcage)“, „(Final)“, „(Cube)“, „(New Moon)“, „(Underwater)“ | Portal-Maps als Varianten von Story-Maps | LEGACY | OBSERVED · HIGH · [S72:Portals] |
| Cursed Womb, Cursed Parade, The Fire (Karakora Town), Anniversary Island | Dungeons (LEGACY) | LEGACY | OBSERVED · HIGH · [S56 → S72:Dungeons] |
| Dungeon (RR, U20) | zufällig generierte Raum-Abfolge, 20 Siege nötig, 4 zusätzliche Versuche pro Raum | RR | OBSERVED · HIGH · [S72:Dungeon] |
| Frozen Abyss (Winter 2024), April Fools 2025 | **zufällig generierte Map mit 3 Pfaden**; 50 bzw. 30 Waves | RR | OBSERVED · HIGH · [S72:Events, S72:Update Log] |
| Halloween 2024 | Halloween-Varianten früherer Story-Maps, 50 Waves | RR | OBSERVED · HIGH · [S72:Events] |
| Infinity Castle / Infinity Mansion | Räume = je 3 Acts jeder Story-Welt bis Rain Village (63 Räume), danach gemischt inkl. Raid- und Event-Maps | LEGACY (U6) → RR | OBSERVED · HIGH · [S45 → S72:Infinity Mansion] |
| Turnier-Maps | Story-, Raid- und Portal-Maps, z. B. Thriller Park, Port Agency, Karakora Town, West City | LEGACY + RR | OBSERVED · HIGH · [S72:Tournament] |

## Map-Längen

Gemessen als Laufzeit eines Gegners mit **Basis-Laufgeschwindigkeit** vom Anfang bis zum Ende des NPC-Pfads. Die Sekunden sind laut Wiki **approximativ**. Stand 2023-12, LEGACY-Namen. OBSERVED · HIGH · [S38 → S72:Map Lengths]

Die Werte stehen in der Spalte „Länge“ der Weltentabelle oben. Spanne: 8 s (Shiganshinu) bis 36 s (Undead Tomb), Median 20 s (DERIVED aus den 21 Werten). Ob die RR-Maps dieselbe Geometrie haben: UNKNOWN (die RR-Welten tragen dieselben `location`-Namen, was für weitgehend gleiche Maps spricht, RECONSTRUCTED · MEDIUM).

Ableitung für den Nachbau (DERIVED · MEDIUM): `Pfadlänge = Laufzeit × Basis-Speed`. Bei `DESIGN`-Basis-Speed 4 Einheiten/s ergeben sich 32–144 Einheiten.

**Gegenprobe der AFK-Gems (DERIVED · HIGH):** Mit den Infinite-Gems aus [waves.md](waves.md#was-belegt-ist) (W6 = 18, danach 3 pro Wave) ergibt 18 → Verlust nach Wave 6, 21 → nach Wave 7, 24 → nach Wave 8, 27 → nach Wave 9. Snowy Town mit 0 Gems verliert vor Wave 6. Die Werte passen zur Gem-Tabelle.

## Map-Geometrie

| Feld | Status |
|---|---|
| Layout, Pfadverlauf, Wegpunkte | **UNKNOWN** pro Map. Belegt sind nur Kurzbeschreibungen: Planet Greenie „fairly long path“, Walled City „complex-looking path“, Snowy Town „short path and one curve around the center“ [S72:Story] |
| Spawn-Punkte | 1 pro Pfad; Shibuya 2; Event-Maps 3 (Frozen Abyss: zusätzliche Pfade per Kartenwahl) [S72:Story, S72:Events, S72:Update Log] |
| Exit | Base am Pfadende; Ruined City: Laden „links vom Start des NPC-Spawns“ (Easter Egg) [S72:Story] |
| Ground-Platzierungsflächen | Boden neben dem Pfad; nicht auf dem Pfad selbst (RECONSTRUCTED · MEDIUM) |
| Hill-Platzierungsflächen | erhöhte „Hills“, map-spezifisch; Air/Hill-Units **nur** auf Hills, Hybrid auf Hill und Ground | OBSERVED · HIGH · [S39 → S72:Air/Hill Units, S73] |
| Air-Placement | keine separate Luft-Platzierung; „Air/Hill“ meint Hill-Flächen | OBSERVED · HIGH · [S72:Air/Hill Units] |
| Restriktionen | Platzierung nur auf erlaubten Flächen; Placement-Limit pro Unit (Spawn Cap, siehe [units.md](units.md)); Abstand zwischen Units UNKNOWN. Update 1 behob „overlapping units when 2+ people place at same time“ → Units dürfen sich nicht überlappen | OBSERVED · MEDIUM · [S72:Update Log] |

### Empfehlung für unser Map-Format

```json
{
  "id": "map_meadow",
  "paths": [ { "id": "p1", "points": [[0,0],[20,0],[20,30],[60,30]], "flyingOffsetY": 6 } ],
  "placementZones": [
    { "type": "ground", "polygon": [[...]] },
    { "type": "hill",   "polygon": [[...]] }
  ],
  "blockedZones": [ { "polygon": [[...]] } ],
  "pathBuffer": 1.5,
  "unitFootprint": 1.2,
  "walkTimeSeconds": 20
}
```
`DESIGN`. Ground-Zonen dürfen den um `pathBuffer` aufgeweiteten Pfad nicht schneiden. `walkTimeSeconds` im AA-Bereich 8–36 s halten. Für Event-Modi mit Zufallsmaps einen Generator mit 1–3 Pfaden vorsehen, die alle in einer Base enden.
