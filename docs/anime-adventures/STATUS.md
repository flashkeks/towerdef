# Recherche-Status

Arbeitsauftrag: [`/run.md`](../../run.md). **Eine neue Sitzung liest zuerst diese Datei** und macht beim „Nächsten Schritt“ weiter.

Letzte Aktualisierung: 2026-10-05 (Sitzung 2)

## Pakete

| Paket | Inhalt | Status | Notiz |
|---|---|---|---|
| P0 | Bestandsaufnahme, Quellenlandkarte, Wiki-Dump | **erledigt** | siehe unten |
| P1 | `game-overview.md` + Zeitleiste | **erledigt** | 45 Update-Einträge; RR-Place-ID korrigiert (S78/S79); Update vom 2025-09-03 ohne Wiki-Log |
| P2 | `core-mechanics.md`, `combat-system.md` | offen | Effekte: `S67` (22 Effektdefinitionen), `S72:Effects`, `S72:Enemy Mechanics` |
| P3 | `units.md` + `data/units.json` | **erledigt** | 561 Einträge, `units-index.md`, Legacy-Diff. Offen: Fähigkeitstexte (Passives) aus Unit-Seiten in `units.json` übernehmen (optional) |
| P4 | Upgrades, Traits, Shiny, Powerups | offen | `S72:Traits`, `S72:Powerups`, `S69` |
| P5 | `evolution.md` | offen | Rezepte vollständig in `S65` (`evolve`) |
| P6 | Gegner, Waves, Maps | offen | Wiki hat **keine** Gegner-Datenmodule; nur `Story`, `Infinite`, `Map Lengths`, `Enemy Mechanics` |
| P7 | Modi, Portals, Raids | offen | |
| P8 | Summoning, Economy, Items, Quests | offen | Kapsel-Raten und Pity in `S68` |
| P9 | Multiplayer, Trading, UI, Audio/VFX | offen | |
| P10 | `mathematics.md`, Beispielrunde | offen | |
| P11 | `technical-reconstruction.md` | offen | |
| P12 | `unknowns.md` (inkl. Korrekturen), `README.md`, Abschlussprüfung | offen | |

## Ausgewertete Quellen (nicht erneut holen)

| Quelle | Ergebnis | Ablage |
|---|---|---|
| Fandom-Wiki, alle 661 Artikel (Namensraum 0) | vollständig gespiegelt | nur Sitzungs-Scratchpad. Neu holen mit [`tools/aa-research`](../../tools/aa-research/README.md) |
| `Module:UnitData/Data` aktuell (Rev. 47322) + Legacy (Rev. 33214) | geparst | Ergebnis fließt in `data/units.json` (P3) |
| `Module:UnitData/Data/AoE Type`, `ItemData/Data`, `Relics/Data`, `InfoChar/*`, `UnitData/Data/Names` | geparst | P2, P3, P4, P8 |
| Versionsgeschichte `Module:UnitData/Data` (≈ 300 Revisionen) | Liste gelesen | S77 |
| Trello `3TFL3xY9` (197 Karten) | geholt | Karten 2022-08 bis 2023-07, früher Legacy-Stand |
| Roblox Games API + Game-Pass API | geholt | S74, S75 |

## Quellenlandkarte

| Quelle | Art | Legacy? | Stand / Bemerkung |
|---|---|---|---|
| `animeadventures.fandom.com` | Haupt-Community-Wiki, 662 Artikel, 4.258 Seiten | ja, über Versionsgeschichte | aktiv bis 2026-09. Datenmodule mit Spielkonfiguration (S65–S71) |
| `roblox.fandom.com/wiki/Gomu/Anime_Adventures` | Roblox-Wiki-Artikel | ja | Kontext (S42) |
| Trello `trello.com/b/3TFL3xY9` | Community-Trello, von Guides als „offiziell“ bezeichnet | ja (2022) | seit 2023-07 praktisch nicht gepflegt |
| Discord `discord.com/invite/adventures` | offizieller Server (≈ 598.000 Mitglieder) | – | ohne Login nicht lesbar → **nicht auswertbar** |
| Roblox-APIs (Universe 3183403065, Place 8304191830) | offiziell | – | Gamepässe, Spielinfo |
| `animeadventures.wiki`, `animeadventures.top` | Drittanbieter-„Wikis“ | – | Content-Farm-Verdacht, nur Stufe E |
| Wayback Machine | Archiv | ja | noch **nicht** genutzt. Lohnt nur für Seiten, die im Wiki fehlen |
| Reddit `r/AnimeAdventures` | Community | ja | noch **nicht** ausgewertet (offene Spur) |
| YouTube | Patch-Showcases | ja | nur Titel und Beschreibungen nutzbar (offene Spur) |

## P0-Befunde: unbelegte oder verdächtige Aussagen im Bestand (Sitzung 1)

| Aussage im Bestand | Befund (Volltext) | Folge |
|---|---|---|
| C.E.O. verkauft für 30 % (Konflikt C5) | Von 510 Unit-Seiten nennen 509 „25 %“, nur `C.E.O.` nennt „30 %“ | C5 → Einzelfall; Standardregel 25 % (P2) |
| Mythic-Pity „garantierter Center nach 400“, E = 253 Summons (C3) | `S72:Summon`: Pity wird bei **jedem** Mythic **und** bei jedem Banner-Refresh (stündlich) auf 0 gesetzt | Rechnung in `mathematics.md`/`summoning.md` korrigieren (P8/P10) |
| Event-Banner-Mythic 0,5 % vs. 0,25 % (C4) | `S72:Summon`: Event 0,5 %, Event-Pity **200** Summons; `S68`: Icy-Star-Kapsel 0,25 % Mythic-Unit + 0,25 % Mythic-Skin | beide Werte belegt, aber verschiedene Systeme (Banner vs. Kapsel) (P8) |
| Simulationswerte (Start-Yen 2.250 usw.) | waren als `DESIGN` markiert → korrekt gekennzeichnet | prüfen, ob das Wiki echte Werte liefert (P2/P10) |
| Unit-Datenblätter aus Such-Auszügen (`units.md`) | jetzt gegen S65 prüfbar | P3 |
| Trait-Raten aus Guides (S47) | `S72:Traits` und Trello-Karte „Traits“ vorhanden | P4 |

## Offene Spuren

- Reddit-JSON (`r/AnimeAdventures/search.json`) nach Wave-, HP- und Yen-Werten durchsuchen (P6, P2).
- Wiki-Seiten `Story`, `Infinite`, `Legend Stages`, `Raids` auf Gegnernamen und HP prüfen. Ein Gegner-Datenmodul existiert **nicht**.
- Wiki-Versionsgeschichte von `Summon`, `Traits` und `Infinite` für Legacy-Werte auswerten (P4, P6, P8).
- YouTube-Beschreibungen zu Updates 19–20 (RR) für die Zeitleiste (P1).

## Nächster Schritt

**P1:** `game-overview.md` mit Zeitleiste aus `S72:Update Log` überarbeiten, danach P2 (Effekte aus S67 + `S72:Effects`).
