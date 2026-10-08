# run.md — Runde 10: Echte Figuren, echte Bilder, und das Match sieht aus wie ein Spiel

Du arbeitest in `flashkeks/towerdef` auf dem Branch **`dev`**. Commit und Push nach jedem Paket.
Kein neuer Branch nach außen, kein Pull Request, außer Max verlangt es.

> Diese Datei ersetzt den ersten Runde-10-Auftrag (`docs/archiv/run-runde10-alt.md`), der nie lief.
> Grund: Max hat Runde 9 am 08.10.2026 gespielt, Rückmeldung siehe Abschnitt 2.
> **Welten 11–22 sind auf Runde 11 verschoben**, Look geht vor Masse.

---

## 0. Kaltstart: Wenn du dieses Projekt noch nicht kennst

**Was das ist:** „Duskwardens“, ein Web-Tower-Defense im Stil und Umfang von **Anime Adventures (AA,
Roblox)**. Gebaut von Max und Plori, **nur intern** (hinter Cloudflare Access). Läuft komplett im
Browser: deterministischer Simulator in TypeScript (`sim/`), Meta-Logik ohne DOM (`meta/`: Gacha,
Level, Evolution, Traits, Belohnungen, Speicherstand), Client mit Vite + PixiJS v8 (`client/`).
Speicherstand liegt lokal im Browser (IndexedDB); ein Server kommt später (M2).

**Lies in dieser Reihenfolge, bevor du etwas tust:**
1. `docs/design/ENTSCHEIDUNGEN.md` — verbindlich. **Ganz oben „Look-Wechsel 08.10.2026“**, dann
   „Kurswechsel 07.10.2026“. Beide schlagen alles, was weiter unten steht.
2. `docs/STATUS.md` — Stand, Pakettabellen, offene Fragen (mit Max' Antworten).
3. `docs/aa-import/` — `format.md` (Unit-Datenformat), `neue-unit.md`, `welten.md`, `massstab.md`,
   `report.md`, `unsupported.md`.
4. Diese Datei.

Rohdaten aus der AA-Recherche: `docs/anime-adventures/data/` (561 Units, 1.098 Angriffe, 22 Effekte,
Evolutionen, Traits, Banner, Bosse, Welten, Legend Stages, Raids, Waves). Importer: `npm run aa-import`.

**Stand nach Runde 9** (`70854b0`, seit 08.10.2026 auf der Preview): 550 AA-Units (542 voll),
Fähigkeiten mit Auto-Schalter, Beschwörungen, Zweitangriffe; 25 Crossover-Figuren mit eigenem Banner;
10 Welten × 6 Acts + Infinite; 8 Legend Stages, 11 Raids mit Raid-Shop; alle Bildschirme außerhalb des
Matches im neuen Look. Spielstand Schema 3.
Tests: sim 381, meta 168, client 252, Smoke 323 Prüfungen.

**Wer was macht:**
- **Du** baust und testest. **Du deployst nie.**
- Die **Homelab-Seite** (andere Claude-Session im Repo `flashkeks/homelab`, Doku dort unter
  `websites/towerdef/README.md`) baut die Preview `https://duskwardens.flashkeks.com` aus `dev` auf
  Ansage von Max und **holt alle Bilder** auf `edge` (AniList, Wikipedia, Fandom sind aus deiner
  Umgebung gesperrt). Ausgeliefert unter `/aa/units/<id>.webp`, Liste in `/aa/index.json`. Lokal und in
  deinen Screenshots siehst du nur die Ersatzkarten. Das ist normal.
- Du lieferst der Homelab-Seite **Daten**: welches Bild zu welcher Unit gehört (Manifest, P1).

---

## 1. Arbeitsweise und Budget

- Subagenten **immer `model: "sonnet"`**. **Nie Opus.** Mechanisches darf `"haiku"` sein.
  Höchstens **3 Agenten gleichzeitig**.
- **Nutzungslimit kommt vor** (Runde 8 zweimal, Runde 9 einmal):
  - Jeder Agent committet **spätestens alle 30 Minuten** einen Zwischenstand (`wip:` ist ok).
  - Nach einem Limit: Agenten **fortsetzen** (SendMessage), **nicht neu starten**.
  - Fertige Pakete **sofort** nach `dev` mergen und pushen.
- **Jedes Paket endet mit Screenshots** in `client/docs/r10/` und einer Zeile in STATUS: „Was man
  jetzt sehen kann“.
- **Keine Balance-Messreihen.** Bots nur als Rauchtest.
- Vor jedem Merge: Tests + Typecheck in `sim/`, `meta/`, `client/`, `npm run build`, `npm run smoke`.

---

## 2. Was Max nach Runde 9 gesagt hat (08.10.2026, sinngemäß)

- „Deutlich besser als die ersten Versuche. Das Interface finde ich gut.“
- **„Das Summonen sieht echt ungeil aus.“** Allgemein **mehr Soundeffekte, mehr visuelle Effekte.**
- **Daily Pack:** man sieht nur den ersten Gewinn, man kann sich nicht durchklicken. „Die
  Interaktionen funktionieren noch nicht so ganz, oder es fehlen welche.“
- **Die Bilder sind 1:1 von AA, das sind alles Roblox-Charaktere. Sieht scheiße aus.** Eigene bzw.
  echte Bilder der Figuren aus dem Netz.
- **Viele Figuren sind bescheuert benannt.** Echte Anime-Charaktere, am besten bekannte. Und bekannte
  Personen („Donald Trump oder so“). „Denkt euch was aus.“
- **Im Match** stehen auf platzierten Units nur Buchstaben. Units brauchen ein Design, **Attacken
  auch.** „Da fehlt noch ordentlich was.“

Daraus die Ziele dieser Runde:
1. **Jede Unit ist eine echte, bekannte Figur** mit echtem Namen und Serie, dazu ein Promi-Banner.
2. **Das Match sieht aus wie ein Spiel:** Figuren statt Buchstaben, Angriffe mit Grafik, Treffer,
   Tod, Fähigkeit, Ton.
3. **Beschwören ist ein Höhepunkt**, Mehrfach-Ergebnisse lassen sich durchklicken, überall Ton und
   Rückmeldung.

---

## 3. Arbeitspakete

Parallel: **P1, P2, P3** (je ein Agent). P4 startet, sobald einer davon fertig ist.

### P0 — Status (Hauptsitzung, zuerst)
- `docs/STATUS.md`: Runde-10-Tabelle, Runde 9 abgeschlossen, Max' Rückmeldung (Abschnitt 2) als
  Kurzzeile.
- **Raid-Units aus dem Banner-Pool** (Entscheidung Max, Runde 9): wie AA `hideFromBanner`, Test dazu;
  wer sie schon gezogen hat, **behält** sie.

### P1 — Echte Figuren (ein Agent; `tools/aa-import/`, `sim/data/`, `client/public/aa/manifest.json`, Texte)
Ziel: In Sammlung, Banner, Team, Match steht überall ein echter Name, und für jede Unit weiß die
Homelab-Seite, welches Bild sie holen soll. **Werte, Angriffe, Kits bleiben unverändert** (nur
Name, Serie, Bild ändern sich). IDs bleiben stabil (Spielstände!).

1. **Zuordnungstabelle** `docs/aa-import/figuren.json` (eine Zeile je Unit, auch Evolutionen):
   `{ id, aaName, name, series, form?, anilistQuery, note? }`.
   - `name` = echter Name, wie Fans ihn kennen (Englisch/Romaji wie auf AniList: „Kakashi Hatake“,
     „Monkey D. Luffy“, „Satoru Gojo“). `series` = Serie („Naruto“, „One Piece“).
   - `form` für Formen derselben Figur („Super Saiyan Blue“, „Gear 5“, „Mugetsu“) — Anzeige
     „Son Goku (Super Saiyan Blue)“.
   - Die AA-Parodienamen (`nameRR`, `nameLegacy`, z. B. „Carrot“ = Goku, „Copy Ninja“ = Kakashi,
     „Joykid“ = Luffy) und die Unit-ID helfen bei der Zuordnung. Du kennst die Serien; nimm dein
     Wissen. Wo du unsicher bist: `note: "unsicher"`, nicht raten und verstecken.
   - **Unbekannte/generische Units** (z. B. `aot_generic`, `britannia_soldier`, Wesen ohne echte
     Vorlage): auf eine **bekannte Figur derselben Serie** umstellen, die noch nicht im Bestand ist
     (Rolle passend: Fernkämpfer bleibt Fernkämpfer). `note: "umgemünzt von …"`.
   - **Dubletten** (zwei Units = dieselbe Figur, gleiche Form): eine davon umstellen wie oben.
2. **Anzeige:** Name + darunter Serie (klein) in Karte, Detail, Banner, Ergebnis, Match-Panel.
   AA-Namen nur noch in den Daten, nicht mehr sichtbar. Suche/Filter in der Sammlung nach Serie.
3. **Bild-Manifest** `client/public/aa/manifest.json` je Unit um `name`, `series`, `anilistQuery`
   (z. B. `"Kakashi Hatake"`) ergänzen; `source: "anilist"` statt `"aa"`. Das Feld `wiki` bleibt nur
   als Rückfall stehen. Der Client zeigt weiter `/aa/units/<id>.webp`, wenn die ID in `/aa/index.json`
   steht — **daran ändert sich nichts**, die Homelab-Seite tauscht nur die Dateien aus.
4. **Promi-Banner „Legends of Earth“** (neu, wie das Crossover-Banner, `source: "custom"`,
   `imageQuery` = Wikipedia-Seitentitel). Vorschlag der Homelab-Seite, 25 Figuren; Kits aus den
   vorhandenen Bausteinen (22 Effekte, 5 Angriffsformen, Fähigkeiten), **nur Daten**, mit Witz,
   nicht beleidigend. Austauschen erlaubt, wenn dir Besseres einfällt (in STATUS begründen):

   | Seltenheit | Figuren (Idee für Fähigkeit) |
   |---|---|
   | Secret | Donald Trump („Tariff“: Gegner langsamer + zahlen Gold), Elon Musk (Rakete, ganze Bahn), Arnold Schwarzenegger („I'll be back“: steht einmal wieder auf) |
   | Mythic | Dwayne „The Rock“ Johnson, Bruce Lee, Albert Einstein (Zeit verlangsamen), Napoleon Bonaparte (Buff für Nachbarn), Angela Merkel (Raute: Schild für alle) |
   | Legendary | Barack Obama, Mark Zuckerberg, Jeff Bezos (Gold-Bonus), Snoop Dogg, Gordon Ramsay (Feuer), Cristiano Ronaldo, Lionel Messi |
   | Epic | MrBeast (Gold-Regen), PewDiePie, Taylor Swift, Jackie Chan, Bill Gates |
   | Rare | Dieter Bohlen, Knossi, MontanaBlack, Steve Irwin |

5. **Sichtbar:** Sammlung nach Serie gefiltert (Naruto, One Piece, Dragon Ball), ein Banner, das
   Promi-Banner, Unit-Detail mit echtem Namen.
6. **Sobald `figuren.json` und das Manifest stehen: sofort pushen** und in STATUS unter „Für die
   Homelab-Seite“ melden („Manifest mit anilistQuery steht, Commit X“). Die Homelab-Seite holt dann
   die Bilder, **ohne auf das Rundenende zu warten**. Die restlichen P1-Punkte danach.

### P2 — Das Match (ein Agent, nur `client/`)
Ziel: Ein Screenshot aus dem Match sieht aus wie aus einem fertigen Spiel.
- **Units auf dem Feld:** Porträt-Figur statt Kreis mit Buchstaben — rund oder als Karte mit
  Seltenheits-Ring/-Rahmen, Schatten, leichtes Wippen im Stand, **Blickrichtung zum Ziel**,
  Stufen-Pips, Element-Symbol. Ohne Bild: gestaltete Ersatzfigur (Silhouette + Serienfarbe), nie
  nackte Initialen. Platzieren: Vorschau mit Reichweitenkreis, Aufsetz-Effekt + Ton.
- **Angriffe mit Grafik**, abhängig von **Angriffsform** (Einzel, Kreis, Kegel, Linie, ganze Bahn)
  und **Element** (`damageType`: physical, fire, water, lightning, …):
  Hieb-Bogen für Nahkampf, Projektil mit Schweif für Fernkampf, Strahl für Linie, Druckwelle für
  Kreis, Fächer für Kegel; Farbe und Partikel je Element. Rückstoß/Aufleuchten der Unit beim Angriff.
- **Treffer und Tod:** Schadenszahlen (Krit größer/gelb), Treffer-Funken, Gegner blinkt, Tod mit
  kurzer Auflösung + Münz-Effekt. **Fähigkeit:** Ganzbild-Ansage mit Porträt (Schnitt wie in Gacha-
  Spielen), Bildschirmruckeln bei großen Treffern (abschaltbar).
- **Gegner:** gestaltete Figur je Gegner-Typ (Silhouette, Farbe, Größe nach Typ), HP-Balken im neuen
  Stil, Bosse groß mit Namensbanner und Auftritts-Effekt. (Gegner-Bilder kommen später.)
- **Ton im Match:** Platzieren, Upgrade, Verkaufen, Angriff je Element (dezent, nicht jeder Schuss
  laut), Treffer, Tod, Boss-Auftritt, Welle startet, Sieg, Niederlage. Lautstärke-Regler gibt es schon
  (sonst einbauen).
- **Leistung:** 60 FPS bei 80 Gegnern + 30 Units auf 1920×1080 halten (Partikel begrenzen, Pools).
- **Sichtbar:** Match-Screenshots mit vielen Units (Nahkampf, Fernkampf, Fläche), Fähigkeit-Ansage,
  Boss; ein kurzes Video oder GIF, falls dein Screenshot-Skript das kann.

### P3 — Beschwören, Pakete, Rückmeldung (ein Agent, `client/` + ggf. `meta/`)
- **Beschwören neu:** Aufbau-Animation (Portal/Riss, Licht sammelt sich), **Farbe verrät die
  Seltenheit** vorab (Blau → Lila → Gold → Regenbogen für Secret), Ruckeln + Partikelexplosion,
  große Enthüllung mit Porträt, Name, Serie, Seltenheit, „NEW“-Stempel; Shiny mit Glitzer. Eigener
  Ton je Stufe, Secret/Mythic mit besonderem Stinger. **Überspringen** per Klick/Taste jederzeit.
- **Mehrfach-Ergebnisse** (10er-Zug, Daily Pack, Raid-Belohnungen, Meilensteine, Shop-Pakete):
  Karten liegen verdeckt, **einzeln aufdecken per Klick**, „Alle aufdecken“, danach **Übersicht aller
  Gewinne** (Raster), höchste Seltenheit zuletzt. Heute sieht man nur den ersten — das ist ein Fehler,
  Test dazu.
- **Interaktions-Durchgang:** alle Knöpfe, die etwas öffnen/abholen/kaufen (Daily, Shop, Raid-Shop,
  Meilensteine, Evolution, Level-Up, Einstellungen, Import/Export) einmal durchklicken (Smoke-Skript
  erweitern): reagiert jeder sichtbar (Animation, Ton, Ergebnis)? Fehlendes nachrüsten, Liste in STATUS.
- **Ton und Effekte im Menü:** Hover/Klick, Währung erhalten (Zähler läuft hoch), Level-Up, Evolution,
  Freischaltung; dezente Hintergrundmusik je Bildschirm (abschaltbar).
- **Sichtbar:** Screenshot-Serie eines 10er-Zugs (Aufbau, Enthüllung, Übersicht), Daily Pack
  durchgeklickt.

### Ton und Grafik-Material (gilt für P2/P3)
- Freie Packs sind erlaubt (Lizenz egal, Herkunft in `ATTRIBUTIONS.md`). Gute Quellen: **Kenney**
  (kenney.nl, CC0: Interface/Impact/RPG Sounds, Particle Pack), OpenGameArt, freesound (CC0).
- **Ist der Download aus deiner Umgebung gesperrt:** Wunschliste mit direkten URLs in STATUS unter
  „Für die Homelab-Seite“; die Homelab-Seite lädt sie und committet sie nach `client/public/sfx/`
  bzw. `client/public/fx/`. Bis dahin: Töne per WebAudio synthetisieren, Effekte per Pixi-Grafik.
- Nichts davon blockiert das Paket: erst bauen mit Ersatz, Dateien tauschen sich später aus.

### P4 — Karten-Grafik je Welt (ein Agent, sobald P1, P2 oder P3 frei ist; `client/` + `sim/data/worlds/`)
- Jede der 10 Welten bekommt ein **Kartenthema** (Boden, Pfad, Deko, Hintergrund, Lichtstimmung) als
  Daten. Pfad mit Rand und Tiefe, Platzierungszonen beim Setzen deutlich, sonst dezent. Kein
  Raster-Look mehr. Umsetzung frei (gemalte Kacheln per Code, Texturen, freie Packs wie oben).
- **Sichtbar:** je Welt ein Screenshot der leeren Karte + einer mitten im Kampf.

### P5 — Abschluss (Hauptsitzung)
Screenshots, `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 10
Was man jetzt sehen kann (5 Zeilen):
Figuren: echte Namen (Zahl), umgemünzt (Zahl + Liste), unsicher (Liste), Promi-Banner:
Match: Units / Angriffe / Treffer / Ton — was neu ist:
Beschwören + Mehrfach-Ergebnisse:
Interaktions-Durchgang: was fehlte, was nachgerüstet ist:
Für die Homelab-Seite (Manifest-Commit, Asset-URLs):
Vorschlag Runde 11: 3–5 Sätze (gesetzt: Welten 11–22; Kandidaten: Gegner-Bilder, Server/Konto M2)
Agenten (Anzahl, Modell), Limits erreicht wie oft:
Commits:
```

---

## 4. Bilder

- Units: `/aa/units/<id>.webp` (256×256). Die Homelab-Seite **ersetzt** die Roblox-Bilder durch
  AniList-Bilder (bzw. Wikipedia für Promis/Crossover), Grundlage ist dein Manifest aus P1.
  Pfad und `/aa/index.json` bleiben gleich, am Client ändert sich nichts.
- Großes Porträt für Enthüllung und Detail: wenn du größer als 256 px brauchst, sag es in STATUS
  (z. B. `/aa/units-lg/<id>.webp`, 512 px), die Homelab-Seite legt es dazu.
- Gegner-Bilder: nicht in dieser Runde.

## 5. Was du nicht tust

- **Nichts deployen.** Keine Domain, kein Tunnel, kein Server.
- Keine Balance-Messreihen, kein Opus.
- Werte/Kits der AA-Units nicht anfassen (nur Name, Serie, Bild).
- `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen in STATUS unter „Offene Fragen“.

> Ziel: Max öffnet das Spiel und sieht Goku, Luffy, Gojo und Donald Trump statt Roblox-Klötzen, das
> Beschwören knallt, und ein Screenshot aus dem Match sieht aus wie aus einem fertigen Spiel.
