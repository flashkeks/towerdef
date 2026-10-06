# UI / UX

Legende: `ART · CONFIDENCE · [Quelle]`, siehe [README.md](README.md#kennzeichnung). `S72:Update Log (U<n>)` = Patchnote im Wiki-Update-Log. **LEGACY** = U1–U18.5, **RR** = ab U19 (25.12.2024).

> **Belegstand:** Screenshots und Videos konnten nicht ausgewertet werden. Belegt sind UI-**Funktionen**, die Patchnotes und Wiki-Seiten im Text nennen (S72, S73). Layout, Anordnung und Animationen sind **RECONSTRUCTED** (Genre-Standard) oder **DESIGN** (Vorschlag für unser Spiel). In den Tabellen steht deshalb pro Element, ob es Wiki-belegt ist.
>
> Fehlermeldungen: Kein Volltext gibt einen Meldungstext des Spiels wieder. Alle Meldungen unten sind **DESIGN**, abgeleitet aus belegten Regeln (z. B. Trade-Level 40).

---

## Lobby (3D-Hub mit NPCs und Zonen)

Die Lobby ist ein begehbarer Server mit bis zu **30** Spielern [S74, VERIFIED]. Funktionen hängen an Zonen und NPCs. Seit U19 (RR) gibt es eine überarbeitete Lobby („Lobby upgraded and improvements“) [S72:Update Log (U19); S49].

| Zone / NPC | Funktion | Lage (laut Wiki) | Tag |
|---|---|---|---|
| Play-Bereich | Stage-Räume für Story, Infinite, Legend; Event-Stages am Ende des Bereichs | über eine Treppe erreichbar | OBSERVED · MEDIUM · [S48; S72:Tournament, S72:Update Log (U6.7.5)] |
| Summon | Banner-Fenster | links vom Leaderboard-Bereich | OBSERVED · HIGH · [S01 → S72:Summon] |
| Shop-Gebäude mit großem Banner | zeigt das aktuelle Special Banner | – | OBSERVED · HIGH · [S72:Update Log (U12.5)] |
| Travelling Merchant | Shop mit Rotation (LEGACY früh: 60 min offen, 30 min weg) | neben Summon | OBSERVED · HIGH · [S21; S73 NPCs] |
| Gambler | Event-Shop, Dungeon-Keys | außerhalb des Summon-Bereichs | OBSERVED · HIGH · [S72:Update Log (U20), S72:Dungeons] |
| Evolve-Bereich | Evolution, Crafting von Evo-Items | „Traits and Evolve“-Bereich | OBSERVED · HIGH · [S03 → S72:Traits] |
| Ethereal Guide | Trait-Reroll | außerhalb des Evolve-Bereichs | OBSERVED · HIGH · [S72:Traits] |
| Cosmic Cat | Potential-/Stat-Reroll | „Traits and Evolve“-Bereich | OBSERVED · HIGH · [S72:Powerups] |
| Limit Breaker | Limit Break | direkt außerhalb Evolution | OBSERVED · HIGH · [S72:Powerups] |
| Lucil | Shiny entfernen → Star Remnants | Lobby | OBSERVED · HIGH · [S72:Traits] |
| Relic-NPC | Relic-Crafting | neben dem Gold Shop | OBSERVED · HIGH · [S72:Update Log (U7)] |
| Bartender | Unit- und Skin-Slots gegen Gold (seit U10.7.5) | Lobby | OBSERVED · HIGH · [S21; S72:Update Log (U10.7.5)] |
| Leaderboard-Bereich | Boards, Leaderboard-NPC (Belohnungen), Prayer Master (Level-Milestones), Trophy-Shop (Emotes) | rechts vom Summon | OBSERVED · HIGH · [S72:Level Milestones, S72:Emotes, S73 NPCs] |
| Tournament-Board | Tournament-Menü | rechts der Treppe zum Play-Bereich | OBSERVED · HIGH · [S72:Tournament] |
| Codes-Bereich | Codes einlösen; daneben NPC für Social-Verifizierung (U12.5) | Lobby | OBSERVED · HIGH · [S72:Codes, S72:Update Log (U12.5)] |
| Challenges | Challenge-Stages, Wechsel alle 30 min | Lobby | OBSERVED · HIGH · [S15 → S72:Challenges] |
| Raids | über Neo-Tokyo erreichbar | – | OBSERVED · MEDIUM · [S08 → S72:Raids] |
| Gildenbereich | Gilden-NPC (seit U15) | – | OBSERVED · HIGH · [S72:Update Log (U15)] |
| Contracts | Contract-NPC **oder** Hauptmenü (RR) | – | OBSERVED · HIGH · [S72:Contracts] |
| Time Machine | Landmarke; AFK-Server für Gems; ab U19/U19.5 deaktiviert | Lobby | OBSERVED · HIGH · [S25 → S72:Time Machine] |
| Teleport-Shortcuts | z. B. Shortcut „Traits and Evolve“ teleportiert zum Bereich | – | OBSERVED · HIGH · [S72:Traits] |

**Für unseren Nachbau (DESIGN):** 2D-Hub mit Kacheln oder Hotspots statt begehbarer 3D-Lobby. Jede NPC-Funktion wird ein Modal oder eine eigene Seite. Die Shortcut-Leiste von AA (Seitenleiste mit „Summon“ u. a., [S73 Terminology]) ist das Vorbild für die Navigationsleiste.

---

## Hauptmenüs

Spalte „Beleg“: **W** = Wiki-/Trello-belegt (Quelle in der Zeile), **R** = RECONSTRUCTED, **D** = DESIGN.

### Unit-Inventar

| Element / Zustand | Beleg | Detail | Quelle |
|---|---|---|---|
| Grid aller Units | R | Portrait, Rarity-Rahmen, Level, Trait-Icon, Shiny-Marker | – |
| Storage-Zähler | W | Basis 100 (RECONSTRUCTED · MEDIUM), erweiterbar per Gold (Bartender) und Gamepass (+100) | [economy.md](economy.md#4-shops); S72:Store, S72:Update Log (U10.7.5) |
| Skin-Inventar mit eigenen Slots | W | „unit & skin slots“ | S72:Update Log (U10.7.5) |
| Lock | W | Units sperren (U3); gesperrte Units sind nicht verkaufbar | S72:Update Log (U3) |
| Filter nach Damage-Affinität | W | seit U14 | S72:Update Log (U14) |
| Autosell nach Rarity | W | Setting seit U5; für Skins seit U19 | S72:Update Log (U5, U19) |
| Portals-Tab | W | Portale liegen im Inventar unter „Portals“ | S72:Portals |
| Items-Tab | W | Items anklickbar (z. B. Cursed Finger öffnet eine Szene) | S72:Powerups |
| Sortierung | R | nach Rarity, Level, Neu | – |
| Mehrfachauswahl zum Verkaufen | R | Verkauf gegen Gold | S72:Currencies (Gold aus Unit-Verkauf) |
| Fehler „Storage voll“ | D | Summon und Drops blockieren | – |

### Unit-Detail (Unit View)

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| Name, Rarity, Platzierungstyp (Ground/Hill/Hybrid) | R | aus Datenmodell | [units.md](units.md) |
| Stats Damage / SPA / Range mit Potential-Rang | W | Ränge seit U19.5 „more visible and appear in more UIs“ | S72:Update Log (U19.5) |
| Passive Fähigkeiten | W | seit U20.4.1 im Unit View | S72:Update Log (U20.4.1) |
| Damage-Typen | W | auch im Teams-Fenster (U19.5) | S72:Update Log (U19.5) |
| 3D-Modell drehen | W | Tasten Q/E (seit U19, auch beim Summon) | S72:Update Log (U19) |
| Trait, Relic-Slot, Level/XP, Worthiness, Takedowns | R | alle Systeme belegt, Anzeige im Detail nicht ausdrücklich | [traits.md](traits.md), [unit-powerups.md](unit-powerups.md) |
| Aktionen: Equip, Fuse/Feed, Sell, Evolve | R | Fusing seit U7; Evolve ohne vorheriges Entsperren seit U12.5 | S72:Update Log (U7, U12.5) |

### Teams / Loadout

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| 6 Slots je Team | W | „up to 6 Limit Broken units equipped“ | S72:Powerups |
| Slot-Freischaltung über Spielerlevel | W | „Level requirement for unit slots reduced“ (U14); Level-Werte **UNKNOWN** | S72:Update Log (U14) |
| Teams speichern / laden | W | seit U7.5 | S72:Update Log (U7.5) |
| Teams umbenennen | W | Teams-UI-Revamp U19.5 | S72:Update Log (U19.5) |
| Tausch-Dialog bei vollem Team | W | „prompted to swap it with another unit“ (U19.5) | S72:Update Log (U19.5) |
| Team vor Spielstart ändern | W | ohne Rückkehr in die Lobby (U19) | S72:Update Log (U19) |
| Limit-Break-Symbol | W | kleines Icon rechts neben den Units zeigt den Team-Buff | S72:Powerups |
| Auto-Unequip | W | eine Unit, die zum Potential-Reroll gewählt wird, wird automatisch abgelegt | S72:Powerups |
| Fehler „Unit bereits im Team“ | D | – | – |

### Summon / Banner

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| Banner-Tabs | W | Standard, Special, Event (seit U13.5), Legacy (RR, mit Legacy Gems); weitere Event-Banner (z. B. April Fools) | S72:Summon, S72:Update Log (U17, U20.4.1) |
| 3 Featured Mythics | W | Mitte 50 %, Seiten je 10 % der Mythic-Chance (Special) | S72:Summon; [summoning.md](summoning.md) |
| Rotation | W | stündlich (Standard/Special/Legacy); Event-Banner fest bis Event-Ende | S72:Summon |
| Pity-Leiste | W | „builds up Pity bar“, 1/400 pro Summon für die mittlere Featured-Unit; Reset bei Mythic oder Banner-Refresh. Seit U20.4.1 Mitte-Pity nach 200 | S72:Summon |
| Kosten | W | 50 Gems (40 mit VIP) oder 1 Summon Ticket pro Summon. Multi-Summon-Button und Rabatt: **UNKNOWN** | S72:Summon; [summoning.md](summoning.md) |
| Luck-Potions im Banner-Fenster | W | Kauf direkt im Fenster; Wirkung zählt pro Banner (U10.5) | S72:Summon, S72:Update Log (U10.5) |
| Banner-Tiers | W | Spielerlevel 0 / 5 / 20 schalten Shinys bzw. Secrets frei; Erklär-NPC | S72:Summon, S73 NPCs |
| Quick-Summon-Setting | W | überspringt den ersten Teil der Summon-Animation (U20.4.1) | S72:Update Log (U20.4.1) |
| Ergebnis-Ansicht | W/R | Unit drehbar (Q/E); Trait kann direkt mitkommen (Trello-Screenshot „pulling … with a trait“) | S72:Update Log (U19); S73 Traits |
| Globale Chat-Ansage | W | Shiny Mythic und Secret werden in allen Servern angesagt | S72:Summon |
| Items als Zusatzdrop | W | Items kommen zusätzlich, nie statt einer Unit | S72:FAQ |
| Fehler „Nicht genug Gems“, „Storage voll“, „Banner-Tier zu niedrig“ | D | – | – |

### Trait-Reroll (Ethereal Guide)

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| Unit-Auswahl, aktueller Trait | W | Trello zeigte das Reroll-UI als Screenshot (nicht übernommen) | S73 Traits |
| Zwei Bezahlwege | W | Star Remnants oder Reroll Tokens | S72:Traits |
| Kosten | W | LEGACY früh: 1 Remnant (Rare–Legendary), 5 Remnants (Mythic/Secret); Details [traits.md](traits.md) | S73 Traits |
| Ergebnis ersetzt sofort | R | Trait-Lock: **UNKNOWN** | – |
| Fehler „Nicht genug Star Remnants“ | D | – | – |

### Potential-Reroll (Cosmic Cat)

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| Menü „Reroll Potential“ | W | Unit-Auswahl, aktuelle Stats, Worthiness | S72:Powerups |
| Stat Cube / Perfect Stat Cube | W | Stat Cube würfelt alle Stats neu, Perfect Stat Cube nur den gewählten | S72:Powerups |

### Evolution und Limit Break

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| Rezept-Ansicht (Unit + Items + Mengen) | R | Rezepte selbst belegt | [evolution.md](evolution.md) |
| Crafting der Evo-Items im Evolve-Bereich | W | „with enough materials you can make any evolution item“ | S73 NPCs |
| Evolve-Button erst bei vollständigem Rezept | R | – | – |
| Limit Break | W | Ziel-Unit wählen → Opfer-Units wählen → „limit break“ klicken; Opfer müssen entsperrt sein | S72:Powerups |
| Fehler „Fehlende Materialien“, „Unit gesperrt“ | D | – | – |

### Map-Auswahl / Party

| Element | Beleg | Detail | Quelle |
|---|---|---|---|
| Welt → Act → Schwierigkeit (Normal/Hard) → Infinite | R | Infinite nur Hard; Unlock nach allen Acts | S72:Infinite, S72:FAQ |
| World Skip | W | beim Wählen einer Welt automatische Abfrage: zum letzten Stage springen, Clear schaltet die anderen frei (U17, ersetzt World-Jumper-Items) | S72:Update Log (U17) |
| Global-Matchmaking-Option | W | Schalter „Join Global Matchmaking“ (U18 ff.) | [social.md](social.md#partie-bilden-räume-portale-matchmaking) |
| Spieler-Slots, Start, Leave, Countdown | R | – | – |
| Next Level nach Sieg | W | Host wählt; andere haben ca. 10 s zum Verlassen | S72:Update Log (U10.5) |
| Replay | W | ohne Lobby-Rückkehr (U7.6) | S72:Update Log (U7.6) |
| Portal-Replay | W | Host wählt ein Portal derselben Gruppe | S72:Update Log (U13.5) |
| Fehler „Stage gesperrt“, „Party voll“ | D | – | – |

### Weitere Menüs

| Menü | Beleg | Detail | Quelle |
|---|---|---|---|
| Quests | W | eigenes Fenster mit Tabs (u. a. Story, Infinite, Daily, Event); Benachrichtigung bei Abschluss (U19.5) | S72:Quests, S72:Update Log (U19.5) |
| Battle Pass | W | Free/Premium; bei Kauf werden alle bisherigen Belohnungen automatisch abgeholt | S72:Battlepass |
| Profil | W | rechte Bildschirmseite; Emotes ausrüsten | S72:Emotes |
| Emote-Rad | W | Taste X (bis U19), seit U19.5 Z; alternativ Punkt-Taste | S72:Emotes, S72:Update Log (U9, U19.5) |
| Tournament-Menü | W | Bracket-Rangliste | S72:Tournament |
| Contracts-Menü | W | Contract-Stufen nebeneinander, höchste ganz rechts (12 h Reset) | S72:Contracts |
| Shop / Gold Shop / Merchant | W | Gold Shop täglicher Restock (U7); Merchant-Rotation | S72:Update Log (U7); [economy.md](economy.md#4-shops) |
| Trading | W | Trading-Button; siehe [social.md](social.md#trading) | S72:Trading |
| Fehler „Level 40 nötig“, „Item nicht handelbar“, „Nicht genug Gems für Tax“ | D | aus belegten Regeln abgeleitet | – |

---

## Settings

| Option | Seit | Tag |
|---|---|---|
| Effekte anderer Spieler ausblenden | U2 (LEGACY) | OBSERVED · HIGH · [S45 → S72:Update Log (U2)] |
| Low-Quality-FX | U4 | OBSERVED · HIGH · [S45 → S72:Update Log (U4)] |
| Autosell (nach Rarity) | U5 | OBSERVED · HIGH · [S45 → S72:Update Log (U5)] |
| Depth of Field | U12.5 | OBSERVED · HIGH · [S72:Update Log (U12.5)] |
| Return to Spawn | U12.5 | OBSERVED · HIGH · [S72:Update Log (U12.5)] |
| Auto-Activate Active Attacks (Abilities feuern automatisch, sobald der Cooldown abläuft) | U13.5 | OBSERVED · HIGH · [S72:Update Log (U13.5)] |
| Autosell für Skins | U19 (RR) | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Back to Lobby (Verhalten nach Spielende) | U19 | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Lobby-Musik | U19 | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Pfad-Indikatoren (Anzeige oben rechts) | U19 | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Quick Summon | U20.4.1 | OBSERVED · HIGH · [S72:Update Log (U20.4.1)] |
| Musik-/SFX-Lautstärke allgemein | – | RECONSTRUCTED · LOW (nur Lobby-Musik belegt) |

## Tastenbelegung

| Taste | Funktion | Seit | Tag |
|---|---|---|---|
| Zifferntasten | Unit aus der Leiste wählen | U1 | OBSERVED · HIGH · [S72:Update Log (U1)] |
| R | ausgewählte Unit upgraden | U19.5 | OBSERVED · HIGH · [S72:Update Log (U19.5)] |
| X | ausgewählte Unit verkaufen (vor U19.5: Emote) | U19.5 | OBSERVED · HIGH · [S72:Update Log (U19.5)] |
| Z | Emote-Menü | U19.5 | OBSERVED · HIGH · [S72:Update Log (U19.5)] |
| Q / E | Unit im View/Summon drehen | U19 | OBSERVED · HIGH · [S72:Update Log (U19)] |

---

## In-Game-HUD (Match)

| Element | Beschreibung | Tag |
|---|---|---|
| Wave-Anzeige | „Wave X“ (Story: X/Y) | RECONSTRUCTED · HIGH |
| Yen-Anzeige | eigene Yen (Yen sind pro Spieler) | RECONSTRUCTED · HIGH |
| Base-HP | Lebensanzeige; skaliert mit Schwierigkeit (U9) | RECONSTRUCTED · MEDIUM (Anzeige) / OBSERVED · HIGH (Skalierung) · [S72:Update Log (U9)] |
| Pfad-Indikatoren | optionale Anzeige oben rechts (Setting, U19) | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Skip-Wave-Button | sofort nächste Wave. In keinem Volltext belegt | UNKNOWN · korrigiert (vorher OBSERVED · MEDIUM) |
| Unit-Leiste | bis zu 6 Slots mit Kosten; Auswahl per Klick oder Zifferntaste; ausgegraut bei zu wenig Yen oder erreichtem Cap | OBSERVED · HIGH (Slots, Tasten) · [S72:Powerups, S72:Update Log (U1)] / RECONSTRUCTED · HIGH (Ausgrauen) |
| Platzierungs-Vorschau | mehr Unit-Infos beim Hovern (U20.4.1). Geist der Unit plus Range-Kreis; rot bei ungültiger Fläche | OBSERVED · HIGH (Hover-Info) · [S72:Update Log (U20.4.1)] / RECONSTRUCTED · MEDIUM (Rest) |
| Unit-Overhead | Info über der platzierten Unit, seit U19 erweitert; Upgrade-Stufe als Zahl (U19) mit Farbcodierung (U19.5) | OBSERVED · HIGH · [S72:Update Log (U19, U19.5)] |
| Unit-Panel (bei Klick) | Upgrade (R), nächste Kosten, Sell (X) mit Betrag (25 % von Platzierung + Upgrades), Targeting-Dropdown, Ability-Button, Damage dealt und Takedowns | OBSERVED · HIGH (Targeting-Dropdown, Damage/Takedowns, Tasten) · [S72:Update Log (U19.5)] / RECONSTRUCTED (Layout) |
| Targeting | Modus-Auswahl seit U19.5 als **Dropdown**. Modi siehe [combat-system.md](combat-system.md#2-targeting) | OBSERVED · HIGH · [S72:Update Log (U19.5)] |
| Ziel-Highlight | Gegner, die von Units anvisiert werden, sind hervorgehoben (U20.4.1) | OBSERVED · HIGH · [S72:Update Log (U20.4.1)] |
| Ability-Button | Cooldown im Spiel sichtbar (U19.5); Auto-Activate per Setting (U13.5) | OBSERVED · HIGH · [S72:Update Log (U13.5, U19.5)] |
| Buff-Anzeige an Units | Status-Effects-UI mit Buff-Beträgen (U14); Damage-Typ-Buffs im Spiel sichtbar (U19.5) | OBSERVED · HIGH · [S72:Update Log (U14, U19.5)] |
| Gegner-Lebensleiste | über dem Gegner. Darüber Icons: Schwäche als Icon mit Prozentwert, Resistenz als Schild-Icon; seit U20.4.1 überarbeitet („resistances and modifiers“) | OBSERVED · HIGH · [S12 → S72:Damage Affinities Elements, S72:Update Log (U20.4.1)] |
| Debuff-Immunität | Immunitäts-Cooldowns sichtbar an Gegnern (U14); Hintergrund: 1 s Sperre nach Stun/Freeze (U8) | OBSERVED · HIGH · [S72:Update Log (U8, U14)] |
| Sonder-Lebensleisten | z. B. lila Leiste mit „Fragile“, Text „SHATTERED“ bei Auslösung (Illusionist (Transcended)) | OBSERVED · HIGH · [S72:Illusionist (Transcended)] |
| Boss-HP-Bar | oben bei Boss-Waves | RECONSTRUCTED · MEDIUM |
| Karten-Auswahl (Events) | alle paar Waves 3 Karten: Blessing oder Curse; Curses erhöhen Event-Belohnung. Wer in Multiplayer wählt: **UNKNOWN** | OBSERVED · HIGH · [S72:Events, S72:Update Log (Halloween 2023)] |
| Quest-Benachrichtigung | Toast bei Quest-Abschluss (U19.5) | OBSERVED · HIGH · [S72:Update Log (U19.5)] |
| Damage-Numbers über Gegnern | UNKNOWN | UNKNOWN |
| Spielgeschwindigkeit (2×) | in keinem Volltext erwähnt | UNKNOWN |
| Ende-Screen | Victory/Defeat, Belohnungen; Optionen Replay (U7.6), Next Level (U10.5), Leave; Setting „Back to Lobby“ (U19) | OBSERVED · HIGH (Optionen) · [S72:Update Log] / RECONSTRUCTED (Layout) |

## Für unseren Nachbau (DESIGN)

- HUD-Zustände als eigene State-Machine: `placing(unitId) → preview(valid|invalid) → placed`; `selected(unitInstance) → panel`. Escape bricht ab. DESIGN
- Targeting als Dropdown wie AA (seit U19.5), Ability-Button mit Cooldown-Ring und Auto-Schalter. DESIGN
- Gegner-Overlay: HP-Leiste, darüber Resistenz/Schwäche-Icons und ein Immunitäts-Timer. DESIGN
- Fehlermeldungen als Toast mit Code, z. B. `NOT_ENOUGH_YEN`, `CAP_REACHED`, `INVALID_SURFACE`, `STORAGE_FULL`, `TRADE_LEVEL_REQUIRED`. DESIGN
