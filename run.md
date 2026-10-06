# run.md — Runde 3: Balancing-Simulator und Game-Design-Entwurf

Du arbeitest in diesem Repository auf dem Branch, auf dem diese Datei liegt. Keine neuen
Branches. Commit und Push nach jedem Paket. Pull Requests nur, wenn der Mensch es sagt.

**Runde 1 und 2 sind abgeschlossen.** Die Recherche reicht für den Bau. Ab jetzt wird
**nicht mehr recherchiert**, außer ein Paket unten sagt es ausdrücklich. Grundlage ist
vor allem `docs/comparison/recommendations.md` (die Startwerte in §18, die Playtest-Liste
in §19) und `docs/research/tech-options.md`.

Lies diese Datei einmal ganz. Danach liest jede Sitzung **zuerst `docs/STATUS.md`** und
macht beim „Nächsten Schritt" weiter.

---

## 1. Ziel dieser Runde

1. **Die Zahlen beweisen.** Alle Werte in `recommendations.md` sind von Hand gerechnet
   (`DESIGN`). Die Datei sagt selbst, dass zentrale Annahmen (z. B. „0,025 DPS je Münze")
   um Faktor 1,5–3 danebenliegen können. Ein Simulator spielt die Stages tausendfach
   durch und kalibriert die Konstanten.
2. **Der Simulator ist der spätere Spielkern.** Er wird so gebaut, dass das echte Spiel
   ihn 1:1 übernimmt (headless, deterministisch, datengetrieben). Das ist kein
   Wegwerf-Skript.
3. **Einen Game-Design-Entwurf vorlegen**, in dem die **Entscheidungen offen markiert**
   sind. Was das Spiel einzigartig macht, entscheiden die Menschen, nicht du.

**Nicht in dieser Runde:** kein Renderer, kein Client, kein Server, keine Grafik, keine
Sounds, kein Gacha-Backend.

---

## 2. Agenten und Token-Budget — gilt weiter

- Subagenten **immer mit `model: "sonnet"`**, nie Opus. Rein Mechanisches (Tabellen
  füllen, Tests schreiben nach Vorgabe) darf `model: "haiku"` sein.
- Höchstens **4 Agenten gleichzeitig**. Jeder Agent bekommt einen kurzen, vollständigen
  Auftrag (Paket, Zieldateien, Schnittstellen, Abnahmekriterien) statt dieser ganzen
  Datei.
- Agenten schreiben in Dateien. Rückmeldung an dich: höchstens 10 Zeilen.
- Gut parallelisierbar: P2 (Simulator) und P4 (GDD-Entwurf) laufen unabhängig
  voneinander. Innerhalb von P2 erst den Kern (P2a) fertig machen, dann parallel
  Bots (P2b) und Reports (P2c).

---

## 3. Technik-Vorgaben für den Simulator

Nach `docs/research/tech-options.md` §4 und §7:

- **TypeScript**, Node 22, Paket `sim/` im Repo-Root mit eigener `package.json`.
  Tests mit **vitest**. Keine Browser-Abhängigkeiten, keine Render-Library.
- **Fester Tick** (z. B. 20 Ticks/s). Alles, was das Ergebnis bestimmt, als
  **Integer/Festkomma**: Positionen entlang des Pfads, HP, Schaden, Cooldowns in Ticks,
  Geld. Kein `Math.random()`, sondern ein **eigener seeded PRNG**. Iteration in fester
  Reihenfolge (aufsteigende Entity-IDs), keine Abhängigkeit von `Map`/`Set`-Reihenfolge.
- **Determinismus-Test:** gleicher Seed und gleiche Eingaben ergeben nach 20 Waves einen
  bit-gleichen Zustands-Hash. Das ist ein Pflichttest.
- **Datengetrieben:** Units, Gegner, Archetypen, Modifier, Stages/Waves, Ökonomie-
  Konstanten, Schwierigkeiten liegen als JSON unter `sim/data/` und werden validiert
  (z. B. zod). Startwerte aus `recommendations.md` §18 übernehmen, jede Zahl mit
  Kommentar bzw. Feld `ref`, das auf den Abschnitt zeigt.
- **Pfad:** Waypoint-Polylinie, Gegnerfortschritt als skalare Distanz (Tiles).
  Platzierungsplätze als Kandidatenliste neben dem Pfad (Raster), Abstand zum Pfad und
  Abdeckung je Platz werden einmal vorberechnet.
- **Spielregeln** wie in `recommendations.md`: Targeting-Modi (§9), Schadensformel und
  Rüstung (§10), Buff-Caps (§11), Farm (§12), Leaks und Base-HP (§2), Einkommen (§3),
  HP-Kurve und Archetypen (§4), Waves (§5), Kosten (§6), Caps (§7), Verkauf (§8),
  Koop-Geld (§16). Wo die Datei etwas offenlässt: die einfachste sinnvolle Regel nehmen,
  im Code als `// DESIGN-OFFEN` markieren und in `docs/balancing/offene-regeln.md`
  eintragen.

---

## 4. Arbeitspakete

Jedes Paket endet mit grünen Tests, Commit, Push und einem Eintrag in `docs/STATUS.md`.

### P0 — Status (Hauptsitzung)
- `run.md` von Runde 2 → `docs/archiv/run-runde2.md` (Runde 1 ggf. dorthin mitnehmen).
  Diese Datei wird `run.md`.
- `docs/STATUS.md`: Runde 3 mit den Paketen hier anlegen.

### P2a — Simulationskern (ein Sonnet-Agent, zuerst)
- Tick-Loop, PRNG, Entity-Verwaltung, Pfadbewegung, Spawner (Spawn-Gruppen aus §5),
  Targeting, Angriffe inkl. AoE-Formen, Statuseffekte (mindestens Slow, Stun mit
  CC-Sperre, Burn/Bleed), Schild-Stacks, Regen, Rüstung, Leaks, Ökonomie, Upgrades,
  Verkauf.
- **Befehls-Schnittstelle**, so wie sie später Spieler und Server nutzen:
  `place(unitId, slot)`, `upgrade(entityId)`, `sell(entityId)`, `setTargeting(entityId, mode)`,
  `useAbility(entityId)`, `skipWave()`. Der Simulator kennt nur Befehle, keine UI.
- Tests: Determinismus, Einkommen der Beispiel-Stage bei „keine Units" (nur Wave-Bonus),
  Schadensformel-Einzelfälle aus §10, Leak-Rechnung aus §2.

### P2b — Bot-Strategien (Sonnet, nach P2a)
Mindestens fünf Bots, die über die Befehls-Schnittstelle spielen:
1. **Greedy-DPS:** kauft immer das Beste pro Münze (Platzierung oder Upgrade)
2. **Farm-first:** Farm in Wave 1, dann Greedy
3. **AoE-lastig:** bevorzugt AoE-Units
4. **Upgrade-first:** wenige Units, voll ausgebaut
5. **Breit:** viele Units auf niedriger Stufe
6. optional **Koop-Mix:** 2–4 Bots gemeinsam mit dem Koop-Geldmodell

Platzierung: Bot wählt den Slot mit der größten Pfadabdeckung für die Range der Unit.
Etwas Zufall (seeded), damit Monte-Carlo-Läufe streuen.

### P2c — Reports und Kalibrierung (Sonnet, nach P2a, parallel zu P2b)
- CLI: `npm run sim -- --stage standard20 --bot greedy --runs 500 --difficulty normal --players 1`
- Ausgabe nach `docs/balancing/`:
  - Siegquote je Bot × Schwierigkeit × Spielerzahl
  - **Verlustrate je Wave**, Geldkurve, Pool/Kapazität je Wave, Leak-Quellen
  - Farm-Anteil und Payback
  - Anteil Upgrades gegen Neuplatzierungen
  - Infinite: Median-Endwave und Streuung
- Als Markdown-Tabellen plus CSV. Diagramme optional als SVG.
- **Kalibrieren gegen die Ziele aus §19:** Verlustrate im späten Abschnitt 10–20 %,
  Infinite-Median-Endwave 30–40, Koop-Siegquote je Spielerzahl auf ±10 Prozentpunkte,
  Stage-Dauer ca. 15 min, Farm-Anteil 25–35 % und so weiter.
  Konstanten in `sim/data/` anpassen, **jede Änderung** mit Alt-, Neu-Wert und Grund in
  `docs/balancing/kalibrierung.md`.
- Ergebnis: `docs/balancing/report.md` mit Stand vorher/nachher, den kalibrierten
  Startwerten und dem, was der Simulator **nicht** beantworten kann (Spielgefühl,
  Lesbarkeit, menschliche Fehler). Die Tabelle §18 in `recommendations.md` bekommt
  einen Hinweis auf die kalibrierten Werte. Den Text dort nicht umschreiben.

### P3 — Content-Sanity (Sonnet, nach P2c)
Prüfe mit dem Simulator auch die Grenzfälle:
- Gibt es eine dominante Strategie, die alles schlägt?
- Gibt es eine nutzlose Unit-Rolle?
- Ist Dauer-Stun auf Bosse möglich?
- Macht ein einzelner Trait oder Buff-Stack das Spiel kaputt?
- Bricht Infinite bei 60 Units/80 Gegnern die Performance (Ticks/s im Node-Lauf messen)?
Befunde in `docs/balancing/report.md`, Abschnitt „Risiken".

### P4 — Game-Design-Entwurf (ein Sonnet-Agent, parallel zu P2)
`docs/design/gdd.md`, kompakt (Ziel höchstens rund 500 Zeilen). Inhalt:
1. **Elevator Pitch** in drei Sätzen. Mehrere Varianten zur Auswahl.
2. **Design-Säulen** (3–4), jeweils mit „das heißt konkret …"
3. **Der Kniff:** 3–5 Kandidaten, was unser Spiel von AA/ASTD/AV/ALS/UTDZ/AE/BTD6
   unterscheidet. Jeweils mit Vorbild, Aufwand, Risiko, Bezug zu den
   `design-lessons.md`. **Nicht entscheiden**, sondern als `ENTSCHEIDUNG OFFEN` markieren.
4. **Core Loop** und **Meta Loop** (Match → Belohnung → Gacha/Upgrade → nächste Stage)
5. **MVP-Umfang (Vertical Slice):** eine Map, 6–8 Units, 20 Waves, solo, ohne Gacha.
   Was genau drin ist und was ausdrücklich nicht.
6. **Unit-Entwürfe für den MVP:** 6–8 **eigene** Figuren (keine fremde IP, keine
   anspielenden Namen), je Rolle, Fähigkeits-Idee, wie sie sich anfühlen soll, und
   welcher Archetyp-Konter sie wichtig macht. Werte aus `sim/data/`.
7. **Map-Konzepte:** 3 Stück, je Pfadform, Platzierungsflächen, welche Archetypen sie
   testen
8. **Onboarding:** die ersten 10 Minuten, Wave für Wave
9. **Game Feel / Juice:** Liste konkreter Feedback-Effekte (Treffer, Kill, Geld, Level-up,
   Boss-Auftritt, Leak), mit Prioritäten für den MVP
10. **Art-Direction-Optionen:** 2–3 Stilrichtungen, die mit freien Assets oder wenig
    eigenem Aufwand machbar sind (Bezug `docs/research/assets-licensing.md`).
    `ENTSCHEIDUNG OFFEN`.
11. **Roadmap:** M1 Vertical Slice → M2 Koop → M3 Meta/Gacha → M4 Inhalte. Je Meilenstein
    eine Abnahme-Checkliste.

Dazu `docs/design/FRAGEN.md`: **alle offenen Entscheidungen** als nummerierte Liste.
Jede Frage mit Optionen, Empfehlung und Konsequenz („Wenn A, dann …"). Diese Liste ist
für die Menschen. Kurz und klar, höchstens eine halbe Seite pro Frage.

### P5 — Fähigkeiten-Musterkatalog (Sonnet, optional, Recherche erlaubt)
`docs/design/ability-patterns.md`: aus den sieben recherchierten Spielen (vorhandene
Doku zuerst, Netz nur ergänzend) die Fähigkeits-Muster, die Spieler am meisten mögen
(z. B. Zeitstopp, Ketten-Blitz, Beschwörung, Buff-Aura, Geldfarm mit Twist,
Verwandlung), je Muster Mechanik, typische Werte, Balance-Risiko und ob der Simulator
es schon kann. Ziel: Material für eigene Units.

### P6 — Abschluss
`docs/STATUS.md` aktualisieren. Kurzbericht:

```text
STATUS — Runde 3
Pakete erledigt / offen:
Simulator: Tests (Anzahl, grün?), Determinismus-Test grün?, Ticks/s:
Kalibrierung: wichtigste geänderte Konstanten (alt → neu):
Siegquoten Normal/Hard/Nightmare (Greedy-Bot, solo):
Gefundene Balance-Risiken:
GDD: offene Entscheidungen (Anzahl), siehe FRAGEN.md
Agenten gestartet (Anzahl, Modell):
Commits:
Nächster Schritt:
```

---

## 5. Ende einer Sitzung

Bevor der Kontext knapp wird oder die Sitzung endet: `docs/STATUS.md` aktualisieren
(erledigt, angefangen, laufende Agenten, nächster konkreter Schritt), Tests laufen
lassen, committen und pushen. Code, der nicht durch die Tests geht, nur als klar
markierter Zwischenstand committen.

> Ziel dieser Runde: Wir wissen, **dass die Zahlen tragen**, und wir haben einen
> Design-Entwurf, über den die Menschen entscheiden können. Danach wird gebaut.
