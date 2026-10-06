# run.md — Runde 2: Vergleichsrecherche Tower Defense + Vorarbeiten für unser Spiel

Du arbeitest in diesem Repository auf dem Branch, auf dem diese Datei liegt. Keine neuen
Branches. Commit und Push nach jedem Paket. Pull Requests nur, wenn der Mensch es sagt.

**Runde 1 (Anime Adventures) ist abgeschlossen** und war sehr gut: Datenmodule über
die Wiki-API statt HTML, 561 Units mit echten Werten, saubere Etiketten, Quellen,
Konflikte. Die Konventionen von dort gelten weiter (Abschnitt 3). Der alte Auftrag liegt
als `docs/anime-adventures/run-runde1.md` im Archiv (P0 verschiebt ihn dorthin).

Lies diese Datei einmal ganz. Danach liest jede Sitzung **zuerst `docs/STATUS.md`**
und macht beim „Nächsten Schritt" weiter.

---

## 1. Was sich gegenüber Runde 1 ändert

Runde 1 hat AA **enzyklopädisch** erfasst. Für den Bau unseres Spiels brauchen wir das
nicht bei jedem Spiel. Ab jetzt gilt **Systeme und Zahlenbereiche statt Vollständigkeit**:

| Brauchen wir | Brauchen wir nicht (nur wenn billig nebenbei) |
|---|---|
| Regeln, Abläufe, Formeln | jedes einzelne Item, Rezept, Skin |
| In-Match-Ökonomie: Startgeld, Kill-/Wave-Einkommen, Verkaufswert | komplette Unit-Datenbanken mit allen Varianten |
| Gegner-HP/-Speed und **wie sie mit der Welle skalieren** | Update-Zeitleisten bis aufs Datum |
| Wave-Zusammensetzung (wenigstens für einige Stages) | Legacy-gegen-aktuell-Diffs jedes Werts |
| Archetypen von Towern/Units mit **repräsentativen** Zahlen | Trading-/Social-Historie, Gamepass-Preislisten |
| Meta-Progression und Gacha als **System** (Raten, Pity, Sinks) | Lore, Namen, Bossangriffe im Einzelnen |
| Was Spieler lieben und hassen (Design-Lehren) | |

**Genau die Lücken, die bei AA offen geblieben sind, sind die wichtigsten:**
In-Match-Yen, Gegner-HP, Wave-Zusammensetzung, Targeting-Modi, Level-Kurve. Wer
Balance-Zahlen für ein TD bauen will, braucht genau die. Bloons TD6 hat dafür die
beste öffentliche Datenlage. Darum steht es vorn.

**Stopp-Regel:** Findest du einen Wert nach **drei gezielten Versuchen** (verschiedene
Quellen oder Suchbegriffe) nicht, trägst du ihn als `UNKNOWN` ein und machst weiter.
Keine Endlosschleifen auf einem Wert.

---

## 2. Agenten und Token-Budget — WICHTIG

Subagenten sind ausdrücklich erwünscht (ein Spiel oder Paket je Agent). Aber:

1. **Subagenten immer mit `model: "sonnet"` starten.** Nie Opus. Runde 1 hat mit
   Opus-Agenten extrem viele Tokens verbraucht. Sonnet reicht, wenn der Auftrag klar ist.
   Für rein Mechanisches (Seitenlisten holen, JSON parsen, Tabellen füllen) darf es
   `model: "haiku"` sein.
2. **Höchstens 4 Agenten gleichzeitig.** Mehr bremst sich am Rate-Limit des
   Connectors (60 Aufrufe pro Minute, für alle zusammen).
3. **Briefing statt Kontext:** Jeder Agent bekommt einen kurzen, vollständigen Auftrag:
   Spiel, Zieldateien, die Feldliste aus Abschnitt 5, Stopp-Regel, Etiketten. Gib ihm
   **nicht** diese ganze Datei und nicht die AA-Doku zum Lesen.
4. **Agenten schreiben in Dateien, nicht in die Antwort.** Rückmeldung an dich: höchstens
   10 Zeilen (was erledigt, was `UNKNOWN`, welche Dateien).
5. **Kein Doppelabruf:** Bevor ein Agent eine Quelle holt, prüft er
   `docs/games/SPIEL/sources.md`. Große Rohdaten (Wiki-Dumps) bleiben im Scratchpad,
   nicht im Repo.
6. Die **Hauptsitzung** koordiniert, prüft und fasst zusammen. Recherchieren sollen die
   Agenten.

---

## 3. Konventionen (unverändert aus Runde 1)

- **Herkunft:** `VERIFIED` · `OBSERVED` · `DERIVED` (Rechenweg) · `RECONSTRUCTED` (Begründung) · `UNKNOWN`
- **Sicherheit:** `CONFIRMED` · `HIGH` · `MEDIUM` · `LOW` · `UNKNOWN`
- **Kurzform in Tabellen:** `120 [O/HIGH S12]`
- **Quellen:** je Spiel eigene `sources.md` mit IDs (`BTD-S1` …), Bewertung `A`–`E`, Abrufdatum
- **Versionen:** nur trennen, wo sich ein **für uns relevanter** Wert geändert hat
- **Nichts erfinden.** Ein ehrliches `UNKNOWN` ist mehr wert als eine plausible Zahl.
- **Keine Assets** (Bilder, Sounds, Modelle, extrahierte Spieldateien) ins Repo, keine
  langen Fließtexte kopieren. Zahlen und Fakten strukturiert übernehmen ist ok.

### Recherche-Technik (bewährt in Runde 1)

- **Fandom/MediaWiki:** `api.php?action=parse&page=SEITE&prop=wikitext&format=json` mit
  `raw=true`. Nach **Datenmodulen** suchen (`Module:…/Data`): Dort steht die
  Spielkonfiguration, das ist der Jackpot. Kategorien über `list=categorymembers`.
  Alte Stände über `prop=revisions` und `oldid`.
- **Wayback Machine:** `web.archive.org/cdx/search/cdx?url=URL&output=json` und dann
  `web.archive.org/web/ZEIT/URL`
- **Reddit** war über den Connector gesperrt (403). Versuche
  `https://old.reddit.com/r/SUB/search.json?q=…&restrict_sr=1`, sonst Reddit-Treffer aus
  der `search`-Ergebnisliste (Snippets) nutzen. Nicht lange daran festbeißen.
- **Steam** (BTD6): Store-API `store.steampowered.com/api/appdetails?appids=960090`,
  Reviews `store.steampowered.com/appreviews/960090?json=1&filter=all&num_per_page=100`
- **Roblox:** Universe/Place-IDs über die Spielseite, dann `games.roblox.com/v1/games?universeIds=…`
  und `games.roblox.com/v1/games/ID/game-passes`
- **YouTube:** nur Titel, Beschreibungen, Kapitel → höchstens `OBSERVED`
- **Trello:** Board-URL + `.json`

---

## 4. Ordnerstruktur

```text
docs/
  STATUS.md                    globaler Fortschritt (neu, ersetzt die Rolle von anime-adventures/STATUS.md)
  anime-adventures/            Runde 1, bleibt wie sie ist (+ design-brief.md aus P1)
  games/
    btd6/  astd/  anime-vanguards/  anime-last-stand/  anime-expeditions/  utdz/
      overview.md  mechanics.md  economy.md  units.md  enemies-waves.md
      meta.md  design-lessons.md  sources.md
      data/*.json   (optional, klein: max. ~200 KB je Spiel)
  comparison/
    systems-matrix.md  numbers.md  recommendations.md
  research/
    tech-options.md  assets-licensing.md  legal-gacha.md  balancing.md
```

---

## 5. Steckbrief je Spiel (Feldliste für die Agenten)

**`overview.md`:** Entwickler, Plattform, Start, Status (aktiv/tot), Spielerzahlen
(Roblox-API/SteamDB), Kurzbeschreibung des Core Loops in fünf Sätzen, was das Spiel
**einzigartig** macht.

**`mechanics.md`:**
- Platzierung: Boden/Luft/Hügel, Raster oder frei, Limits je Unit und gesamt
- Targeting-Modi und ihre **genauen** Regeln
- Angriffszyklus, AoE-Formen, Treffer-Bestimmung
- Statuseffekte mit Stärke, Dauer und Stacking
- Schadensformel, Resistenzen und Schadensarten, Crits
- Fähigkeiten: aktiv/passiv, Cooldowns, Auren/Buffs mit Caps
- Wie Upgrades strukturiert sind (lineare Stufen, Pfade wie in BTD6, Evolutions)

**`economy.md` (Priorität!):**
- Startgeld je Modus und Schwierigkeit
- Einkommen je Kill, je Wave, passiv, Farm-Units und ihre Rendite
- Verkaufswert
- **Kostenkurve der Upgrades** (Beispiele: Billig-, Mittel-, Top-Unit)

**`units.md`:** **Kein Vollkatalog.** Rollen-Archetypen (Single-Target-DPS, AoE,
Support/Buffer, Farm, Debuffer, Anti-Air, Hidden-Detection …), pro Archetyp 2–4
repräsentative Units mit Kosten, Damage, SPA bzw. Cooldown, Range und Max-Upgrade-Kosten.
Dazu die Rarity-Verteilung und typische Stat-Spannen je Rarity.
**Ausnahme BTD6:** alle Tower (das sind nur rund 25) mit Basiswerten und Pfadstruktur.

**`enemies-waves.md` (Priorität!):**
- Gegnertypen mit HP, Speed und Eigenschaften (Schild, Fliegen, Stealth, Regen,
  Spawn-on-death)
- **HP-Skalierung über die Wellen** (Formel oder Tabelle)
- Wave-Zusammensetzung für wenigstens eine komplette Stage
- Boss-Waves
- **Ausnahme BTD6:** Runden 1–100 (oder so weit belegt) mit Zusammensetzung, RBE und
  Cash je Runde als JSON, außerdem Freeplay-Skalierung

**`meta.md`:** Account-Progression, Währungen mit Quellen und Sinks, Gacha (Raten, Pity,
Banner), Traits/Rerolls, Evolution, Modi (Story/Infinite/Raids/Challenges/Events),
Multiplayer (max. Spieler, geteiltes oder getrenntes Geld). Monetarisierung **nur als
Struktur**, ohne Preislisten.

**`design-lessons.md`:** Was Spieler loben und was sie hassen (Reviews, Reddit-Snippets,
Wiki-Diskussionen). Woran das Spiel gestorben ist bzw. warum es lebt. 5–10 konkrete
Lehren für unser Spiel.

---

## 6. Arbeitspakete

Jedes Paket endet mit Commit, Push und einem Eintrag in `docs/STATUS.md`.

### P0 — Aufräumen und Status (Hauptsitzung, kein Agent)
- `run.md` von Runde 1 → `docs/anime-adventures/run-runde1.md`. Diese Datei wird
  `run.md`.
- `docs/STATUS.md` anlegen: Pakete, Agenten mit Modell, offene Spuren. Den Verweis in
  `README.md` anpassen.
- Spielnamen und Plattform verifizieren. Exakte Schreibweise und Roblox-Universe-ID je
  Spiel. Vorsicht bei Namensvetter-Spielen: „Anime Expeditions" kann auch anders
  geschrieben sein, und „Universal Tower Defense Z" ist nicht dasselbe wie „Universal
  Tower Defense". Bei Zweifel beide notieren und die aktivere nehmen.

### P1 — AA-Design-Brief (ein Sonnet-Agent)
`docs/anime-adventures/design-brief.md`, **höchstens rund 400 Zeilen**: die Essenz von
Runde 1 für Entwickler. Core Loop, Kampf, Ökonomie, Gacha, Progression, die wichtigsten
Formeln, typische Zahlenbereiche, offene Lücken. Verweise auf die Detaildateien statt
Wiederholung. Keine neue Recherche.

### P2 — Bloons TD6 (ein bis zwei Sonnet-Agenten)
Steckbrief wie Abschnitt 5, mit den genannten Ausnahmen. **Hier die AA-Lücken füllen:**
Startgeld, Cash je Pop und je Runde, RBE- und HP-Skalierung, Rundenzusammensetzung,
Targeting-Modi, Verkaufswert, Schwierigkeitsmultiplikatoren.

### P3 — Roblox-Anime-TDs (bis zu 4 Sonnet-Agenten parallel, einer je Spiel)
In dieser Reihenfolge, falls weniger Agenten:
1. All Star Tower Defense (ASTD)
2. Anime Vanguards
3. Anime Last Stand
4. Universal Tower Defense Z (UTDZ)
5. Anime Expeditions

Steckbrief wie Abschnitt 5. Bei jedem Spiel zuerst nach Wiki-**Datenmodulen** suchen.

### P4 — Vergleich und Empfehlung (Hauptsitzung oder ein Sonnet-Agent)
- `comparison/systems-matrix.md`: Systeme × Spiele (hat es / wie gelöst), inklusive AA
- `comparison/numbers.md`: Zahlenbereiche nebeneinander. Startgeld, Einkommen je Wave
  relativ zum Startgeld, Kosten erste Platzierung relativ zum Startgeld, SPA-Spannen,
  Range-Spannen, Placement-Caps, HP-Skalierung (Formeln nebeneinander), Gacha-Raten
  und Pity
- `comparison/recommendations.md`: konkrete **Startwerte und Regeln für unser Spiel**,
  jeweils mit Begründung („BTD6 macht X, AA macht Y, wir nehmen Z, weil …"). Das ist
  das wichtigste Ergebnis dieser Runde.

### P5 — Vorarbeiten ohne Spielbezug (Sonnet-Agenten, gern parallel zu P3)
Alles nur mit Internetzugang:
- `research/tech-options.md`: Web-Engine (z. B. Phaser, PixiJS, Three.js/Babylon,
  Godot-Web-Export), ECS-Bibliotheken, Pathfinding/Waypoints, deterministische
  Simulation (Fixed Timestep), Koop-Multiplayer (autoritativer Server, z. B. Colyseus
  oder eigene WebSockets), Speichern (Server-Inventar gegen Cheats). Je Option Lizenz,
  Reife, Aktivität (letzter Release, GitHub-Stars) und eine **Empfehlung**.
- `research/assets-licensing.md`: Quellen für freie bzw. CC0-Grafik und -Sound
  (Kenney, OpenGameArt, itch.io-CC0-Packs u. a.) mit Lizenz und Eignung für den
  Anime-/TD-Stil. **Nur Links und Lizenzen, nichts herunterladen.**
- `research/legal-gacha.md`: Lootbox- und Gacha-Regeln in DE/EU (Jugendschutzgesetz,
  USK-Deskriptoren, Belgien/Niederlande), Pflicht zur Ratenangabe, Risiken bei
  anime-ähnlichen Namen und Figuren (Markenrecht, Parodie). **Keine Rechtsberatung**,
  nur eine Übersicht mit Quellen.
- `research/balancing.md`: öffentliche Artikel, GDC-Talks und Postmortems zu
  TD-Balancing und Gacha-Ökonomie. Kernaussagen und Formeln mit Quellen.

### P6 — Abschluss
`docs/STATUS.md` aktualisieren und Links prüfen. Dann der Kurzbericht:

```text
RESEARCH STATUS — Runde 2
Pakete erledigt / offen:
Spiele mit Steckbrief:
Gefüllte AA-Lücken (welche, woher):
Agenten gestartet (Anzahl, Modell):
Neue Dateien:
Commits:
Größte Lücken:
Nächster Schritt:
```

---

## 7. Ende einer Sitzung

Bevor der Kontext knapp wird oder die Sitzung endet: `docs/STATUS.md` aktualisieren
(erledigt, angefangen, laufende Agenten, nächster konkreter Schritt), committen und
pushen. Laufende Agenten vorher fertig werden lassen oder ihren Stand als
„Zwischenstand" committen.

> Ziel dieser Runde: Wir wissen danach, **welche Zahlen und Regeln wir für unser eigenes
> Tower Defense nehmen**, und warum. Wir wissen nicht jedes Detail jedes Spiels.
