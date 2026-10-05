# Anime Adventures – Game-Reconstruction-Dokumentation

Technische Analyse des Roblox-Spiels **Anime Adventures** (Entwickler: **Gomu**, Roblox-Gruppe) als Grundlage für ein **eigenständiges** Web-Tower-Defense-Spiel.

> Ziel: genug über Regeln, Daten, Mathematik und Systeme dokumentieren, damit ein Entwickler ein funktional ähnliches Spiel bauen kann, **ohne** Assets, Namen oder IP des Originals zu übernehmen (siehe [Rechtliche Grenze](#rechtliche-grenze)).

Recherchestand: **2026-10-05**

---

## Rechercheeinschränkung

**Sitzung 1** lief ohne direkten Seitenabruf, nur mit Such-Auszügen. Werte aus dieser Zeit tragen Quellen-IDs S01–S64.

**Sitzung 2** (Arbeitsauftrag [`run.md`](../../run.md)) hatte über einen Recherche-Connector Volltextzugriff:

- komplettes Fandom-Wiki samt Lua-Datenmodulen und Versionsgeschichte
- Trello-API
- offizielle Roblox-APIs

Diese Quellen tragen die IDs S65 ff. Bestandswerte werden paketweise dagegen geprüft. Fortschritt, ausgewertete Quellen und offene Spuren stehen in **[STATUS.md](STATUS.md)**.

Weiterhin nicht auswertbar:

- Discord (Login nötig)
- Video-Inhalte
- spielinterne Werte, die keine Community-Quelle dokumentiert (z. B. Gegner-HP-Tabellen); sie bleiben `UNKNOWN`

---

## Kennzeichnung

Jede wichtige Aussage trägt ein Tag in der Form `ART · CONFIDENCE · [Quellen]`.

| Art | Bedeutung |
|---|---|
| `VERIFIED` | Mehrere unabhängige Quellen bestätigen übereinstimmend einen im Spiel angezeigten bzw. offiziell kommunizierten Wert (z. B. Summon-Raten im Banner-UI). Primärzugriff auf das Spiel bestand **nicht**. |
| `OBSERVED` | Von der Community im Spiel beobachtet bzw. gemessen und dokumentiert (Wiki-Tabellen, Tests). |
| `RECONSTRUCTED` | Aus mehreren Quellen logisch zusammengesetzt. |
| `DERIVED` | Aus bekannten Werten berechnet (Rechenweg angegeben). |
| `UNKNOWN` | Nicht öffentlich dokumentiert bzw. nicht abrufbar. |
| `DESIGN` | **Kein AA-Wert.** Eigener Vorschlag für unseren Nachbau, wo AA-Daten fehlen. |

| Confidence | Bedeutung |
|---|---|
| `CONFIRMED` | mehrere unabhängige Quellen, widerspruchsfrei |
| `HIGH` | Wiki-Seite (B-Quelle), plausibel, konsistent mit anderen Werten |
| `MEDIUM` | einzelne Quelle oder leichte Widersprüche |
| `LOW` | schwache Quelle, Widersprüche oder nur indirekte Hinweise |
| `UNKNOWN` | keine Daten |

**Versionen:** `LEGACY` = Originalspiel Juli 2022 bis Dezember 2023, `RR` = Re-Release ab Dezember 2024. Wo die Version unklar ist: `VER?`. Details in [game-overview.md](game-overview.md#versionsgeschichte).

---

## Inhaltsverzeichnis

| Datei | Inhalt |
|---|---|
| [game-overview.md](game-overview.md) | Systemübersicht, Versionsgeschichte, Core Loop, Progression |
| [core-mechanics.md](core-mechanics.md) | Ablauf einer Partie, Platzierung, Yen, Waves, Leaks, Base HP |
| [combat-system.md](combat-system.md) | Targeting, AoE-Geometrie, Attack-Cycle, Damage, Crit, Status-Effekte, Buffs |
| [units.md](units.md) | Unit-Datenbank (Rollen, Raritäten, bekannte Datenblätter) |
| [unit-upgrades.md](unit-upgrades.md) | Upgrade-Tabellen, Kosten, Effizienz, Farm-ROI |
| [traits.md](traits.md) | Traits, Shiny, Reroll-Ökonomie |
| [unit-powerups.md](unit-powerups.md) | Randomisierte Stats (Potential/Worthiness), Level, Limit Break, Curses, Relics, Skins |
| [evolution.md](evolution.md) | Evolution-System und bekannte Evolution-Matrix |
| [enemies.md](enemies.md) | Gegnertypen, Enemy-Mechaniken, bekannte Bosse |
| [waves.md](waves.md) | Wave-Struktur, Scaling, bekannte Wave-Daten |
| [maps.md](maps.md) | Welten und Maps, Map-Längen, Platzierungsflächen |
| [game-modes.md](game-modes.md) | Story, Infinite, Legend Stages, Challenges, Dungeons, Infinity Castle, Tournaments, Contracts, Events |
| [raids.md](raids.md) | Raids |
| [portals.md](portals.md) | Portal-System, Secret Portals |
| [summoning.md](summoning.md) | Gacha, Banner, Raten, Pity, Wahrscheinlichkeitsrechnung |
| [economy.md](economy.md) | Yen, Gems, Gold und alle Währungen, Shops, Gamepasses, Sinks |
| [items.md](items.md) | Items, Star Fruits, Evolution-Materialien, Crafting |
| [quests.md](quests.md) | Quests, Daily, Battle Pass, Level-Milestones, Codes, Time Machine |
| [social.md](social.md) | Multiplayer, Trading, Leaderboards |
| [ui.md](ui.md) | UI/UX-Rekonstruktion |
| [audio-vfx.md](audio-vfx.md) | Audio, VFX, Animationen (nur Beschreibung) |
| [mathematics.md](mathematics.md) | **Game Mathematics** – alle Formeln |
| [simulation.md](simulation.md) | Durchgerechnete Beispielrunde |
| [technical-reconstruction.md](technical-reconstruction.md) | **Recommended Web Architecture** und Datenmodell |
| [STATUS.md](STATUS.md) | Recherche-Fortschritt, Quellenlandkarte, nächster Schritt |
| [sources.md](sources.md) | Quellenverzeichnis mit Bewertung A–E |
| [unknowns.md](unknowns.md) | **Known Unknowns & Conflicts** |
| [data/](data/) | Strukturierte Referenzdaten (JSON) |

---

## Rechtliche Grenze

- In diesem Repository liegen **keine** Roblox-Assets, Texturen, Modelle, Sounds, Animationen oder extrahierten Dateien.
- Die Unit-, Gegner- und Map-Namen hier sind die **In-Game-Namen von AA** und dienen nur als Referenzschlüssel. Viele davon sind Parodie-Namen von Anime-Figuren, also fremde IP. Das Spiel wurde 2023 wegen einer DMCA-Beschwerde vom Netz genommen (siehe [game-overview.md](game-overview.md)). **Für unser Spiel sind eigene Namen, Figuren, Grafiken, Sounds und UI-Assets Pflicht.**
- Übernommen werden nur **Spielsysteme und Mechaniken** wie Tower-Defense-Regeln, Gacha-Mathematik und Upgrade-Ökonomie. Sie werden hier abstrakt beschrieben.
