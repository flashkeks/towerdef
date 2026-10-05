# UI / UX

> Screenshots und Videos konnten nicht ausgewertet werden. Diese Rekonstruktion stützt sich auf textuelle Beschreibungen (NPC-Namen, Menüpunkte, Features aus Patchnotes). Layouts und Animationen sind daher größtenteils **RECONSTRUCTED · LOW** bzw. **UNKNOWN**. Für unser Spiel ist das ohnehin ein eigenes Design.

## Lobby (3D-Hub mit NPCs/Zonen)

| Zone / NPC | Funktion | Tag |
|---|---|---|
| Play-Bereich („chambers“) | Stage-Räume für Story, Infinite und Legend | OBSERVED · MEDIUM · [S48] |
| Summon-Bereich | Banner-UI | OBSERVED · HIGH · [S01] |
| Travelling Merchant | neben Summon; Shop mit Timer | OBSERVED · HIGH · [S21] |
| Evolve-Bereich | Evolution-UI | OBSERVED · HIGH · [S03] |
| Ethereal Guide | Trait-Reroll | OBSERVED · HIGH · [S03] |
| Cosmic Cat | Potential-/Stat-Reroll | OBSERVED · HIGH · [S48] |
| Lucil | Shiny entfernen → Star Remnants | OBSERVED · HIGH · [S03] |
| Prayer Master | Level-Milestones (im Leaderboard-Bereich) | OBSERVED · HIGH · [S24] |
| Bartender | Unit-Storage gegen Gold | OBSERVED · HIGH · [S21] |
| Challenges-Raum | Challenge-Stages | OBSERVED · HIGH · [S15] |
| Raids-Bereich | Raids | OBSERVED · HIGH · [S08] |
| Time Machine | AFK-Gems (neben Play) | OBSERVED · HIGH · [S25] |
| Leaderboards | Boards plus Prayer Master | OBSERVED · HIGH · [S24] |
| RR | komplett neue Lobby | OBSERVED · HIGH · [S49] |

**Web-Umsetzung (DESIGN):** 2D-Hub-Screen mit Kacheln bzw. Hotspots statt begehbarer 3D-Lobby; jede NPC-Funktion wird zu einem Modal oder einer Seite.

## Hauptmenüs

| UI | Elemente (rekonstruiert) | Verhalten / States | Fehlermeldungen (DESIGN) |
|---|---|---|---|
| **Unit Inventory** | Grid aller Units (Portrait, Rarität als Rahmenfarbe, Level, Trait-Icon, Shiny-Marker, Lock?), Filter/Sort, Storage-Zähler x/100 | Auswählen öffnet Details; Mehrfachauswahl für Verkauf (Autosell seit U5 für Rarität X) | „Storage voll“ |
| **Unit Details** | Name, Rarität, Typ (Ground/Hill/Hybrid), Damage-Typ, Stats (Damage/SPA/Range) mit Potential-Rang (SSS–C-), Trait, Curse, Relic-Slot, Level/XP, Worthiness, Upgrade-Vorschau, Skins | Equip, Feed XP, Sell, Evolve, Reroll | – |
| **Teams / Loadout** | 6 Slots, gespeicherte Teams (seit U7.5) | Drag & Drop; Team speichern/laden | „Unit bereits im Team“ |
| **Summon / Banner** | Banner-Tabs (Standard/Special/Event/Legacy), 3 Featured (Center groß), Raten-Info, Pity-Leiste (Legendary sichtbar; Featured-Pity später sichtbar), Countdown bis Rotation, Buttons 1× / 10× (?) | Summon-Animation → Ergebnis-Karten (Shiny-Effekt) | „Nicht genug Gems“, „Storage voll“ |
| **Trait UI** | Unit-Auswahl, aktueller Trait, Kostenanzeige (1 oder 5 Remnants bzw. 1 Token), Reroll-Button | Ergebnis ersetzt sofort (Lock UNKNOWN) | „Nicht genug Star Remnants“ |
| **Potential UI** | Unit-Auswahl, Stats plus Ränge, Worthiness %, Stat Cube / Perfect Stat Cube (Stat wählen) | – | – |
| **Evolution UI** | Rezept (Unit + Items + Mengen, haben/brauchen), Ergebnis-Vorschau | Evolve-Button erst bei vollständigem Rezept aktiv | „Fehlende Materialien“ |
| **Quest UI** | Tabs Event / Daily / Infinite / Story; Fortschrittsbalken; Claim-Buttons; Reset-Timer | – | – |
| **Shop** | Merchant: 3 Items mit Preis und Timer; Gold-Shop: feste Liste | Kauf mit Bestätigung | „Nicht genug Gold/Gems“ |
| **Settings** | siehe unten | – | – |
| **Party / Stage Select** | Welt → Act → Normal/Hard → Infinite; Spieler-Slots; Start/Leave; Countdown | Host steuert die Auswahl | „Stage gesperrt“ |
| **Trading** | zwei Angebotsfelder, Tax-Anzeige, Ready/Accept | siehe [social.md](social.md) | „Level 40 nötig“, „Item nicht handelbar“ |

## Settings

| Option | Seit | Tag |
|---|---|---|
| Effekte anderer Spieler ausblenden | Update 2 | OBSERVED · HIGH · [S45] |
| Low-Quality-FX | Update 4 | OBSERVED · HIGH · [S45] |
| Autosell (nach Rarität) | Update 5 | OBSERVED · HIGH · [S45] |
| Musik/SFX-Lautstärke | Genre-Standard | RECONSTRUCTED · LOW |

## In-Game-UI (Match)

| Element | Beschreibung | Tag |
|---|---|---|
| Wave-Anzeige | „Wave X“ (Story: X/Y) | RECONSTRUCTED · HIGH |
| Yen-Anzeige | eigene Yen | RECONSTRUCTED · HIGH |
| Base-HP | Lebensanzeige | RECONSTRUCTED · MEDIUM |
| Skip-Wave-Button | sofort nächste Wave | OBSERVED · MEDIUM |
| Unit-Leiste | 6 Slots mit Deployment-Kosten; ausgegraut, wenn Yen fehlt oder das Cap erreicht ist (`placed/cap`) | RECONSTRUCTED · HIGH |
| Platzierungs-Preview | Geist der Unit plus Range-Kreis; rot bei ungültiger Fläche (Ground vs. Hill) | RECONSTRUCTED · MEDIUM |
| Unit-Panel (bei Klick) | Upgrade-Stufe, nächste Kosten, Stat-Delta, Targeting-Modus-Umschalter, Ability-Button (Cooldown-Ring), Sell (Betrag) | RECONSTRUCTED · HIGH (Targeting belegt) |
| Boss-HP-Bar | oben, bei Boss-Waves | RECONSTRUCTED · MEDIUM |
| Gegner-Icons | Typ-Schwäche/Resistenz (Portals/Legend) | OBSERVED · HIGH · [S12] |
| Damage-Numbers | UNKNOWN | UNKNOWN |
| Spielgeschwindigkeit (2×) | UNKNOWN | UNKNOWN |
| Ende-Screen | Victory/Defeat, Belohnungen, Replay/Next/Leave | RECONSTRUCTED · HIGH |
