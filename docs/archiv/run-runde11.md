# run.md — Runde 11: Neustart wie Bloons TD 6, als Vertical Slice in Pixel-Art

Du arbeitest in `flashkeks/towerdef` auf dem Branch **`dev`**. Commit und Push nach jedem Paket.
Kein neuer Branch nach außen, kein Pull Request, außer Max verlangt es.

---

## 0. Kaltstart: Wenn du dieses Projekt noch nicht kennst

**Was das ist:** „Duskwardens“, ein Web-Tower-Defense von Max und Plori, **nur intern** (hinter Cloudflare
Access). Läuft komplett im Browser: deterministischer Simulator in TypeScript (`sim/`), Meta-Logik ohne DOM
(`meta/`: Fortschritt, Freischaltungen, Speicherstand), Client mit Vite + PixiJS v8 (`client/`).
Speicherstand lokal im Browser (IndexedDB).

**Was gerade passiert:** Runde 4–10 haben ein Anime-Adventures-Klon gebaut (550 importierte Units, Gacha,
AniList-Bilder). Max hat Runde 10 gespielt und **neu entschieden (09.10.2026): wir bauen das Spiel wie
Bloons TD 6** — wenige, durchdachte Türme mit Upgrade-Pfaden, alles in **eigener Pixel-Art**, viel zum
Freischalten. Anime-Figuren sind **nicht** mehr Pflicht; eigene Figuren sind ausdrücklich erwünscht.
Diese Runde baut davon einen **Vertical Slice**: wenig Inhalt, aber in der Qualität des fertigen Spiels.

**Lies in dieser Reihenfolge, bevor du etwas tust:**
1. `docs/design/ENTSCHEIDUNGEN.md` — **ganz oben „Neustart als BTD6-artiges Spiel (09.10.2026)“**. Das schlägt
   alles darunter (Look-Wechsel, Kurswechsel, AA-Import sind überholt).
2. `docs/games/btd6/` — **die Recherche, an die wir uns halten**: `overview.md`, `mechanics.md` (Crosspath,
   Targeting, Angriffszyklus, Status), `units.md` (26 Türme, Werte, Rollen, Helden), `economy.md`
   (Einkommen, Kostenkurve, Verkauf), `enemies-waves.md` (Gegner-Schichten, RBE, Rundenliste),
   `meta.md` (Level, Freischaltung, Knowledge), `design-lessons.md` (11 Lehren — gelten).
3. `docs/STATUS.md`, dann diese Datei.

Max' Replay vom 09.10.: `docs/balancing/playtests/2026-10-09-max-normal-loss.json` (altes Regelwerk, nur als
Beleg für die Probleme: Schaden vor Animation, 40× Stärkeunterschied).

**Wer was macht:**
- **Du** entwirfst, baust und testest. **Du deployst nie.**
- Die **Homelab-Seite** (andere Claude-Session, Repo `flashkeks/homelab`, `websites/towerdef/README.md`)
  baut die Preview `https://duskwardens.flashkeks.com` aus `dev` auf Ansage von Max.
- **Keine Fremdbilder** mehr für Türme, Gegner, Karte: alles wird **im Code gezeichnet** (Abschnitt 3).

---

## 1. Arbeitsweise und Budget

- Subagenten **immer `model: "sonnet"`**, auch beim Fortsetzen per SendMessage (Runde 10 lief dabei
  versehentlich auf Opus ins Wochenlimit — beim Fortsetzen das Modell ausdrücklich mitgeben). **Nie Opus.**
  Mechanisches darf `"haiku"` sein. Höchstens **3 Agenten gleichzeitig**.
- **Nutzungslimit kommt vor.** WIP-Commit spätestens alle 30 min; nach Limit **fortsetzen, nicht neu starten**;
  fertige Pakete sofort mergen.
- **Jedes Paket endet mit Screenshots** in `client/docs/r11/` (und wo Bewegung zählt: kurze GIF/WebM aus dem
  Screenshot-Skript) und einer Zeile in STATUS: „Was man jetzt sehen kann“.
- Vor jedem Merge: Tests + Typecheck in `sim/`, `meta/`, `client/`, `npm run build`, `npm run smoke`.
- **Balance diesmal ernst, aber begrenzt:** Werte werden je Turm **entworfen** (Tabelle mit Begründung), dann
  per Bot-Lauf geprüft (Abschnitt 4, P5). Keine Messreihen über Stunden.

---

## 2. Ziel dieser Runde (sichtbar)

Max öffnet die Preview und spielt **eine wunderschöne Pixel-Karte, 20 Runden, mit 3 Türmen und 1 Helden**,
jeder Turm mit **3 Pfaden × 5 Stufen**, und jede gekaufte Stufe **sieht man am Turm**. Treffer landen,
wenn das Projektil ankommt. Nach dem Match steigt sein Spieler-Level, Türme sammeln XP und schalten
Upgrades frei, es gibt einen kleinen Wissensbaum. Er soll sagen: **„So ist es geil, davon mehr.“**

Was **nicht** in diese Runde gehört: weitere Türme, Gacha, mehrere Karten, Koop, Server.

---

## 3. Leitplanken für Inhalt und Grafik

### Welt und Figuren (eigene, du entscheidest)
- Name bleibt **Duskwardens**: Wächter einer Stadt am Rand der Dämmerung gegen Kreaturen aus dem Zwielicht.
  Ausgestalten darfst du frei (in `docs/design/welt.md`, kurz). Ton: hell, verspielt, lesbar wie BTD6 —
  nicht düster-matschig.
- **Gegner mit Schichten wie Bloons** (BTD6-Kern, siehe `enemies-waves.md`): ein Treffer knackt eine Hülle,
  darunter kommt die nächste, kleinere Form (sichtbar!). Dazu RBE als eine Zahl für Rundenstärke. Für den
  Slice: **5–7 Gegnertypen** inkl. schnell, gepanzert (braucht Explosion o. ä.), getarnt (braucht
  Erkennung), Flieger optional, **ein Boss in Runde 20** (großer Gegner mit Hülle, wie ein MOAB).
- **3 Türme, je eine klare Rolle** (Vorschlag, Namen/Figuren frei):
  1. **Schütze** (billig, Einzelziel, wie Dart): Pfade z. B. Durchschlag / Schussrate / Reichweite+Tarnung.
  2. **Bombardier** (Fläche, knackt Panzer, wie Bomb): Pfade z. B. Explosion größer / Splitter / Betäubung.
  3. **Frostmagier** (Kontrolle, wie Ice/Wizard): Pfade z. B. Verlangsamen / Einfrieren+Schaden / Blitz.
  Wenn du eine bessere Dreierbesetzung siehst (z. B. Farm statt Magier, weil Ökonomie wichtiger ist):
  begründen in STATUS, dann machen.
- **1 Held** (wie BTD6: einmal pro Match, Level 1–20 durch XP im Match, bei bestimmten Leveln
  Fähigkeiten, zwei aktive Fähigkeiten mit Abklingzeit). Eigene Figur.
- **Crosspath wie BTD6:** ein Pfad bis 5, ein zweiter bis 2, der dritte 0.
- **Kostenkurve wie BTD6** (`design-lessons.md` Lehre 4): grob T1 0,6×, T3 3,3×, T4 12×, T5 80× Basispreis.
  **Einkommen wie BTD6** (Lehre 2): Pop-Cash, Rundenbonus 100 + Runde, Verkauf 70 %.
- **Faustregel gegen Runde-10-Fehler:** Kein Turm darf bei gleichem Geldeinsatz mehr als ~2× den
  Schaden eines anderen machen, außer gegen seine Spezialität. Für jede Stufe: Kosten, DPS, Pierce,
  Reichweite, Effekt in einer Tabelle (`docs/design/tuerme.md`).

### Pixel-Art im Code (wie im Kek-Game)
- Max' Vorbild ist das **Kek-Game** (`flashkeks/snake`, `public/pfx.js`, `public/bfx.js`, `public/afx.js`):
  dort sind alle Figuren, Gegner, Bosse und Karten als **Pixel-Sprites im Code** gezeichnet (Paletten-
  Raster bzw. Zeichenbefehle → Canvas/Textur), dazu ein **Pixel-Render-Pass** (grob rendern, scharf
  hochskalieren, Text scharf drüber). Wenn du Leserechte auf das Repo bekommst, schau es dir an; sonst
  nach dieser Beschreibung.
- **Ein Stilsystem, bevor du Sprites malst** (`docs/design/pixel-stil.md`): Grundraster (z. B. 32×32 für
  Türme, 16–24 für kleine Gegner, ×3 hochskaliert), **feste Palette** (~32 Farben), Umriss-Regel, Licht von
  oben links, Schattenwurf, wie Animationen aufgebaut sind (Idle 2–4 Frames, Angriff 3–5 Frames, Treffer-Blitz).
- **Upgrade-Stufen sichtbar:** Sprites aus Teilen zusammensetzen (Basis + Pfad-Teile je Stufe: Helm,
  Waffe, Umhang, Aura …), damit 3 Türme × 15 Stufen nicht 45 Einzelbilder brauchen, aber jede Stufe
  unterscheidbar ist. Stufe 5 darf groß und spektakulär sein.
- **Projektile und Effekte ebenfalls Pixel** (Pfeil mit Schweif, Bombenbogen + Explosion, Eisstrahl/Splitter,
  Blitz). Gegner-Schichten platzen sichtbar auf.
- **Die Karte muss schön sein** (Max: „sieht wirklich scheiße aus“): handgebaute Pixel-Karte mit Weg, Rand,
  Gras-Variationen, Wasser mit Animation, Bäume, Häuser der Stadt, Licht/Schatten, kleine Bewegung
  (Fahnen, Glühwürmchen, Wasser). Vorbild-Qualität: BTD6-Karten, nur in Pixel.
- Das Interface aus Runde 9/10 (Lobby, Menüs, Ton) bleibt die Basis; es soll zur Pixel-Welt passen
  (Pixel-Rahmen/Schrift, wo es hilft), muss aber nicht komplett neu.

---

## 4. Arbeitspakete

Reihenfolge: **P0** zuerst, dann **P1, P2, P3 parallel**, **P4** sobald einer frei ist, **P5** zum Schluss.

### P0 — Aufräumen und Entwurf (Hauptsitzung)
1. **Archiv:** Git-Tag `archiv/aa-runde10` auf den aktuellen Stand, pushen. Dann AA-Import, die 550 Units,
   Banner, Gacha-Ziehung, Evolution, Trade/Reroll, Crossover/Promis, `client/public/aa/` aus dem
   **aktiven** Spiel entfernen (Code und Tests, die nur dafür da waren). `docs/anime-adventures/` bleibt
   als Recherche liegen. Lieber gründlich entfernen als totes Zeug mitschleppen.
2. **Speicherstand:** neues Schema; alte Spielstände werden **zurückgesetzt** (Max weiß das: „wir löschen
   alle Summons und alles“), mit einmaligem Hinweis-Bildschirm.
3. **Entwurf** in `docs/design/`: `welt.md` (kurz), `tuerme.md` (3 Türme × 15 Stufen + Held, alle Zahlen),
   `gegner.md` (Schichten, RBE, Boss), `runden.md` (Runde 1–20 fest, nach BTD6-Muster), `meta.md`
   (Abschnitt P4). Zahlen mit Begründung aus `docs/games/btd6/`. **Nicht auf Max warten** — er will
   Ergebnisse sehen; Entscheidungen, bei denen du unsicher bist, mit Empfehlung in STATUS.
4. STATUS: Runde-11-Tabelle.

### P1 — Simulator (ein Agent, `sim/`)
- **Projektile mit Flugzeit:** Schaden zählt erst beim Auftreffen (Max: „Schaden kommt, bevor die Attacke
  ankommt“). Deterministisch, Ziel kann vorher sterben → Projektil fliegt weiter/verfällt wie in BTD6
  (`mechanics.md` § 3). Sofort-Treffer nur, wo es sichtbar sofort ist (Blitz, Strahl).
- **Gegner-Schichten** mit Kindern, RBE, Eigenschaften (Panzer, Tarnung, schnell), Boss mit Hülle.
- **3 Pfade × 5 Stufen**, Crosspath-Regel, Targeting-Modi (First/Last/Strong/Close), Verkauf 70 %.
- **Held:** XP im Match, Level 1–20, zwei Fähigkeiten.
- **Runden 1–20** als Daten, Einkommen nach BTD6.
- Tests für alles davon; alte AA-spezifische Tests raus.

### P2 — Pixel-Grafik (ein Agent, `client/`)
- Stilsystem aus Abschnitt 3 umsetzen (Palette, Raster, Render-Pass), dann: 3 Türme mit allen 15 Stufen
  sichtbar, Held mit Leveln, alle Gegner inkl. Aufplatzen der Schichten, Boss, Projektile, Effekte.
- Animationen: Idle, Angriff (im Takt des Simulators, Projektil startet beim Abschuss-Frame), Treffer.
- **Sichtbar:** Sprite-Bogen aller Türme × Stufen (ein Bild), GIF von Angriffen, Gegner-Platzen.

### P3 — Karte und Match-Oberfläche (ein Agent, `client/` + `sim/data/`)
- Die **eine schöne Karte** (Abschnitt 3), Pfad passend zur Simulator-Karte, Platzierungsflächen, Wasser
  (darf unbebaubar sein).
- **Upgrade-Panel wie BTD6:** drei Pfade nebeneinander, je 5 Stufen mit Pixel-Icon, Preis, gesperrt durch
  Crosspath sichtbar, „noch nicht freigeschaltet (Turm-XP)“ sichtbar. Targeting, Verkaufen.
- Turm-Leiste rechts mit Preisen, Held-Platz, Runden-Start/Tempo, Leben/Geld oben.
- **Sichtbar:** leere Karte, Karte im Kampf Runde 15+, Upgrade-Panel.

### P4 — Fortschritt und Freischaltungen (ein Agent, `meta/` + `client/`)
Max: „ordentliche Leveling-Funktionen, ganz viel Zeug, was man freischalten kann“. Nach BTD6 (`meta.md`):
- **Spieler-Level** aus Match-XP; schaltet Türme frei (Slice: Turm 1 ab Start, 2 ab L2, 3 ab L4) und den Helden.
- **Turm-XP:** jeder Turm sammelt XP, wenn er benutzt wird; damit werden Upgrade-Stufen freigeschaltet
  (wie BTD6). Stufe 5 braucht spürbar viel.
- **Wissensbaum** (wie Monkey Knowledge): Punkte aus Level-Ups, 8–12 Knoten (Startgeld, Verkaufsquote,
  Reichweite einer Klasse, Held-Start-Level …).
- **Medaillen je Karte/Schwierigkeit** (Easy/Medium/Hard, später mehr), Anzeige auf der Kartenwahl.
- Gacha (nur Helden/Skins) **kommt später**, nicht in diesem Slice.
- **Sichtbar:** Ergebnis-Bildschirm mit XP-Balken, Freischalt-Moment, Wissensbaum, Turm-Detail mit XP.

### P5 — Balance-Prüfung und Abschluss (Hauptsitzung)
- Bot-Läufe als Rauchtest: jede sinnvolle 2-Turm-Kombination schafft Runde 20 auf Medium mit vernünftigem
  Spiel; kein einzelner Turm schafft alles allein; Boss braucht Vorbereitung. Ergebnis als kleine Tabelle.
- Screenshots + GIFs, `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 11 (Vertical Slice)
Was man jetzt sehen kann (5 Zeilen):
Türme + Held (Namen, Rollen, je ein Satz zu den 3 Pfaden):
Gegner, Runden, Boss:
Fortschritt: Level, Turm-XP, Wissensbaum, Medaillen:
Balance-Rauchtest (Tabelle):
Was rausgeflogen ist (AA, Gacha …), Archiv-Tag:
Offene Fragen an Max (mit Empfehlung):
Vorschlag Runde 12 (3–5 Sätze):
Agenten (Anzahl, Modell), Limits erreicht wie oft:
Commits / Tests:
```

---

## 5. Was du nicht tust

- **Nichts deployen.** Keine Domain, kein Tunnel, kein Server.
- Kein Opus, keine Messreihen über Stunden.
- Keine Fremdbilder, keine AniList/AA-Bilder.
- Nicht mehr als 3 Türme + 1 Held + 1 Karte — Qualität vor Menge, das ist der ganze Punkt.
- `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen in STATUS unter „Offene Fragen“.

> Ziel: Ein GIF aus dem Match sieht aus wie aus einem fertigen Pixel-Spiel, jede Upgrade-Stufe ist ein kleiner
> Glücksmoment, und Max sagt „davon mehr“.
