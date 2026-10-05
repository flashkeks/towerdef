# Game Overview – Systemübersicht

## Steckbrief

| Feld | Wert | Tag |
|---|---|---|
| Plattform | Roblox | VERIFIED · CONFIRMED · [S42, S60] |
| Entwickler | Gomu (Roblox-Gruppe) | VERIFIED · CONFIRMED · [S42] |
| Genre | Kooperatives Tower Defense mit Gacha (Unit-Sammeln) | VERIFIED · CONFIRMED · [S42] |
| Prämisse | „Mehrere Anime-Welten kollidieren“; Bösewichte und Helden landen in einer Welt | OBSERVED · HIGH · [S42] |
| Place-ID Legacy | 8304191830 | OBSERVED · HIGH · [S60] |
| Place-ID Re-Release | 117965110267191 | OBSERVED · HIGH · [S60] |

## Versionsgeschichte

| Zeitraum | Version | Ereignis | Tag |
|---|---|---|---|
| 2021-12-21 | Pre-Release | Experience erstellt | OBSERVED · MEDIUM · [S42 via Suche] |
| 2022-07-03 | **LEGACY 1.0** | Offizieller Release | OBSERVED · HIGH · [S42, S45] |
| 2022-07-24 | Update 1.5 | – | OBSERVED · MEDIUM · [S45] |
| 2022-08-01 | Update 2 | Welt Ghoul City; Unit-Level-Cap 70; Limited Units; Event-Quests; Setting „Effekte anderer Spieler ausblenden“ | OBSERVED · HIGH · [S45, S05] |
| 2022-08-19 | Update 3 | Welt Hollow World (erste **Flying-Gegner**); Level-Cap 80; Leaderboard-Unit | OBSERVED · HIGH · [S45, S05] |
| 2022-09-04 | Update 4 | Welt Ant Kingdom; Level-Cap 90; neue Gegnertypen; Low-Quality-FX-Setting | OBSERVED · HIGH · [S45] |
| 2022-09-20 | Update 5 | Welt Magic Town; Level-Cap 100; **Skins**; **Autosell**; Event-Währung und -Shop | OBSERVED · HIGH · [S45] |
| 2022-10-08 | Update 6 | Welt Cursed Academy; Modus **Infinity Castle**; **Trading** (zunächst Skins) | OBSERVED · HIGH · [S45] |
| ~Okt. 2022 | Update 6.5 | **Curses** | OBSERVED · HIGH · [S18] |
| 2022-11-12 | Update 7 | Welt Clover Kingdom; **Damage Styles/Affinities**; **Relics**; Infinite-Quests | OBSERVED · HIGH · [S45, S17, S23] |
| 2022-11-18 | Update 7.5 | **Teams** (Loadouts speichern) | OBSERVED · HIGH · [S45] |
| Update 8 | – | Trading nur noch für Limited Units, Skins, einige Relics | OBSERVED · HIGH · [S19] |
| Update 10 (2023-01-28) | – | Welt Alien Spaceship (OPM-Update); **Alien Portal**; **Tournaments** | OBSERVED · HIGH · [S09, S45] |
| Update 10.7.5 | – | Raid-Tickets für Raids nicht mehr nötig | OBSERVED · MEDIUM · [S08] |
| Update 11 | – | Welt Fabled Kingdom | OBSERVED · HIGH · [S45] |
| 2023-03-31 | Update 12 | Welt Hero City; unbegrenzte Daily-Raid-Versuche; Trade-Level auf 40 gesenkt | OBSERVED · HIGH · [S45] |
| Update 13.5 | – | Witch Portal, Demon Academy Portal | OBSERVED · HIGH · [S09] |
| 2023-06-16 | Update 14 | Welt Virtual Dungeon | OBSERVED · HIGH · [S05] |
| 2023-07-03 | Update 15 | 1-Jahres-Jubiläum: Welten Windhym und The Eclipse | OBSERVED · HIGH · [S61] |
| Update 17 | – | „Fate Update“: Mountain Temple | OBSERVED · HIGH · [S05] |
| 2023-11-18 | Update 18 | Rain Village | OBSERVED · HIGH · [S50] |
| **2023-12-21/22** | Shutdown | DMCA-Takedown durch Gamefam im Auftrag von Crunchyroll (My-Hero-Academia-IP). Anime Fighting Simulator ebenfalls betroffen. | OBSERVED · CONFIRMED · [S42] |
| Jan.–Jun. 2024 | „Dark Ages“ | Kaum Kommunikation; rechtliche Verhandlungen | OBSERVED · LOW · [S54] |
| 2024-11-22 | Ankündigung | Trailer zur Rückkehr | OBSERVED · HIGH · [S49] |
| **2024-12-24/25** | **RR – Update 19** | Re-Release als Winter-Event; neue Lobby; fast alle Units **reskinned/umbenannt**; 4 neue Mythics im Special Banner; Holiday Stars und Kapseln | OBSERVED · HIGH · [S05, S42] |
| Update 19.5 | RR | Time Machine deaktiviert | OBSERVED · HIGH · [S25] |
| Update 20 | RR | Welt Shibuya (Doppelpfad), Shibuya Portal | OBSERVED · MEDIUM · [S07, S53] |
| 2026 | RR | April-Fools-Event/Banner (Code `APRILFOOLS`) | OBSERVED · LOW · [Codes-Seiten] |

**Wichtig für die Rekonstruktion:** Die Fandom-Seiten benutzen inzwischen **RR-Namen**, etwa „Planet Greenie“ statt „Planet Namak“. Viele Zahlenwerte stammen aber noch aus LEGACY-Seiten. Wo ein Wert nach dem Re-Release nachweislich geändert wurde, ist das in den Einzeldokumenten vermerkt. Sonst gilt `VER?`. Siehe [unknowns.md](unknowns.md).

## Core Gameplay Loop

```text
Lobby ──► Summon (Gems) ──► Team (6 Slots) ──► Stage wählen (Story/Infinite/Raid/Portal/Challenge)
  ▲                                                        │
  │                                                        ▼
  │                                  Match: Units platzieren → Yen verdienen → Upgraden → Waves halten
  │                                                        │
  └── Belohnungen: Gems, XP, Items, Portale, Units ◄───────┘
        │
        ├─► Units leveln (XP) / Evolve (Items) / Traits rerollen / Stats rerollen / Limit Break
        └─► Shops (Gold, Merchant, Raid-/Event-Shops), Trading (Limited)
```
RECONSTRUCTED · HIGH · [S01, S06, S07, S23]

## Systemlandkarte

| System | Kurzbeschreibung | Detail |
|---|---|---|
| Lobby | Hub mit NPCs: Summon, Evolve, Traits (Ethereal Guide), Shiny-Entfernung (Lucil), Stat-Reroll (Cosmic Cat), Level-Belohnungen (Prayer Master), Bartender (Storage), Travelling Merchant, Play-Räume, Challenge-Raum, Raids, Time Machine, Leaderboards | [ui.md](ui.md) |
| Player Level / XP | Spielerlevel aus Match-XP (50 XP pro Story-Clear); Freischaltungen und Milestones | [quests.md](quests.md) |
| Units | Raritäten Rare, Epic, Legendary, Mythic, Secret; Platzierungsklasse Ground/Hill/Hybrid; Spawn Cap | [units.md](units.md) |
| Unit Inventory | Basis-Storage plus Erweiterungen (Gold oder Robux) | [economy.md](economy.md) |
| Unit Level | Unit-XP aus Matches und XP-Food; Cap stieg mit Updates bis 100, per Limit Break bis 110 | [unit-powerups.md](unit-powerups.md) |
| Upgrades (In-Match) | Yen-Upgrades pro platzierter Unit | [unit-upgrades.md](unit-upgrades.md) |
| Traits | Zufälliger Modifier beim Erhalt, Reroll mit Star Remnants oder Reroll Tokens | [traits.md](traits.md) |
| Potential/Stats | Zufällige Basis-Stat-Abweichung (Damage/SPA/Range), Ränge SSS bis C- | [unit-powerups.md](unit-powerups.md) |
| Shiny | 1 % pro Summon, rein kosmetisch | [traits.md](traits.md#shiny-system) |
| Evolution | Unit plus Items (Star Fruits, Spezialitems) ergibt stärkere Form | [evolution.md](evolution.md) |
| Curses | Permanenter Stat-Trade-off (+x/−y) | [unit-powerups.md](unit-powerups.md#4-curses) |
| Relics | Ausrüstbare Items (%DMG, PEN, PWR, Crit …) | [unit-powerups.md](unit-powerups.md#5-relics) |
| Summoning | Banner (Standard/Special/Event/Legacy), Pity | [summoning.md](summoning.md) |
| Währungen | Yen (In-Match), Gems, Gold, Trophies, Star Remnants, Reroll Tokens, Event-Währungen | [economy.md](economy.md) |
| Modi | Story, Infinite, Legend Stages, Raids, Portals, Challenges, Dungeons, Infinity Castle, Tournaments, Contracts, Events | [game-modes.md](game-modes.md) |
| Quests | Daily, Story, Infinite, Event, Evolution-Quests | [quests.md](quests.md) |
| Battle Pass | 50 Tiers, Free und Premium | [quests.md](quests.md#battle-pass) |
| Trading | Ab Level 40; nur Limited Units, Skins, Limited Relics, Reroll Tokens; Gem-Tax | [social.md](social.md) |
| Multiplayer | Koop-Lobbys, Host-Mechanik (Portale) | [social.md](social.md) |
| Leaderboards | Infinite, Infinity Castle, Player Level; Top-Units als Belohnung | [social.md](social.md#leaderboards) |
| Codes | Gems, Items; teils mit Level-Anforderung | [quests.md](quests.md#codes) |
| Gamepasses | VIP, Shiny Hunter, Storage, Display | [economy.md](economy.md#gamepasses) |
| Settings | Effekte anderer Spieler ausblenden, Low-Quality-FX, Autosell | [ui.md](ui.md#settings) |
| Achievements | **UNKNOWN** – kein eigenständiges Achievement-System belegt | [unknowns.md](unknowns.md) |
| Tutorial | **UNKNOWN** | [unknowns.md](unknowns.md) |

## Progressionspfad (rekonstruiert)

```text
New Player
 ↓  Story World 1, Act 1–6 (je Act: 80 Gems First Clear, 20 Gems danach, 50 Level-XP)
Summoning (50 Gems/Summon) → erste Epics/Legendaries
 ↓
Unit Level (XP) + In-Match-Upgrades
 ↓  Welt komplett → Infinite dieser Welt frei (nur Hard)
Infinite (Gems pro Wave bis 497, Daily Wave-Ziele, Quests)
 ↓
Evolution (Star Fruits aus Challenges/Merchant/Gold-Shop + Spezialitems aus Legend Stages/Raids/Portals)
 ↓
Traits rerollen (Star Remnants, Reroll Tokens)  ·  Stats rerollen (Stat Cubes + Worthiness)
 ↓  Level 40: Trading
Raids / Legend Stages (Act 6 der jeweiligen Welt nötig)
 ↓
Portals (Drops aus Infinite/Raids) → Secret Portals → Secret Units
 ↓  Level 100: Divine Wish (Milestone) → Limit Break (Max-Level 110)
Endgame: Infinity Castle, Tournaments, Leaderboards, Contracts, Curses, Relics, 100%-Buff-Setups
```
RECONSTRUCTED · MEDIUM · [S06, S07, S11, S16, S19, S23, S24]

Die genauen Level-Anforderungen für Raids und Portale sind größtenteils **UNKNOWN**. Belegt ist: Eclipse-Portal-Farming erforderte Level ≥ 100 [S48], Trading Level 40 [S19], Codes teils Level 20+.
