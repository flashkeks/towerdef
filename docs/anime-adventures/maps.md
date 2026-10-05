# Maps und Welten

## Story-Welten (Reihenfolge)

LEGACY-Namen aus [S07-Suchauszug „Main Quest worlds“, S45]; RR-Namen aus [S07]. Die **Zuordnung LEGACY ↔ RR** ist über die Reihenfolge rekonstruiert. Eindeutig sind Positionen mit identischem Namen (Snowy Town, Ant Kingdom, Magic Town, Alien Spaceship, Fabled Kingdom, Puppet Island, Virtual Dungeon, Mountain Temple, Rain Village) und Positionen mit klarer Parodie-Entsprechung.

| # | LEGACY-Name | RR-Name | Update | Mapping-Tag | Besonderheit |
|---:|---|---|---|---|---|
| 1 | Planet Namak | Planet Greenie | Release | RECONSTRUCTED · HIGH | Map-Länge 14 s |
| 2 | Shiganshinu District | Walled City | Release | RECONSTRUCTED · HIGH | **8 s (kürzeste Map)** |
| 3 | Snowy Town | Snowy Town | Release | VERIFIED · CONFIRMED | 11 s |
| 4 | Hidden Sand Village | Sand Village | Release | RECONSTRUCTED · HIGH | – |
| 5 | Marine's Ford | Navy Bay | ≤ U2 | RECONSTRUCTED · HIGH | – |
| 6 | Ghoul City | Fiend City | U2 | RECONSTRUCTED · HIGH | – |
| 7 | Hollow World | Spirit World | U3 | RECONSTRUCTED · HIGH | erste Flying-Gegner; 24 s (lang) |
| 8 | Ant Kingdom | Ant Kingdom | U4 | VERIFIED · CONFIRMED | – |
| 9 | Magic Town | Magic Town | U5 | VERIFIED · CONFIRMED | – |
| 10 | Cursed Academy | Haunted Academy | U6 | RECONSTRUCTED · HIGH | 23 s |
| 11 | Clover Kingdom | Magic Hills | U7 | RECONSTRUCTED · MEDIUM | – |
| 12 | Cape Canaveral | Space Center | U8/9? | RECONSTRUCTED · MEDIUM | – |
| 13 | Alien Spaceship | Alien Spaceship | U10 | VERIFIED · HIGH | Alien Portal |
| 14 | Fabled Kingdom | Fabled Kingdom | U11 | VERIFIED · HIGH | – |
| 15 | Hero City | Ruined City | U12 | RECONSTRUCTED · MEDIUM | – |
| 16 | Puppet Island | Puppet Island | U13? | OBSERVED · MEDIUM | – |
| 17 | Virtual Dungeon | Virtual Dungeon | U14 | VERIFIED · HIGH | – |
| 18 | Windhym | Snowy Kingdom | U15 | RECONSTRUCTED · LOW | Eclipse-Portal-Quelle |
| 19 | The Eclipse | Dungeon Throne | U15 | RECONSTRUCTED · LOW | – |
| 20 | Mountain Temple | Mountain Temple | U17 | VERIFIED · HIGH | Noble Portals |
| 21 | Rain Village | Rain Village | U18 | VERIFIED · HIGH | – |
| 22 | – | Shibuya District | U20 (RR) | OBSERVED · MEDIUM | **Doppelpfad**; Shibuya Portal |

Jede Welt hat **6 Acts**, wobei Act 6 der Welt-Endboss ist, sowie Normal/Hard und ein **Infinite**, das freigeschaltet wird, wenn alle Acts der Welt geschafft sind. OBSERVED · HIGH · [S06, S07]

## Weitere Maps (andere Modi)

| Map | Modus | Tag |
|---|---|---|
| Ant Kingdom (Midnight) | Raid | OBSERVED · HIGH · [S08] |
| Sacred Planet | Raid (Relic Shards) | OBSERVED · HIGH · [S08, S17] |
| Strange Town | Raid (Killer Coins) | OBSERVED · HIGH · [S08] |
| Marine's Ford (Buddha) | Raid | OBSERVED · HIGH · [S08] |
| Ruined City (The Menace) | Raid | OBSERVED · HIGH · [S08] |
| Cursed Festival | Raid | OBSERVED · HIGH · [S08] |
| Future City (Tyrant's Invasion), Future City | Raid (200 Gems, Power Cells, Chunks, Experiment X) | OBSERVED · HIGH · [S08] |
| Storm Hideout, Nightmare Train, Shigashinu District, Sand Village | Raid | OBSERVED · HIGH · [S08] |
| Magic Hills (Elf Invasion), Clover Kingdom (Elf Invasion), Cape Canaveral, Fabled Kingdom (Generals), Ruined City (Midnight), Spirit Invasion, Space Center, Virtual Dungeon (Bosses), Dungeon Throne, Rain Village | Legend Stages | OBSERVED · HIGH · [S16] |
| Witch City | Portal (Witch Portal Tier 5–11) | OBSERVED · HIGH · [S09] |
| Cursed Womb | Dungeon | OBSERVED · HIGH · [S56] |
| Infinity Castle | eigener Modus mit Räumen | OBSERVED · HIGH · [S45] |

## Map-Längen [S38]

Gemessen als Laufzeit eines Gegners mit **Basis-Laufgeschwindigkeit** vom Pfadanfang bis zum Pfadende. Die Sekunden sind laut Wiki **approximativ**. OBSERVED · HIGH

| Map | Laufzeit |
|---|---:|
| Shiganshinu District | 8 s |
| Snowy Town | 11 s |
| Planet Namak | 14 s |
| Cursed Academy | 23 s |
| Hollow World | 24 s |
| andere | UNKNOWN |

Ableitung für den Nachbau (DERIVED · MEDIUM): `Pfadlänge = Laufzeit × Basis-Speed`. Bei `DESIGN`-Basis-Speed 4 Studs/s ergeben sich 32–96 Studs.

## Map-Geometrie

| Feld | Status |
|---|---|
| Layout, Pfadverlauf, Wegpunkte | **UNKNOWN** (nur aus Videos oder Screenshots rekonstruierbar, nicht verfügbar) |
| Spawn-Punkte | 1 pro Pfad; Shibuya 2 |
| Exit | 1 pro Pfad (Base) |
| Ground-Platzierungsflächen | Boden neben dem Pfad; nicht auf dem Pfad selbst (RECONSTRUCTED · MEDIUM) |
| Hill-Platzierungsflächen | erhöhte „Hills“, map-spezifisch platziert | OBSERVED · HIGH · [S39] |
| Air-Placement | Es gibt keine separate „Luft“-Platzierung; „Air/Hill“ meint Hill-Flächen | OBSERVED · HIGH · [S39] |
| Restriktionen | Platzierung nur auf erlaubten Flächen; Abstand zwischen Units UNKNOWN |

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
  "unitFootprint": 1.2
}
```
`DESIGN`. Ground-Zonen dürfen den um `pathBuffer` aufgeweiteten Pfad nicht schneiden.
