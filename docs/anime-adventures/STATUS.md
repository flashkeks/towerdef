# Recherche-Status

Arbeitsauftrag Runde 1: [`run-runde1.md`](run-runde1.md) (archiviert). **Runde 1 ist abgeschlossen.** Der globale Fortschritt steht seit Runde 2 in [`docs/STATUS.md`](../STATUS.md).

Letzte Aktualisierung: 2026-10-06 (Sitzung 2, abgeschlossen)

## Pakete

| Paket | Inhalt | Status | Notiz |
|---|---|---|---|
| P0 | Bestandsaufnahme, Quellenlandkarte, Wiki-Dump | **erledigt** | siehe unten |
| P1 | `game-overview.md` + Zeitleiste | **erledigt** | 45 Update-Einträge; RR-Place-ID korrigiert (S78/S79); Update vom 2025-09-03 ohne Wiki-Log |
| P2 | `core-mechanics.md`, `combat-system.md` | **erledigt** | 22 Effekte, Affinitäten (Schwäche additiv, Resistenz 100/(100+R)), C5 gelöst. Offen: Start-/Kill-/Wave-Yen, Base-HP (in keiner Wiki-Seite); Reddit-JSON über Connector gesperrt (403) |
| P3 | `units.md` + `data/units.json` | **erledigt** | 561 Einträge, `units-index.md`, Legacy-Diff. Offen: Fähigkeitstexte (Passives) aus Unit-Seiten in `units.json` übernehmen (optional) |
| P4 | Upgrades, Traits, Shiny, Powerups | **erledigt** | 3 Trait-Pool-Stände, Unique 0,1 % (C7 gelöst), Rangtabellen, LB +5 %/Unit (max. 30 %), Relics komplett. Offen: Tier-/Potential-Verteilung, XP-Kurve |
| P5 | `evolution.md` | **erledigt** | 219 Rezepte (`evolution-matrix.md`, `items.json.evolutionRecipes`); Ketten bis 4 Stufen. Offen: Level/XP bei Evo, Elize-Normierung |
| P6 | Gegner, Waves, Maps | **erledigt** | C6 und C12 gelöst, alle Bosse 22×6 + Legend, Map-Längen 21 Welten. Offen: HP/Speed/Yen je Gegner, Wave-Zusammensetzung |
| P7 | Modi, Portals, Raids | **erledigt** | 22 Welten, 8 Legend Stages, 14 Secret Portals, 12 Raids, Challenge-Werte (Legacy). Offen: Portal-Tier-Multiplikatoren |
| P8 | Summoning, Economy, Items, Quests | **erledigt** | Pity je Version, E(Center) = 304,9 Pulls, C1/C2/C4 gelöst, Kapseln, Crafting, Milestones, BP. Offen: In-Match-Yen, 10er-Summon, Gold-Shop |
| P9 | Multiplayer, Trading, UI, Audio/VFX | **erledigt** | Matchmaking-Zeitachse, Host-Regeln, globale Caps/Auren, Trading-Zeitachse. Offen: Max. Spieler je Modus, Trade-Ablauf, Rejoin |
| P10 | `mathematics.md`, Beispielrunde | **erledigt** | alle Formeln neu etikettiert, Pity/Hits/Buffs/Resistenz korrigiert; Simulation mit echten Unit-Werten (L100), DESIGN-Ökonomie |
| P11 | `technical-reconstruction.md` | **erledigt** | Datenmodell an S65/S67 angepasst (AttackDef, UnitLevel, Pity-Regeln versioniert), Komponenten aktualisiert, Defaults-Tabelle mit belegten AA-Werten |
| P12 | `unknowns.md` (inkl. Korrekturen), `README.md`, Abschlussprüfung | **erledigt** | Status aller C1–C13/U1–U28, ~180 Korrekturen in G, Linkprüfung 0 Fehler, alle JSON gültig |

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

## Abschlussprüfung Sitzung 2

| Bereich | Erfasst? |
|---|---|
| Units | ja, 561 Einträge vollständig (S65/S66) |
| Enemies | Typen, Modifikatoren und 144 Bosse ja; **HP/Speed/Yen je Gegner nein** (keine Quelle) |
| Maps | 22 Welten + Legend/Raid/Portal-Maps, Laufzeiten; **Geometrie nein** |
| Waves | Wave-Anzahlen, Boss-Waves, Infinite-Gems; **Zusammensetzung nein** |
| Upgrade-Kosten | ja (alle Units) |
| Gacha-Raten | ja, nach Version getrennt, Pity-Regeln je Version |
| Traits | ja, drei Pool-Stände |
| Evolutionen | ja, 219 Rezepte |
| Economy | Account-Ökonomie ja; **In-Match-Yen (Start/Kill/Wave) nein** |
| Portals/Raids | ja; Tier-Multiplikatoren offen |
| Formeln | ja, mit Etiketten |
| Unbekannte markiert / Quellen eingetragen / Widersprüche sichtbar / Versionen getrennt | ja (unknowns.md A–H, sources.md S01–S84) |

## Nächster Schritt

Die verbleibenden Lücken (In-Match-Yen, Gegner-HP, Wave-Zusammensetzung, Targeting-Modi, Level-Kurve) stehen in keiner Textquelle, die der Connector erreicht. Mögliche nächste Spuren:

1. **YouTube:** Beschreibungen und angepinnte Kommentare von Gameplay-Videos, z. B. per Suche „anime adventures starting yen“ (höchstens OBSERVED).
2. **Wayback Machine:** Snapshots von Community-Guides 2022–2023 (`web.archive.org/cdx/search/cdx?url=…`).
3. **Discord:** Patch Notes im offiziellen Server, nur mit Login lesbar und daher nicht über den Connector.
4. Sonst: die DESIGN-Defaults aus [technical-reconstruction.md](technical-reconstruction.md#design-defaults-bis-aa-daten-vorliegen) verwenden und das Balancing im eigenen Spiel per Simulation kalibrieren.
