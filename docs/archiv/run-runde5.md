# run.md — Runde 5: Vom Gerüst zum Spiel, das man gern spielt (M1 Vertical Slice)

Du arbeitest in diesem Repository auf dem Branch `dev`. Commit und Push nach jedem
Paket. Pull Requests nach `main` nur, wenn der Mensch es sagt.

Reihenfolge beim Einstieg: **`docs/design/ENTSCHEIDUNGEN.md`** (verbindlich), dann
**`docs/STATUS.md`** (Stand, „Nächster Schritt"), dann diese Datei. Runde 4 liegt in
[`docs/archiv/run-runde4.md`](docs/archiv/run-runde4.md).

---

## 1. Lage und Ziel

Runde 4 hat geliefert: Leben-System, Schwierigkeit über Regeln, zwei Boss-Kits, Wellenvorschau,
Risikokarten, Bot-Fehlerprofile, Architektur, Styleguide, Name **Duskwardens** und ein spielbares
Client-Gerüst (`client/`, Formen statt Grafik). Simulator 208 Tests, Client 37 Tests, alles grün.

**Seit 06.10.2026 läuft eine Preview** unter `https://duskwardens.flashkeks.com` (statischer
Build von `dev`, hinter Cloudflare Access, nur Max und Plori). Den Betrieb macht die
Homelab-Seite (`flashkeks/homelab`, `websites/towerdef/README.md`), **du deployst nichts**.

Erster Eindruck von Max auf der Preview: „Start drücken und Units auswählen, das war's. Units
lassen sich nicht setzen." Ursache war ein Koordinatenfehler (Festkomma statt Kacheln bei den
Slot-Knöpfen), behoben in `41515c4`. **Die Lehre daraus gilt für die ganze Runde:** Der
Smoke-Test hatte mit `page.click` grün gemeldet, weil Playwright zum Element scrollt. Ein Mensch
mit Maus kam nicht weiter. Also: **echte Mausklicks auf Koordinaten testen, nicht nur Selektoren.**

Die Bot-Balance ist ausgereizt (P6b). Was jetzt fehlt, können nur Menschen beantworten: Fühlt es
sich gut an? Ist Hard fair? Dafür muss das Spiel **lesbar, bedienbar und ansehnlich** sein, und
jede Testrunde muss **Daten** hinterlassen.

Diese Runde, in der Reihenfolge ihrer Wichtigkeit:
1. **Bedienbarkeit**: Ein neuer Spieler versteht ohne Erklärung, was zu tun ist.
2. **Playtest-Daten**: Jede Runde lässt sich als Replay exportieren und im Simulator nachspielen.
3. **Boss-Design**: Der Titan darf keine Pflicht-Antwort mehr sein; Hard bekommt eine breitere Kennlinie.
4. **Grafik und Ton**: Erste echte Pixel-Grafik (CC0-Packs plus Eigenes nach Styleguide),
   Treffer-Feedback, Sounds.
5. **M1-Lücken**: Team-Auswahl 6 aus 8, Hauptmenü, Einstellungen, Ergebnis-Bildschirm.

Nicht in dieser Runde: Server, Konto, Koop/Netzwerk (M2), Gacha/Meta (M3), weitere Maps.

---

## 2. Agenten und Token-Budget

- Subagenten **immer `model: "sonnet"`**, nie Opus. Rein Mechanisches (Dateien sammeln,
  Lizenztexte abgleichen, Sprites zuschneiden) darf `"haiku"` sein.
- Höchstens **4 Agenten gleichzeitig**. Kurzer, vollständiger Auftrag je Agent. Agenten
  schreiben in Dateien, Rückmeldung höchstens 10 Zeilen.
- **Gemeinsame Engpässe:** `client/src/ui/app.ts` und `client/src/game/renderer.ts` sind zwei
  große Dateien. Nicht zwei Agenten gleichzeitig daran. Wer sie aufteilen will (z. B.
  `ui/hud.ts`, `ui/shop.ts`, `game/fx.ts`), macht das **zuerst und allein** (P0b), danach
  laufen die Pakete parallel. `sim/` ändert in dieser Runde nur P3 (und P2 minimal).
- Jede Änderung an `sim/data/` mit alt → neu → Grund in `docs/balancing/kalibrierung.md`,
  neuer Abschnitt „Runde 5".
- Vor jedem Commit: `npm test` und `npm run typecheck` in `sim/`, `npm test`, `tsc` und
  `npm run build` in `client/`. Ab P1 zusätzlich `npm run smoke` (Abschnitt 3).
- Recherche: eingebaute Websuche und Web-Fetch. Gesperrte Seiten (Fandom, itch.io-Downloads …)
  bittest du **nicht** die Menschen zu holen, sondern vermerkst sie in STATUS als offene Spur.

---

## 3. Abnahmeziele dieser Runde

| Ziel | Prüfung |
|---|---|
| Bedienbar ohne Erklärung | Smoke spielt eine **ganze Stage** (W1–W20, Normal) nur mit `page.mouse.click(x, y)` auf berechnete Bildschirmkoordinaten und Tastatur, **keine** `evaluate`-Abkürzungen für Spielaktionen. Bei 1280×720, 1920×1080 und 2560×1440 |
| Keine toten Klicks | Jeder Klick auf das Spielfeld hat eine sichtbare Reaktion (platziert, ausgewählt, Fehler-Toast mit Grund) |
| Replays | Export einer echten Browser-Runde → `npm run replay -- datei.json` in `sim/` ergibt **denselben** Endzustand (Hash) |
| Kein Pflicht-Unit | Leave-one-out mit `botTuning.banned`: Verbot **keiner** Unit senkt die Siegquote des besten Bots um mehr als 25 Punkte (heute Titan: −86 auf Normal) |
| Hard-Kennlinie | ≥ 20 Prozentpunkte (heute 13,7; Ziel war 25, 20 reicht für diese Runde) |
| Stufen bleiben im Ziel | bester Bot solo, Profil `normal`: Normal 85–95, Hard 45–65, Nightmare 15–35 % |
| Lesbarkeit | Jeder Gegner-Archetyp und jede Unit ist auf einem Screenshot in 1× ohne Beschriftung unterscheidbar (Silhouettenregeln `art-styleguide.md` §6) |
| Lizenzen sauber | Jede eingebundene Datei steht in `ATTRIBUTIONS.md` mit Quelle, Lizenz, Abrufdatum. Kein Asset ohne geprüfte Lizenz, **auch nicht als Platzhalter** |
| Performance | 60 fps bei 3× mit vollem Feld (W19, 8 Units, Effekte an) in Chromium auf 1920×1080; gemessen und in STATUS notiert |
| Bundle | `index` (vor der Desktop-Sperre) bleibt klein; das Spiel-Bundle samt Assets unter 8 MB |

Was nicht erreichbar ist: ehrlich begründen, nicht durch Datenbiegen erzwingen.

---

## 4. Arbeitspakete

### P0 — Status und Aufräumen (Hauptsitzung)
- `docs/STATUS.md`: Runde-5-Tabelle anlegen, Runde 4 als abgeschlossen zusammenfassen.
- Prüfen, dass `41515c4` (Slot-Fix) drin ist; Smoke einmal laufen lassen.

### P0b — Client aufteilen (ein Agent, allein, zuerst)
`app.ts` und `renderer.ts` so zerlegen, dass P1, P4, P5 und P6 an getrennten Dateien arbeiten
können. Reines Umbauen, kein neues Verhalten, alle Tests und Smoke grün.

### P1 — Bedienbarkeit (ein Agent)
Der Spieler soll nie raten müssen.
- **Platzier-Modus sichtbar:** Unit gewählt → freie, passende Slots leuchten. Die Map hat
  13 Boden-, 10 Hügel- und 3 große Slots (2×2). Heute sind Hügel braune Quadrate mit Dreieck,
  Boden graue, die großen graue Flächen rechts: Max hat beim ersten Testen nicht erkannt, was
  was ist. Das muss die Grafik sagen, nicht der Tooltip. Unpassende Slots grau, Hinweis
  warum (z. B. „Gunner braucht einen Hügel-Slot", „Farm braucht einen großen Slot"). Geist-Sprite plus
  Reichweitenkreis unter dem Mauszeiger.
- **Jeder Fehlschlag sagt warum:** zu wenig Münzen, falscher Slot-Typ, Slot belegt, Limit
  erreicht. Toast nahe am Mauszeiger, nicht nur oben.
- Rechtsklick oder `Esc` bricht den Platzier-Modus ab. Auswahl einer gesetzten Unit zeigt
  Reichweite, Stufe, Upgrade-Kosten und -Wirkung (alt → neu), Verkaufswert, Zielmodus.
- **Erste Runde ohne Anleitung:** drei kurze Hinweise beim ersten Start (Unit wählen → Slot
  klicken → Welle starten), abschaltbar, gespeichert in `localStorage` (try/catch).
- Tastenkürzel in einer Hilfe (`?` oder `H`) auflisten.
- **Version sichtbar:** kurzer Commit-Hash und Build-Datum unten rechts klein (per Vite-`define`
  zur Build-Zeit). Damit Feedback immer eine Version hat.
- **Smoke umbauen** auf echte Mausklicks nach Abschnitt 3 und auf die drei Auflösungen.

### P2 — Playtest-Daten (ein Agent, parallel zu P1 möglich, andere Dateien)
Der Simulator ist deterministisch: Seed + Befehlsliste = ganze Runde. Das nutzen.
- Client zeichnet jede Runde auf: Seed, Stufe, Version, Befehle mit Tick, dazu Endergebnis,
  Leben-Verlauf je Welle, Leaks je Welle, Münzen je Welle, Dauer, Geschwindigkeitswechsel.
- **Nach jeder Runde** (Sieg oder Niederlage) und über einen Knopf im Pause-Menü: „Replay
  herunterladen" als JSON. Dateiname `duskwardens-STUFE-ERGEBNIS-DATUM.json`.
  Kein Server, kein Upload, keine personenbezogenen Daten. Max und Plori schicken die Dateien.
- Kurzer Freitext „Was war doof?" im Ergebnis-Bildschirm, landet in der JSON.
- `sim/`: `npm run replay -- DATEI` spielt nach, prüft den Hash und druckt einen Bericht
  (Wellen mit Leaks, Münzkurve, gekaufte Units, Upgrades). Abweichung = Test-Fehler.
- `docs/balancing/playtests/` als Ablage, README dort erklärt den Weg.
- Optional: `npm run replay -- --compare DATEI` legt den passenden Bot-Lauf daneben
  (gleiche Stufe, gleicher Seed). Zeigt, wo der Mensch vom Bot abweicht.

### P3 — Boss-Design: weg vom Pflicht-Titan, Hard breiter (ein Agent, nur `sim/`)
Ausgangslage in `kalibrierung.md` § P6b: Ohne Titan fällt der beste Bot auf Normal um 86 Punkte.
Der Colossus (W20) ist ein HP-Check, den nur der Titan-Nuke besteht.
- Ziel: **mindestens zwei** tragfähige Antworten auf jeden Boss. Ideen (prüfen, nicht alle
  bauen): Schwachstellen-Fenster, in dem Dauerschaden (Gunner, Lancer) stark zählt; Phasen,
  in denen Frost/Banner etwas bewirken; Rüstungs-Phasen, die Burst belohnen, und andere,
  die Treffer-Anzahl belohnen; Beschwörungen, die AoE fordern.
- Danach Hard neu kalibrieren: Kennlinie ≥ 20, Stufen weiter im Ziel (Abschnitt 3).
- Leave-one-out für alle 8 Units neu messen, Tabelle in `kalibrierung.md`.
- Jede Boss-Änderung braucht eine **Telegraph-Entsprechung** für den Client (was sieht der
  Spieler, bevor es passiert). Liste an P5 übergeben.

### P4 — Grafik: erste echte Pixel-Optik (ein Agent, Recherche erlaubt)
Grundlage: `docs/design/art-styleguide.md`, `asset-sources.md`, `zeichenliste.md`.
- Terrassenweg mit echten Tiles (Kenney Tiny Town/Dungeon o. ä., Palette nach Styleguide).
  Pfad, Gras, Hügel-Sockel, Slots erkennbar.
- Gegner: Platzhalter aus geprüften CC0-Packs per Palette-Swap, bis eigene Sprites da sind.
  **Silhouetten der 7 Archetypen unterscheidbar** (Abschnitt 3).
- Units: Wenn kein passendes CC0-Material existiert, **eigene einfache Pixel-Sprites** im
  Styleguide-Raster (Code-generiert oder als PNG von Hand im Repo). Lieber schlicht und
  einheitlich als hübsch und gemischt.
- Sprite-Atlas-Pipeline (`tools/` oder `client/scripts/`): Quellbilder → Atlas + JSON,
  reproduzierbar, Pixel-genau (`scaleMode: 'nearest'`, ganzzahlige Skalierung).
- Jede Datei in `ATTRIBUTIONS.md`. Lizenztext des Packs mit ablegen. Downloads, die die
  Session nicht erreicht: in STATUS als offene Spur, **nicht** umgehen.

### P5 — Spielgefühl: Treffer, Tod, Boss, Ton (ein Agent, nach P0b)
- Treffer-Effekte je Unit-Typ (Projektil, Aufschlag, Flächeneffekt), Schadenszahlen
  (abschaltbar), Tod mit kurzem Zerfall, Münz-Popup beim Kill.
- Leak: deutliches Feedback (Rand blinkt, Leben-Anzeige wackelt, Ton).
- Boss: Auftritt, Phasenwechsel, Telegraph (Liste von P3), Schwachstellen-Fenster gut sichtbar.
- Sounds aus geprüften CC0-Packs (Kenney Impact/RPG/Interface): Platzieren, Upgrade, Verkauf,
  Treffer (gedrosselt, kein Klangbrei bei 3×), Leak, Welle startet, Boss, Sieg/Niederlage.
  Lautstärke-Regler, Stummschalten, Audio erst nach erster Nutzeraktion.
- Musik optional (ein CC0-Loop), getrennt regelbar.
- Effekte dürfen den Simulator nicht beeinflussen: nur aus Ereignissen (`drainEvents`) lesen.

### P6 — M1-Lücken (ein Agent, nach P0b)
- **Hauptmenü:** Titel, Spielen, Einstellungen, Credits (aus `ATTRIBUTIONS.md` erzeugt).
- **Team-Auswahl 6 aus 8** vor dem Match (`gdd.md` §5), mit Kurzinfo je Unit; letzte Wahl merken.
- **Einstellungen:** Lautstärken, Schadenszahlen an/aus, Hinweise zurücksetzen,
  Standard-Geschwindigkeit. In `localStorage` (try/catch), Spiel läuft auch ohne.
- **Ergebnis-Bildschirm:** Sieg/Niederlage, Wellen, Leaks, MVP-Unit (meister Schaden),
  Dauer, „Nochmal", „Andere Stufe", Replay-Knopf (P2).
- **Pause-Menü** mit Fortsetzen, Neustart, Hauptmenü, Replay.
- Englische Texte nur über die String-Datei (`i18n`), keine harten Strings.

### P7 — Abschluss (Hauptsitzung)
- Alle Prüfungen aus Abschnitt 3 laufen lassen, Ergebnisse in STATUS.
- Screenshots in `client/docs/` erneuern (Menü, Team-Wahl, Spiel mit Effekten, Boss, Ergebnis).
- `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 5
Pakete erledigt / offen:
Abnahmeziele (Abschnitt 3): je Ziel erreicht / verfehlt (Wert):
Boss-Änderungen und Leave-one-out (alt → neu):
Hard-Kennlinie (alt → neu):
Grafik: Anzahl Sprites eigen / CC0, offene Lücken:
Sounds: Anzahl, Quellen:
Replay: Export → Hash-Prüfung grün ja/nein:
Performance (fps bei 3×, W19):
Bundle-Größe:
Was die Menschen als Nächstes testen sollen (konkret, max. 5 Punkte):
Agenten (Anzahl, Modell):
Commits:
Nächster Schritt:
```

---

## 5. Was du nicht tust

- **Nichts deployen.** Die Preview baut die Homelab-Seite aus `dev`, auf Ansage von Max.
  Dein Teil endet mit grünem Build auf `dev`.
- Keine Domain, kein Tunnel, kein Server, keine Konten, kein Zahlungsanbieter.
- Keine Assets ohne geprüfte Lizenz, auch nicht vorübergehend. Keine Sprites aus anderen
  Spielen, keine Fan-Art, nichts „Ähnliches" aus Anime Adventures.
- `docs/design/ENTSCHEIDUNGEN.md` nicht ändern. Fragen an die Menschen kommen in STATUS
  unter „Offene Fragen", knapp, mit Empfehlung.

---

## 6. Ende einer Sitzung

Bevor der Kontext knapp wird oder die Sitzung endet: `docs/STATUS.md` aktualisieren
(erledigt, angefangen, laufende Agenten, nächster konkreter Schritt), Tests laufen lassen,
committen und pushen.

> Ziel dieser Runde: Max und Plori spielen eine Stage durch, haben Spaß dabei, und jede
> Runde, die sie spielen, liefert Daten, mit denen die nächste besser wird.
