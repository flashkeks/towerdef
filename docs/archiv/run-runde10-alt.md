# run.md — Runde 10: Das Spielfeld sieht aus wie ein echtes Spiel, und alle 22 Welten

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

**Stand nach Runde 9** (`70854b0`): 550 AA-Units (542 voll, 5 eingeschränkt, 3 ausgeblendet),
aktive Fähigkeiten mit Auto-Schalter, Beschwörungen, Zweitangriffe; 25 Crossover-Figuren mit eigenem
Banner; **10 Welten** × 6 Acts (Karten bis 24×14, nächste Welt nach Act 6) + Infinite; 8 Legend
Stages (Evolutions-Material), 11 Raids (Raid-Marken, Raid-Shop, garantierte Unit nach 10 Siegen);
alle Bildschirme außerhalb des Matches im neuen Look. Schema 3 des Spielstands.
Tests: sim 381, meta 168, client 252, Smoke 323 Prüfungen auf 1280×720, 1920×1080, 2560×1440.

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

Nach Runde 9 sieht alles außerhalb des Matches hochwertig aus, **das Spielfeld aber nicht**:
einheitliche grüne Pixel-Kacheln, Gegner als lila Blobs, Units als Kreise mit Initialen. Diese Runde:

1. **Spielfeld im neuen Look:** jede Welt mit eigener Karten-Grafik, Gegner mit Bild, Units als
   Mini-Porträt mit Seltenheits-Ring, Effekte und Treffer im neuen Stil.
2. **Alle 22 Story-Welten** spielbar (heute 10), Legend Stages auf ihren eigenen Welten.
3. **Raid-Units aus dem Banner** (Entscheidung Max), nur über Raid/Raid-Shop.

---

## 3. Arbeitspakete

### P0 — Status (Hauptsitzung)
`docs/STATUS.md`: Runde-10-Tabelle, Runde 9 abgeschlossen. **Raid-Units aus dem Banner-Pool nehmen**
(wie AA `hideFromBanner`), Test dazu, Migration für Spielstände, die sie schon gezogen haben
(behalten, nicht erstatten).

### P1 — Units und Gegner auf dem Feld (ein Agent, nur `client/`)
- **Units:** rundes **Mini-Porträt** (aus `/aa/units/<id>.webp`, sonst Fallback) mit Seltenheits-Ring,
  Element-Punkt, Stufen-Pips, kleiner Schatten; kurze Angriffs-Animation (Rückstoß/Aufleuchten),
  Fähigkeit bereit = pulsierender Ring.
- **Gegner:** Bild je Gegner-Typ und Boss, wenn vorhanden (`/aa/enemies/<id>.webp`, Manifest-Eintrag
  wie bei Units, Abschnitt 4), sonst **gestaltete Silhouette je Typ** (nicht mehr Blob), HP-Balken im
  neuen Stil, Schild/Rüstung/Element als Symbol. Bosse groß mit Namensbanner.
- Treffer-, Tod- und Fähigkeits-Effekte im neuen Design-System (Farben aus `docs/design/ui.md`).
- **Sichtbar:** Match-Screenshots in drei verschiedenen Welten, Boss-Kampf, Fähigkeit.

### P2 — Karten-Grafik je Welt (ein Agent, `client/` + `sim/data/worlds/`)
- Jede Welt bekommt ein **Kartenthema** (Boden, Pfad, Deko, Hintergrund, Lichtstimmung) als Daten:
  z. B. Planet Greenie Wiese, Sand Village Wüste, Snowy Town Schnee, Haunted Academy Holz/Schatten.
  Umsetzung frei: gemalte Kacheln per Code, Textur-Generator, freie Asset-Packs aus dem Netz
  (Lizenz egal, Herkunft in `ATTRIBUTIONS.md`; wenn ein Download gesperrt ist: Wunschliste mit URL in
  STATUS, die Homelab-Seite holt es).
- Pfad mit Rand und Tiefe, Platzierungszonen beim Setzen deutlich, sonst dezent. Kein Raster-Look mehr.
- **Sichtbar:** je Welt ein Screenshot der leeren Karte (10, später 22).

### P3 — Welten 11–22 (ein Agent, nach P0, parallel zu P1/P2, `sim/data/worlds/`)
- Die restlichen 12 Story-Welten aus `maps.json` als Dateien (Pfad, Zonen, Thema-Schlüssel für P2,
  Bosse aus `enemies.json`, Wellen/Modifikatoren aus `waves.json`). Reihenfolge wie AA, Freischaltung
  nach Act 6.
- Legend Stages auf ihre eigene Welt umhängen (Entscheidung Runde 9: eine Zeile je Stage).
- Gegner-Liste je Welt ins Bild-Manifest (`client/public/aa/manifest.json`, Abschnitt `enemies`: ID,
  Name, erwarteter Wiki-Dateiname), damit die Homelab-Seite die Gegner-Bilder holen kann.
- **Sichtbar:** Weltkarte mit 22 Welten, je ein Match-Screenshot aus Welt 11, 16, 22.

### P4 — Abschluss (Hauptsitzung)
Screenshots, `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 10
Was man jetzt sehen kann (5 Zeilen):
Spielfeld: Units / Gegner / Karten — was neu ist:
Welten spielbar (Zahl), Legend Stages umgehängt:
Neue Bild-Wünsche für die Homelab-Seite (Gegner-Manifest, Asset-URLs):
Vorschlag Runde 11: 3–5 Sätze (Kandidaten: Server/Konto M2, Koop, Events/Portale)
Agenten (Anzahl, Modell), Limits erreicht wie oft:
Commits:
```

---

## 4. Bilder

Die Homelab-Seite holt Bilder auf `edge` und liefert sie auf der Preview unter `/aa/` aus:
- Units: `/aa/units/<id>.webp` (läuft seit Runde 8; Crossover und 88 AA-Lücken folgen).
- **Neu:** Gegner/Bosse unter `/aa/enemies/<id>.webp`, `/aa/index.json` bekommt einen Abschnitt
  `enemies`. Grundlage ist dein Manifest-Abschnitt `enemies` (P3). Bis dahin: Fallback-Silhouetten.

## 5. Was du nicht tust

- **Nichts deployen.** Keine Domain, kein Tunnel, kein Server.
- Keine Balance-Messreihen, kein Opus.
- `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen in STATUS unter „Offene Fragen“.

> Ziel: Ein Screenshot aus dem Match sieht aus wie aus einem fertigen Spiel, und man kann sich durch alle
> 22 Welten von Anime Adventures spielen.
