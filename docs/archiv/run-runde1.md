# run.md — Arbeitsauftrag: Anime Adventures für den Web-Nachbau rekonstruieren

Du arbeitest in diesem Repository (`flashkeks/towerdef`), auf **dem Branch, auf dem
diese Datei liegt**. Lege keine neuen Branches an und öffne keine Pull Requests.
Committe und pushe auf diesen Branch.

Diese Datei ist dein kompletter Auftrag. Lies sie einmal ganz, bevor du anfängst.
Danach arbeitest du sie **paketweise** ab (Abschnitt 6) und hältst den Fortschritt
in `docs/anime-adventures/STATUS.md` fest. So kann jede neue Sitzung dort weitermachen,
wo die letzte aufgehört hat.

---

## 1. Ziel

Wir bauen ein **eigenes Web-Tower-Defense-Spiel**, das sich spielerisch an
**Anime Adventures** orientiert (Roblox, Gomu Development). Dafür brauchen wir keine
Wiki-Nacherzählung, sondern eine **technische Rekonstruktion**: Regeln, Zahlen,
Formeln, Abläufe, Datenmodelle. Ein Entwickler soll ohne weitere Recherche
daraus Spielsysteme implementieren können.

Arbeite wie ein **Game-Systems-Analyst**: Was genau passiert, in welcher
Reihenfolge, mit welchen Zahlen, und woher wissen wir das?

Im Repo liegt schon ein erster Stand. Er wurde **ohne echten Internetzugang**
erstellt. Deshalb fehlen dort viele genaue Werte, und manche Angaben sind
vermutlich geraten. Deine Hauptaufgabe ist es, diese Lücken mit **belegten Daten**
zu füllen und geratene Werte zu entlarven.

---

## 2. Dein Werkzeug: der Recherche-Connector

Du hast einen MCP-Connector mit zwei Werkzeugen. Nutze ihn für **alles**, was
Internet braucht. Er ist schneller und ergiebiger als eingebaute Websuche.

| Tool | Wofür | Wichtige Parameter |
|---|---|---|
| `search` | Websuche (Google, Bing, Wikipedia u. a. über SearXNG) | `query`, `max_results` (bis 50), `page`, `categories` (`general`, `it`, `videos`, `social media`, `news`), `time_range` (`day`, `week`, `month`, `year`) |
| `fetch` | Jede öffentliche URL lesen. HTML kommt als Markdown (Hauptinhalt), PDFs als Text | `url`, `max_chars` (Standard 20000, bis 100000), `start` (zum Weiterlesen), `raw=true` für rohes HTML/JSON |

Grenzen: 60 Aufrufe pro Minute, 10 MB pro Abruf. Interne/private Adressen sind
gesperrt — das ist Absicht, nicht ein Fehler.

### Rechercheknigge — so holst du die genauen Zahlen

Die wertvollsten Daten stecken fast immer in **Wiki-Infoboxen und Tabellen**.
Gerendertes HTML verliert dabei oft Werte. Darum:

1. **Fandom/MediaWiki: hol den Quelltext, nicht die Seite.**
   - Rohtext einer Seite:
     `https://WIKI.fandom.com/api.php?action=parse&page=SEITENNAME&prop=wikitext&format=json`
     mit `raw=true`. Darin stehen Infobox-Parameter wie `|damage1 = 120` direkt.
   - Alle Seiten einer Kategorie (z. B. alle Units):
     `https://WIKI.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Units&cmlimit=500&format=json`
   - Versionsgeschichte einer Seite (für alte Werte):
     `...api.php?action=query&prop=revisions&titles=SEITE&rvlimit=50&rvprop=timestamp|comment|ids&format=json`,
     alte Fassung dann mit `action=parse&oldid=REVID&prop=wikitext`.
   - Finde zuerst heraus, **welche** Wikis es zu Anime Adventures gibt (es gab
     mehrere, teils umgezogen). Nimm jedes ernstzunehmende auf.
2. **Legacy-Stände: Wayback Machine.**
   - Verfügbare Schnappschüsse:
     `http://archive.org/wayback/available?url=URL&timestamp=20230101`
   - Liste aller Schnappschüsse:
     `https://web.archive.org/cdx/search/cdx?url=URL&output=json&limit=50`
   - Abruf: `https://web.archive.org/web/ZEITSTEMPEL/URL`
3. **Reddit: JSON statt HTML.** Suche:
   `https://www.reddit.com/r/SUBREDDIT/search.json?q=BEGRIFF&restrict_sr=1&limit=50`,
   einzelner Thread: Thread-URL + `.json`. Kommt nichts, `old.reddit.com` probieren.
4. **Roblox-Seiten:** Spielseite, Updates/Beschreibung, Gamepässe
   (`https://games.roblox.com/v1/games/...`-APIs sind öffentlich, wenn du die
   Universe-ID findest).
5. **YouTube:** Videos selbst kannst du nicht ansehen. Nutze Titel,
   Beschreibungen, Kapitelmarken und angepinnte Kommentare. Dort stehen oft
   Patch-Inhalte und Zahlen. Werte daraus sind höchstens **OBSERVED**.
6. **Discord/Trello:** Viele Roblox-Spiele führen Patch Notes oder Trello-Boards.
   Öffentliche Trello-Boards gehen als JSON: Board-URL + `.json`.
7. **Lange Seiten:** Mit `max_chars` 40000–60000 lesen und mit `start` blättern.
   Nicht dieselbe Seite mehrfach holen. Was du gelesen hast, notierst du sofort
   (Abschnitt 4).

Suche gezielt auf **Englisch** (die Community ist englischsprachig) und probiere
Synonyme: `SPA` = Seconds Per Attack, `placement`, `upgrade cost`, `wave`,
`gems`, `banner rates`, `trait`, `star remnants`, `portal`, `raid`, `evolve`.

---

## 3. Kennzeichnung — keine erfundenen Daten

**Erfinde niemals Werte.** Jede Zahl, jede Regel bekommt zwei Etiketten.

**Herkunft:**

| Etikett | Bedeutung |
|---|---|
| `VERIFIED` | offiziell bestätigt (Entwickler, offizielle Patch Notes, Spiel-UI-Screenshot) |
| `OBSERVED` | aus Gameplay/Videos beobachtet |
| `DERIVED` | aus bekannten Werten berechnet (Rechenweg angeben) |
| `RECONSTRUCTED` | aus mehreren Quellen logisch geschlossen (Begründung angeben) |
| `UNKNOWN` | nicht öffentlich dokumentiert — so stehen lassen |

**Sicherheit:** `CONFIRMED`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`.

Pflicht bei Drop-/Gacha-/Trait-/Shiny-/Portal-Raten, Damage-Formeln,
Enemy-Scaling, Wave-Generierung und allem, was nach Serverlogik riecht.

**Versionen:** Anime Adventures hat sich stark verändert. Trenne Legacy und
spätere Stände **immer**. Bei abweichenden Werten:
`Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle`.

Kurzform in Tabellen, z. B. `120 [V/HIGH S12]` = 120, VERIFIED, HIGH, Quelle S12
aus `sources.md`. Die Legende steht oben in jeder Datei.

---

## 4. Arbeitsweise

1. **Erst das Repo lesen.** Struktur, vorhandene Doku, vorhandene
   Datenmodelle, Unit-/Enemy-/Map-Dateien. Was es schon gibt, wird **erweitert**,
   nicht parallel neu angelegt. Halte die vorhandenen Konventionen ein
   (Pfade, Sprache, Dateiformat).
2. **Bestand prüfen.** Für jeden vorhandenen Wert: Ist er belegt? Wenn nicht,
   belegen oder als `UNKNOWN`/`LOW` markieren. Falsche Werte korrigieren und den
   alten Wert in `unknowns.md` unter „Korrekturen" notieren.
3. **`STATUS.md` führen** (`docs/anime-adventures/STATUS.md`, oder wo die
   vorhandene Doku liegt):
   - welches Paket (Abschnitt 6) erledigt, angefangen oder offen ist,
   - welche Quellen schon ausgewertet sind (damit niemand sie zweimal holt),
   - offene Spuren („Wiki X hat Kategorie Y noch nicht durchgesehen").
   Eine neue Sitzung liest **zuerst** `STATUS.md` und macht dort weiter.
4. **Quellen sofort erfassen.** Jede genutzte URL kommt in `sources.md` mit
   ID (`S1`, `S2` …), Titel, Abrufdatum, Version/Zeitraum, was daraus stammt und
   Bewertung `A`–`E`:
   - `A` offiziell/primär
   - `B` verlässliche Community-Doku
   - `C` mehrere unabhängige Bestätigungen
   - `D` einzelne Community-Quelle
   - `E` Schluss/Beobachtung
5. **Nach jedem Paket committen und pushen.** Eine Nachricht pro Paket, z. B.
   `docs(aa): Units – Basiswerte und Upgrade-Tabellen aus Fandom-Wikitext`.
   Lieber oft committen als Arbeit verlieren.
6. **Breite vor Tiefe, dann Tiefe.** Erst alle Systeme grob mit Quellen, dann die
   Datenbanken (Units, Enemies, Waves) so vollständig wie möglich.
7. **Kein Füllmaterial.** Ein ehrliches `UNKNOWN` ist mehr wert als eine
   plausible Zahl.

---

## 5. Rechtliche Grenze

Wir dokumentieren Systeme und Zahlen. Wir übernehmen **keine Assets**: keine
Bilder, Texturen, Modelle, Sounds, Animationen oder extrahierten Spieldateien
ins Repo. Bei Audio/VFX/Animationen beschreibst du nur Typ, Zweck, Auslöser,
ungefähre Dauer und Verhalten. Lange Wiki-Fließtexte nicht kopieren, sondern
die Fakten strukturiert übernehmen. Tabellenwerte sind Fakten und dürfen rein.

---

## 6. Arbeitspakete (in dieser Reihenfolge)

Jedes Paket endet mit Commit und Eintrag in `STATUS.md`.

### P0 — Bestandsaufnahme
- Repo-Struktur, vorhandene Doku und Datenmodelle erfassen.
- Liste: Welche Aussagen im Bestand sind unbelegt oder verdächtig rund?
- Quellenlandkarte: Welche Wikis, Subreddits, Trello/Discord und Patch-Note-Quellen
  gibt es? Welche haben Legacy-Stände?
- Ergebnis: `STATUS.md` angelegt, `sources.md` mit den Hauptquellen.

### P1 — Systemübersicht (`game-overview.md`)
Core Loop und alle Systeme mit je 3–10 Zeilen, Unlock-Bedingung und Quelle:
Lobby, Spieler-Level, Units/Inventar, Upgrades, Traits, Shiny, Evolution,
Summoning/Banner, Währungen (Gems, Yen, Tickets, Star Remnants, Reroll Tokens,
Star Fruits …), Items/Crafting, Quests/Dailies, Story, Infinite, Raids, Portals,
Challenges, Events, Limited Units, Trading, Multiplayer, Leaderboards,
Achievements, Codes, Shops, NPCs, Gamepasses, Settings, Tutorial.
Plus eine **Zeitleiste** der großen Updates (Datum, was sich geändert hat).

### P2 — Kern-Mechanik einer Partie (`core-mechanics.md`, `combat-system.md`)
Der Ablauf einer Runde Schritt für Schritt, mit allen Sonderfällen:
Start-Yen, Wave-Start und -Timer, Spawn-Reihenfolge und -Abstände, Pfade,
Bewegung, Targeting-Modi (genaue Regeln: First/Last/Strongest/Weakest/Closest …),
Angriffszyklus (Ziel, Windup, Treffer, Schaden, Effekte, Cooldown, Neubewertung),
AoE-Formen (Single, Circle, Cone, Line, Full, Multi) und wie Treffer bestimmt
werden, Leaks und Base-HP, Wave-Abschluss, Belohnungen.
Status-Effekte: Stun, Slow, Time Stop, Burn/Bleed/Poison, Freeze, Shields,
Resistenzen, Immunitäten — mit Stärke, Dauer, Stapelbarkeit und Interaktion.

### P3 — Units (`units.md` + `data/units.json`, falls die Struktur passt)
**Das wichtigste Paket.** Für jede Unit, die du findest:
Name, ID, Anime-Vorlage, Rarity (Rare/Epic/Legendary/Mythic/Secret), Limited,
beschwörbar, Herkunft/Banner, Placement-Limit, Boden/Luft, Angriffstyp,
Targeting, AoE, **Basis-Damage/SPA/Range**, **jede Upgrade-Stufe mit Kosten,
Damage, SPA, Range und neuen Effekten**, Fähigkeit (Schaden, Cooldown, Dauer),
Passive, Farm/Buff/Debuff, Evolution, Shiny-Variante, Quelle.
Berechne (`DERIVED`): DPS, DPS je Yen, Gesamtkosten bis Max, Upgrade-Effizienz.
Fang mit den Units an, die das Wiki am vollständigsten führt. Arbeite dich dann
per Kategorie-Liste durch alle.

### P4 — Upgrade-, Trait-, Shiny-, Stat-Systeme
- `unit-upgrades.md`: allgemeine Regeln (Kostenkurven, Verkaufswert).
- `traits.md`: jeder Trait mit Rarity, Roll-Chance und allen Modifikatoren.
  Dazu Reroll-Kosten, Locking, Pity. Berechnet: erwartete Rerolls und Kosten
  für einen bestimmten Trait.
- Shiny: Chance, Effekte, Wechselwirkung mit Traits/Evolution, Star Remnants.
- Randomisierte Stats/Powerups: Spannen, Rarity-Abhängigkeit, angezeigt vs. echt.

### P5 — Evolution (`evolution.md`)
Matrix: Basis-Unit → Evo, Materialien (Star Fruits, Rainbow, Raid/Portal-Items,
Units, Währung), Statänderungen, neue Fähigkeiten.

### P6 — Gegner, Waves, Maps (`enemies.md`, `waves.md`, `maps.md`)
- Gegner: HP, Speed, Defense/Resistenzen, Luft/Boden, Boss/Mini-Boss, Schild,
  Regeneration, Fähigkeiten, Immunitäten, Belohnung, Welt/Stage.
- Waves je Map/Stage: Wave-Anzahl, Gegnerfolge, Anzahl, Spawn-Delay, Bosswaves,
  HP-Skalierung je Wave und Schwierigkeit. Tabelle
  `Wave | Enemy | Count | Spawn Delay | HP | Reward`.
- Maps: Welt, Modus, Pfade, Spawn/Exit, Platzierungsflächen, Einschränkungen,
  Besonderheiten. Geometrie nur beschreiben (z. B. „ein Pfad, zwei Kurven,
  Platzierung links breit"), keine Bilder einbinden.
- Pathing: Waypoints, Bewegung, Stacking/Kollision, Wirkung von Slow, Stun,
  Time Stop, Knockback und Teleport. Wie man das im Web umsetzt.

### P7 — Modi (`game-modes.md`, `portals.md`, `raids.md`)
Story (Welten, Acts, Schwierigkeiten, Unlocks, Belohnungen), Infinite (Skalierung,
Belohnungen, Leaderboards), Raids, Portals (Erwerb, Rarity, Stufen, Secret-Chancen,
Bosse, Bedingungen), Challenges (Modifikatoren), historische Events.

### P8 — Summoning und Economy (`summoning.md`, `economy.md`, `items.md`, `quests.md`)
- Banner-Typen, Rotation, Kosten (Single/Multi), **Raten je Rarity**, Pity
  (soft/hard), Tickets, Limited. Berechnet: Wahrscheinlichkeit nach N Pulls,
  erwartete Gems für eine bestimmte Unit, Pity-Wahrscheinlichkeit.
  Raten nach Version getrennt.
- Jede Währung/Ressource: Quellen, Verwendung, Sinks, Farm-Rate, Limits,
  handelbar ja/nein. Yen in der Partie: Start, Kill-/Wave-/Boss-Belohnung,
  Farm-Units, Verkaufswert.
- Quests, Dailies, Login-Belohnungen, Achievements, Battle Pass (falls vorhanden),
  Reset-Zeiten, Belohnungstabellen.
- Shops und Gamepässe **nur als Systembeschreibung**, ohne Kaufempfehlungen.

### P9 — Multiplayer, Trading, UI, Audio/VFX (`ui.md`, `audio-vfx.md`)
- Multiplayer: max. Spieler, Party, Matchmaking, Host, geteilte und getrennte
  Ressourcen, Placement-Limits im Team, Buffs, Disconnect/Rejoin/AFK.
- Trading: was handelbar ist, Ablauf, Bestätigung, Sperren, Anti-Scam, Limits.
- UI: jede wichtige Ansicht mit Elementen, Zuständen, Interaktionen und
  Fehlermeldungen (Lobby, Inventar, Unit-Detail, Upgrade, Summon, Trait,
  Evolution, Map-Auswahl, In-Game-HUD, Wave-Anzeige, Ability-Buttons, Targeting).
- Audio/VFX: nur beschreiben (siehe Abschnitt 5).

### P10 — Mathematik und Beispielrunde (`mathematics.md`)
Formeln mit Herkunfts-Etikett: DPS, Final Damage, Crit, SPA, Range,
Enemy-HP-Skalierung, Wave-Skalierung, Yen-Generierung, Verkaufswert,
Upgrade-Effizienz, Summon-, Pity-, Trait-, Shiny- und Portal-Wahrscheinlichkeit.
Eine Schadensformel nur aufstellen, wenn Quellen sie tragen. Sonst die
beobachteten Fälle zeigen und die Formel als `RECONSTRUCTED`/`LOW` kennzeichnen.
Dazu **eine komplett durchgerechnete Beispielrunde**: Wave 1 → Spawn →
Platzierung → Angriffe → Kills → Yen → Upgrade → Wave 2 → Ability → Boss,
mit allen Zahlen und deren Herkunft.

### P11 — Architektur und Datenmodell (`technical-reconstruction.md`)
- Empfohlene Web-Architektur (Frontend, Game Engine mit Wave-/Enemy-/Unit-/
  Combat-/Targeting-/Status-/Economy-/Ability-/Map-System, Backend mit Auth,
  Spielerdaten, Inventar, Progression, Währung, Trading, Matchmaking, Anti-Cheat).
  An die tatsächlich recherchierten Systeme anpassen.
- Datenmodelle (JSON-Schema oder TypeScript-Typen, je nach Repo) für Player, Unit,
  UnitInstance, UnitUpgrade, Trait, Enemy, Wave, Map, Stage, Banner, Item,
  Evolution, Portal, Quest, Currency. Wenn es im Repo schon Modelle gibt:
  diese erweitern.

### P12 — Lücken, Widersprüche, Abschluss (`unknowns.md`, `README.md`)
- **Known Unknowns & Conflicts:** widersprüchliche Werte (beide mit Quelle),
  fehlende Daten, historische Änderungen, nur beobachtete Mechaniken,
  unbekannte Raten und Serverlogik, Korrekturen am alten Bestand.
- `README.md` als Einstieg: was wo steht, Legende, Stand.
- Abschlussprüfung: Sind Units, Enemies, Maps, Waves, Upgrade-Kosten, Gacha-Raten,
  Traits, Evolutionen, Economy, Portals/Raids und Formeln erfasst? Sind alle
  unbekannten Werte markiert und alle Quellen eingetragen? Sind Widersprüche
  sichtbar und Versionen getrennt?

---

## 7. Zielstruktur

Richte dich nach dem, was im Repo schon existiert. Gibt es nichts Passendes:

```text
docs/anime-adventures/
  README.md  STATUS.md  sources.md  unknowns.md
  game-overview.md  core-mechanics.md  combat-system.md
  units.md  unit-upgrades.md  traits.md  evolution.md
  enemies.md  waves.md  maps.md  game-modes.md  portals.md  raids.md
  summoning.md  economy.md  items.md  quests.md
  ui.md  audio-vfx.md  mathematics.md  technical-reconstruction.md
data/   (nur wenn es zur Projektstruktur passt)
  units.json  enemies.json  maps.json  waves.json  banners.json  traits.json  items.json
```

Jede JSON-Zahl, die nicht `VERIFIED` ist, bekommt ein Begleitfeld, z. B.
`"damage": 120, "damage_meta": {"origin": "OBSERVED", "confidence": "MEDIUM", "source": "S12"}`.
Oder es gibt ein einheitliches `meta`-Objekt pro Eintrag, das passt besser zu der
vorhandenen Struktur. Entscheide einmal und bleib dabei.

---

## 8. Ende einer Sitzung

Bevor deine Sitzung endet (oder wenn du merkst, dass der Kontext knapp wird):

1. `STATUS.md` aktualisieren: erledigt, angefangen, nächster konkreter Schritt.
2. Committen und pushen.
3. Kurzbericht ausgeben:

```text
RESEARCH STATUS
Pakete erledigt / offen:
Quellen gesamt:
Units / Enemies / Maps / Stages dokumentiert:
Systeme dokumentiert:
VERIFIED / RECONSTRUCTED / UNKNOWN (ungefähr):
Neue/geänderte Dateien:
Commit(s):
Größte Lücken:
Nächster Schritt:
```

> Ziel ist nicht zu wissen, wie man Anime Adventures **spielt**, sondern genug
> über Regeln, Daten und Mathematik zu wissen, um ein funktional ähnliches
> Web-Tower-Defense-Spiel zu **bauen**.
