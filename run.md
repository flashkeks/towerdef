# run.md — Runde 9: Fähigkeiten, 10 Welten, Legend Stages und Raids, Interface komplett

Du arbeitest in `flashkeks/towerdef` auf dem Branch **`dev`**. Commit und Push nach jedem Paket.
Kein neuer Branch nach außen, kein Pull Request, außer Max verlangt es.

---

## 0. Kaltstart: Wenn du dieses Projekt noch nicht kennst

**Was das ist:** „Duskwardens“, ein Web-Tower-Defense im Stil und Umfang von **Anime Adventures (AA,
Roblox)**. Gebaut von Max und Plori, **nur intern** (hinter Cloudflare Access). Läuft komplett im
Browser: deterministischer Simulator in TypeScript (`sim/`), Meta-Logik ohne DOM (`meta/`: Gacha,
Level, Evolution, Traits, Belohnungen, Speicherstand), Client mit Vite + PixiJS v8 (`client/`).
Speicherstand liegt lokal im Browser (IndexedDB); ein Server kommt später (M2).

**Lies in dieser Reihenfolge, bevor du etwas tust:**
1. `docs/design/ENTSCHEIDUNGEN.md` — verbindlich. **Der Abschnitt „Kurswechsel 07.10.2026“ ganz oben
   schlägt alles andere:** AA-Inhalte und Bilder erlaubt, Masse vor Feinschliff, Bots nur Rauchtest,
   hochwertiges eigenes Interface, jede Runde mit sichtbarem Ergebnis.
2. `docs/STATUS.md` — Stand, Pakettabellen, offene Fragen (mit Max' Antworten).
3. `docs/aa-import/` — `format.md` (Unit-Datenformat), `neue-unit.md`, `welten.md` (Welt = eine
   Datei), `massstab.md` (AA-Werte 1:1, 5 Studs = 1 Kachel, 1 Yen = 1 Münze), `report.md`
   (welche Units eingeschränkt laufen), `unsupported.md`.
4. Diese Datei.

Die Rohdaten aus der AA-Recherche liegen in `docs/anime-adventures/data/` (561 Units, 1.098 Angriffe,
22 Effekte, 219 Evolutionen, Traits, Banner, 144 Bosse, 22 Story-Welten, Legend Stages, Raids, Waves).
Der Importer: `npm run aa-import` (`tools/aa-import/`).

**Stand nach Runde 8** (`8dd45b4`): 550 AA-Units importiert, 540 spielbar, 61 davon eingeschränkt,
25 Crossover-Figuren (Rick Astley, Iron Man, …) mit eigenem Banner, 3 Welten × 6 Acts + Infinite,
neues Interface (Lobby, Summon-Reveal, Sammlung, Unit-Detail mit Evolution/Trait-Reroll, Match-HUD).
Tests: sim 325, meta 143, client 234, Smoke 305 Prüfungen auf 1280×720, 1920×1080, 2560×1440.

**Wer was macht:**
- **Du** baust und testest. **Du deployst nie.**
- Die **Homelab-Seite** (eine andere Claude-Session im Repo `flashkeks/homelab`, Doku dort unter
  `websites/towerdef/README.md`) baut die Preview `https://duskwardens.flashkeks.com` aus `dev`, auf
  Ansage von Max, und liefert die Porträts unter `/aa/units/<id>.webp` aus (`/aa/index.json`). Das
  AA-Wiki und andere Bildquellen sind **aus deiner Umgebung gesperrt**; lokal und in deinen
  Screenshots siehst du deshalb nur die gestalteten Ersatzkarten. Das ist normal.
- Neue Bilder brauchst du nicht zu besorgen: Trage für neue Figuren `imageQuery` ins Bild-Manifest
  `client/public/aa/manifest.json` ein, die Homelab-Seite holt sie.

---

## 1. Arbeitsweise und Budget (wichtig, Lehre aus Runde 8)

- Subagenten **immer `model: "sonnet"`**, auch für Kern-Umbauten. **Nie Opus**, auch nicht „nur für
  den schwierigen Teil“ (Runde 8 P1 lief mit Opus, das hat das Kontingent spürbar gefressen).
  Mechanisches darf `"haiku"` sein. Höchstens **3 Agenten gleichzeitig**.
- **Nutzungslimit kommt vor.** Runde 8 lief zweimal hinein. Deshalb:
  - Jeder Agent committet **spätestens alle 30 Minuten** einen Zwischenstand in seinen Arbeitszweig
    (`wip:`-Commit ist ok).
  - Nach einem Limit: Agenten **fortsetzen** (SendMessage), **nicht neu starten**. Erst den
    vorhandenen Stand sichern, dann weiter.
  - Fertige Pakete **sofort** nach `dev` mergen und pushen, nicht bis zum Rundenende sammeln.
- **Jedes Paket endet mit Screenshots** in `client/docs/r9/` und einer Zeile in STATUS: „Was man jetzt
  sehen kann“.
- **Keine Balance-Messreihen.** Bots nur als Rauchtest (Stage läuft ohne Absturz, eine starke Unit
  schafft Act 1). Keine Messläufe über 10 Minuten.
- Vor jedem Merge: Tests + Typecheck in `sim/`, `meta/`, `client/`, `npm run build`, `npm run smoke`.

---

## 2. Ziel dieser Runde (sichtbar)

1. **Fast alle Units voll spielbar:** aktive Fähigkeiten, Beschwörungen und Zweitangriffe als
   Bausteine. Ziel: von 61 eingeschränkten Units auf **unter 10**.
2. **10 spielbare Welten** statt 3, mit größeren Karten.
3. **Legend Stages und Raids spielbar.**
4. **Interface fertig:** alle Bildschirme im neuen Look, keine Reste aus der alten Welt.

---

## 3. Arbeitspakete

### P0 — Status (Hauptsitzung)
`docs/STATUS.md`: Runde-9-Tabelle, Runde 8 als abgeschlossen. Max' Entscheidung aus Runde 8 sofort
umsetzen: **Welten öffnen erst nach Act 6 der Vorwelt** (`unlock.afterAct` = 6 in jeder Welt-Datei).

### P1 — Fähigkeiten, Beschwörungen, Zweitangriffe (ein Agent, zuerst, `sim/` + Importer)
- Aktive Fähigkeiten als Baustein im Datenformat: Auslöser (Knopf / automatisch), Abklingzeit, Wirkung
  aus dem vorhandenen Effekt-Baukasten (Schaden, Fläche, Buff, Debuff, Zeitstopp …). Auto-Ability-
  Schalter wie in AA.
- Beschwörungen: die 11 AA-Beschwörungs-Einträge als eigene Wesen (laufen den Pfad entgegen oder
  stehen), Lebensdauer, Grenze je Beschwörer.
- Zweitangriffe (zweiter Angriff je Stufe, z. B. „+ Scatter“, „+ Kaminari“ in `levels[].note`).
- Importer neu laufen lassen, `report.md` aktualisieren. Client: Fähigkeits-Knopf im Unit-Panel und in
  der Unit-Leiste mit Abklingzeit-Ring.
- **Sichtbar:** Match-Screenshot mit ausgelöster Fähigkeit und einer Beschwörung.

### P2 — Welten 4–10 und größere Karten (ein Agent, nach P0, parallel zu P1, `sim/data/worlds/` + Client)
- Karten **größer als 17×11** (z. B. 24×14 oder je Welt passend), Kamera/Skalierung im Client
  entsprechend, freie Platzierung muss weiter funktionieren.
- 7 weitere Welten aus `maps.json` (Reihenfolge wie AA), je 6 Acts, eigene Pfadform und Farbwelt,
  AA-Bosse aus `enemies.json`. Welle-Anzahl und Modifikatoren aus `waves.json`.
- **Sichtbar:** Weltkarte mit 10 Welten, je ein Match-Screenshot aus Welt 4, 7 und 10.

### P3 — Legend Stages und Raids (ein Agent, nach P1, `sim/` + `meta/` + Client)
- Legend Stages (8 als Daten vorhanden): frei nach Act 6, Gegner-Resistenzen, Evolutions-Material als
  Belohnung (bindet Evolution an Spielinhalt statt nur Gold/Crystals).
- Raids (11 als Daten vorhanden): 20 Wellen, eigene Raid-Währung und kleiner Raid-Shop, garantierte
  Unit nach N Clears (`design-brief.md` § 6).
- **Sichtbar:** Weltkarte mit Legend-/Raid-Einträgen, ein Raid-Match, Raid-Shop.

### P4 — Interface komplett (ein Agent, nach P0, parallel, nur `client/`)
- Einstellungen, Hilfe, Pause, Ergebnis, Shop im neuen Design-System (`docs/design/ui.md`).
- **Alte Texte raus:** Lobby-Untertitel „Hold the line against the rift shadows“, „defend the
  terraces“ und alles weitere aus der früheren Welt „Grenzgilde“ durch AA-passende Texte ersetzen
  (`client/src/i18n/`). Grep nach `rift`, `terrace`, `ward`, `guild` als Prüfung.
- Lobby: Team-Anführer mit echtem Porträt groß, wenn vorhanden.
- **Sichtbar:** Screenshots aller überarbeiteten Bildschirme.

### P5 — Abschluss (Hauptsitzung)
Screenshots, `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 9
Was man jetzt sehen kann (5 Zeilen):
Units: voll / eingeschränkt / ausgeblendet:
Welten spielbar, Kartengröße:
Legend Stages, Raids:
Interface: was noch alt aussieht:
Neue imageQuery-Einträge für die Homelab-Seite:
Vorschlag Runde 10: 3–5 Sätze
Agenten (Anzahl, Modell), Limits erreicht wie oft:
Commits:
```

---

## 4. Was du nicht tust

- **Nichts deployen.** Keine Domain, kein Tunnel, kein Server.
- Keine Balance-Messreihen, kein Opus.
- `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen in STATUS unter „Offene Fragen“, mit
  Empfehlung.

> Ziel: Wer die Preview nach Runde 9 öffnet, kann sich durch 10 Welten spielen, Raids laufen, und fast
> jede der 550 Figuren tut, was sie in AA tut.
