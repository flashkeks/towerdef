# Duskwardens-Client (M1)

Vite + PixiJS v8 + TypeScript (strict). Die Simulation `sim/` laeuft direkt im Browser, es gibt keinen Server und kein Login.
Der Client ruft nur die Sim-Schnittstelle auf (`createSim`, `apply`, `step`, `previewWave`, Events) und zeichnet den Zustand. **Keine Spielregeln im Client.**
Spiel und UI sind Englisch, diese Doku Deutsch.

## Start

```bash
npm install            # im Repo-Root (npm-Workspaces: sim, client)
cd client
npm run dev            # Entwicklungsserver
npm run build          # typecheck + Produktions-Build nach dist/
npm run typecheck
npm test               # vitest (Gate, Strings, Anzeige-Mapping, Session, Boss-Tracker, Bildschirm<->Welt, Geist, Shift-Klick)
npm run build && npm run perf   # P5: FPS bei W19/3x/1920x1080 (headless = SwiftShader, Untergrenze); npm run shots:p5, npm run audio-check
npm run build && npm run smoke   # Playwright, je Aufloesung (1280x720, 1920x1080, 2560x1440) der ganze Kreislauf mit echten Mausklicks: neues Profil, Lobby, Starter-Geschenk, 10er-Zug, Units, Team, Stage, Match, Belohnung, Level-Up, zweites Match, Seite neu laden (Stand bleibt); dazu Geist-/Fehlergrund-Pruefungen, Ladefehler, gesperrter Speicher, Mobil-Sperre; nur 1280x720 spielt die Stage voll und prueft Export -> Reset -> Import, die anderen ein kurzes Match. Screenshots nach docs/screenshot-r6-*.png und docs/screenshot-r7-*.png. Dauer ca. 7 min (SMOKE_PORT, SMOKE_RES, SMOKE_MAX_S, SMOKE_FULL=Aufloesungen mit voller Stage, SMOKE_PARALLEL=1)
```

`sim` bleibt eigenstaendig: `cd sim && npm test && npm run typecheck`.

## Interface-Kit (Runde 8, P4)

Neuer Look „Dusk Gilt“ (Entscheidungen und Moodboard: `docs/design/ui.md`). Alles Gestalterische liegt in `src/ui/kit/`:

| Datei | Inhalt |
|---|---|
| `kit/tokens.css` | **Design-Tokens**: Flaechen, Text, Akzente, Seltenheits-Verlaeufe (`--rare-a/b/c`, `--*-glow`), Elementfarben (`--el-*`), Schriften, Radien, Schatten. Die alten Namen (`--ink`, `--gold` ...) zeigen darauf |
| `kit/fonts.css`, `kit/fonts/` | gebuendelte Schriften (Cinzel, Manrope, Rajdhani; woff2) |
| `kit/kit.css` | Komponenten-CSS: `.btn`, `.kp` (Panel), `.rf` (Seltenheits-Rahmen), `.pc` (Portraet-Karte), `.chip`, `.tile`, `.bar`, Brieftasche, Meldungen |
| `kit/backdrop.css`, `kit/art.ts` | Hintergrund (Himmel, Berge, Funken-Canvas), Siegel, Wappen, Ersatzfigur (`bust`) |
| `kit/icons.ts` | Inline-SVG-Icons (`icon(name)`), Elemente (`elementIcon(e)`, `ELEMENT_IDS`) |
| `kit/index.ts` | **Bausteine**: `panel()`, `rarityFrame()`, `portraitCard()`, `miniCard()`, `tile()`, `chip()`, `stars()`, `backdrop()` |

Faustregeln: Farben nur ueber Tokens; ein Baustein kennt keine Spieldaten (Name, Seltenheit, Elemente kommen als Parameter; `ui/unit-card.ts` loest sie aus den Sim-Daten auf:
`cardOf(view)`, `miniOf(id, px)`, `unitMeta(id)`). Neue Bildschirme setzen sich aus diesen Teilen zusammen; die Weltkarte (P3) kann sie unveraendert nutzen.

**Seltenheits-Rahmen:** `rarityFrame('mythic', inhalt, { live })`: Ring mit Verlauf und Leuchten, Mythic/Secret/Exclusive laufen (gedrehtes Pseudo-Element, kein Repaint).
**Portraets:** `view/portrait.ts` (`portraitUrl(id)` = `/aa/units/<id>.webp`, `hasPortrait(id)`); fehlt das Bild, steht eine gestaltete Ersatzkarte (Initialen, Element-Farbe, Silhouette), Ladefehler werden gemerkt.

Weltkarte: `ui/world-map.ts` (DOM im Kit-Stil, `ui/world.css`) auf `ui/world-model.ts` (P3, ohne DOM). Porträt-Quelle: `view/portrait.ts` (Manifest + optional `/aa/index.json`, `portraitKnown(id)` sofort, `hasPortrait(id)` async).

Sichtlogik ohne DOM (Tests `test/collection-model.test.ts`, `test/portrait-index.test.ts`):

- `ui/collection-model.ts`: `filterCollection`/`sortCollection`/`queryCollection` (Seltenheit, Element, Platzierung, Rolle, Besitz, Suche; Sortierung nach Seltenheit, Element, Platzierung, DPS, Level, Name), `gridLayout`/`visibleRange`/`itemPos` (virtuelles Raster), `attackShape`/`shapeGeometry` (Angriffsform), `pickHero` (Lobby-Held).
- `ui/virtual-grid.ts`: DOM-Huelle um die Rasterrechnung (561+ Units, nur sichtbare Zeilen im DOM; `data-count` am Raster = Gesamtzahl).
- `ui/reveal-model.ts` + `ui/reveal.ts`: Ablaufplan und DOM der Zieh-Animation (Debug-Zugriff `window.__ui.openReveal({ pulls })` fuer Screenshots).

Screenshots: `npm run build && node scripts/shots-r8-p4.mjs` (Port `SHOT_PORT`, Standard 4443) schreibt `docs/r8/p4-*.png`. Fuer eine Sammlung mit 561 Units braucht der Build
waehrend der Aufnahme eine Datei mit vielen Units in `sim/data/units/` (`zz-*.json`, nicht einchecken); mit dem Stand von P1 sind es 26.

## Bildschirme (Runde 7)

Start ist die **Lobby** (`ui/lobby.ts`): Kontostaende oben (Crystals, Gold, Spieler-Level mit XP-Balken), Starter-Geschenk als sichtbarer Knopf (solange offen), Play, Summon, Units, Team, Shop, Settings, Credits. Alle Bildschirme sprechen **nur mit `getBackend()`** (nie direkt mit `meta/`), Texte nur in `en.ts`, Zustand immer vom Backend (`playerView`, `collectionView`, `bannerViews`, `stageView`, `pullHistory`, `matchSetup`).

| Bildschirm | Inhalt |
|---|---|
| Lobby | Ladefehler (`profile-corrupt`, `profile-too-new`) -> Meldung mit Import / Reset (mit Bestaetigung), der Stand wird nie ungefragt ueberschrieben; `persistence: 'memory'` -> Warnung "progress will be lost on reload"; der Hinweis "Test build, progress is stored in this browser only" steht immer (liegt ueber dem Overlay) |
| Summon | Banner-Auswahl (Standard, Starter solange verfuegbar), **Ratentabelle immer sichtbar** (Basis, Langzeit mit Pity, naechster Zug, Einzelraten je Unit), Regeln, Erwartungswerte, Ratenversion + Hash, Pity-Zaehler auch auf dem Knopf ("Pull x10 · Mythic pity 37/150"), 1er-/10er-Zug (`idemKey` je Klick, Knopf waehrend des Zugs gesperrt), Enthuellung je Seltenheit (CSS, Klick/Esc ueberspringt), Verlauf (letzte 20), Fehler als Toast |
| Units | Raster mit Seltenheits-Rahmen und Atlas-Portrait (unbekanntes Sprite -> Kuerzel-Abzeichen), Filter Seltenheit / Rolle / Platzierung / nur Besessene, Detail (Werte aus den Sim-Daten, Rolle, Symbole), Level, Sterne, Kopien bis zum naechsten Stern, Level-Up mit Gold; nicht besessen = grau |
| Team | `setTeam`: `min(6, Besitz)` Units aus der Sammlung, nur Besessene waehlbar |
| Stage | Terrassenweg, Normal / Hard / Nightmare; gesperrt mit Grund ("Player level 5"), Erst-Clear-Belohnung, Bestwelle |
| Match | `main.ts` ruft `Backend.matchSetup(difficulty)` (Team + `unitMods` aus dem Profil), baut `new Session(d, undefined, bus, unitMods)` und setzt `session.team`; der Recorder schreibt beides ins Replay |
| Ergebnis | `reportMatch(replay)` (nachgerechnet, ans Profil gebunden), Crystals / Gold / XP, Erst-Clear, Spieler-Level-Up, freundliche Fehler (`replay-mismatch` u. a.), Retry nur bei `save-failed`/`internal-error` |
| Shop | drei Crystal-Pakete (Mock, "Test purchase - no real money", kein Preis), `buy`, `pending` -> `refreshOrder` |
| Settings | Regler wie bisher, dazu Export (JSON-Download), Import (Datei, mit Bestaetigung), Profil zuruecksetzen (mit Bestaetigung; der alte Stand wird vorher gesichert) |

Rolle (Filter) kommt aus den Sim-Daten (`roleCat`: Farm = Economy, Aura = Support, Stun = Control, Nuke = Boss killer, Flaeche = Area, sonst Single target); keine Unit-Liste ist hart verdrahtet, neue Units erscheinen aus `units.json` (Name/Kuerzel fallen auf die ID zurueck, wenn der Text fehlt, Portrait auf ein Abzeichen).

## Bedienung

Stufe waehlen (Normal/Hard/Nightmare), Unit unten waehlen (Tasten 1-8), **irgendwo neben dem Pfad ins Feld klicken** (freie Platzierung, Runde 6, kein Limit je Unit-Typ). Platzierte Unit anklicken: Upgrade, Verkaufen, Fertigkeit, Zielmodus.
Platzier-Modus: Geist in Unit-Groesse (= Kollisionskreis der Sim) folgt der Maus, **gruen** wo erlaubt, **rot** mit kurzem Grund darunter (`On the path`, `Wrong ground`, `Too close` ...; Grund = `sim.canPlace`), der Reichweitenkreis ist immer sichtbar. Passende Zonen leuchten (Boden tuerkis, Huegel gold), der Rest der Karte ist abgedunkelt, weisse Punkte = statisch gueltige Stellen (`placementGrid`; der nutzbare Streifen neben dem Pfad ist schmaler als die Kachel). Klick an roter Stelle = Toast am Zeiger mit dem Grund, es wird nichts gesetzt und die Wahl bleibt (keine toten Klicks). Klick auf eine gesetzte Unit waehlt sie (auch im Platzier-Modus). **Shift + Klick** setzt dieselbe Unit nochmal; ohne Shift ist die Wahl nach dem Setzen verbraucht. Esc oder Rechtsklick bricht ab. Weitere Tasten: U Upgrade, T Zielmodus, A Fertigkeit, S Tempo, `?`/`H` Hilfe. Beim ersten Start drei Hinweise (abschaltbar, `localStorage`-Schluessel `dw.hints`). Version (Commit-Hash, Build-Datum) unten rechts, per Vite-`define` (`__BUILD_HASH__`, `__BUILD_DATE__`).
`Start wave` (Taste N) ruft die naechste Welle frueher. Rechts: Wellenvorschau und Risikokarte fuer die naechste Welle. Boss-Telegraph: roter Ring mit Countdown, Schwachstellen-Fenster tuerkis. Leertaste = Pause, Tempo 1x/2x/3x.

## Aufbau

Seit P0b (Runde 5) sind `ui/app.ts` und `game/renderer.ts` nur noch Verdrahtung. **Jedes Paket der Runde 5 besitzt eigene Dateien**; wer eine fremde Datei braucht, aendert dort nur das Minimum (Import, eine Zeile) und meldet es. Gemeinsame Basis (`session.ts`, `events.ts`, `context.ts`, `dom.ts`) nur additiv aendern.

| Pfad | Inhalt | Besitzer |
|---|---|---|
| `src/boot.ts`, `src/gate.ts` | Einstieg und Desktop-Sperre (architecture.md §4); das Spiel-Bundle (`main.ts`) wird nur bei Desktop per `import()` geladen | - |
| `src/main.ts` | Verdrahtung: ein `GameBus`, Renderer, Ui, Pixi-Ticker; feuert `onRunStart`/`onRunEnd` | alle, nur Einzeiler |
| `src/i18n/en.ts`, `t.ts` | alle sichtbaren Texte; Titel nur als `game.title` | jeder fuer seine Texte |
| `src/sim/` | einziges Tor zur Sim (baut die Daten im Browser aus `sim/data/*.json`) | - |
| `src/view/` | reine Abbildung Zustand -> Anzeige, Boss-Tracker (getestet) | - |
| `src/game/session.ts` | fester Tick (20/s), Befehle, Auswahl; meldet alles an den Bus | gemeinsam, nur additiv |
| `src/game/events.ts` | `GameBus`: Verteilung von Sim-Ereignissen, Befehlen, Steuerung, Rundenstart/-ende (siehe unten) | gemeinsam, nur additiv |
| `src/game/context.ts` | `RenderContext` (Tile-Groesse, Stage, Unit-Defs, `px()`), Weltmasse | P4 |
| `src/game/renderer.ts` | nur Pixi-Setup, Ebenen-Reihenfolge, `fit`, `draw()` | - (nicht anfassen) |
| `src/game/map-layer.ts`, `map-compose.ts`, `palette.ts` | Karte aus Atlas-Kacheln (`map-compose` = reine Liste der Bilder, getestet) plus Huegel als Flaeche (`hillRects`, aus `stage.zones`; keine Slot-Platten mehr), Farben fuer Overlays | P4, Runde 6: P3 |
| `src/game/atlas.ts` | laedt `assets/atlas/atlas.png|json`, Teil-Texturen, `scaleMode: 'nearest'` | P4 |
| `src/game/sprites.ts` | Sprite-Fabrik fuer Units/Gegner (Atlas), Stufenpunkte, Auswahlring | P4 |
| `scripts/gen-sprites.mjs`, `scripts/build-atlas.mjs`, `scripts/lib/` | Pixel-Quellbilder erzeugen und zum Atlas packen; `scripts/shots-p4.mjs` Lesbarkeits-Screenshots | P4 |
| `assets/` | `src/` (Quellbilder), `atlas/` (gepackt), `ATTRIBUTIONS.md` | P4 |
| `src/game/entities-layer.ts` | Units/Gegner anlegen, positionieren, Lebensbalken | P4 |
| `src/game/overlay-layer.ts` | Reichweitenkreis (unter Figuren), Boss-Telegraph (Schraffur, Countdown, Fortschritt zum Brechen)/-Fenster (Panzer offen vs. keucht)/-Schild (darueber); Platzier-Modus: Zonen-Hervorhebung + Abdunkeln, Geist gruen/rot mit Grund, Reichweitenkreis | P1 (Platzieren, Runde 6: P3), P5 (Boss-Zeichnung) |
| `src/game/fx.ts` | Effekte (P5): Schuesse/Treffer je Unit (Projektil, Aufschlag, Blast, Kegel, Linie), Schadenszahlen, Tod mit Zerfall, Muenz-Popup, Leak-Rand, Boss-Auftritt/-Phasen, Bildschuettern; alles gepoolt und gedeckelt. Liest nur Bus-Ereignisse und Sim-Zustand | P5 |
| `src/view/feel.ts` | reine Logik dazu (getestet): Trefferstil je Unit, Schuss-Erkennung (`cd` steigt), Zielwahl-Nachbildung, Schadenszahlen aus HP-Differenz, Ereignis -> Cue | P5 |
| `src/audio/` | Ton (P5): `logic.ts` (Lautstaerke, Drosselung, Ereignis -> Klang, getestet), `recipes.ts` (Klang-Rezepte + Musik, nur Daten), `engine.ts` (WebAudio-Synthese, M = stumm, Context erst nach erster Nutzeraktion) | P5 |
| `src/ui/leak-shake.ts` | Leak: Leben-Anzeige wackelt (CSS-Klasse am Bus) | P5 |
| `src/ui/app.ts` | Verdrahtung der DOM-Bausteine, `bind`/`update`/`showStart` | - (nur Einzeiler, ggf. P6 fuer Szenen) |
| `src/ui/hud.ts` | Leben, Muenzen, Welle, Start/Pause, Tempo, Stufe | P1 |
| `src/ui/shop.ts` | Unit-Leiste unten | P1 (Team-Auswahl-Filter: P6) |
| `src/ui/board-input.ts` | Maus aufs Spielfeld (Runde 6, ersetzt `slots.ts`): Brett-Groesse, Zeiger in Pixeln und Milli-Tiles, Klick (+ Shift) -> `Session.clickBoard` | P1, Runde 6: P3 |
| `src/backend/` | Runde 7: `backend.ts` (Schnittstelle `Backend`, Ergebnis-Objekte), `local.ts` (`LocalBackend`, nutzt nur `meta/` + `storage.ts`, Warteschlange, Idempotenz), `storage.ts` (IndexedDB -> localStorage (2 Plaetze) -> Speicher, absturzsicher, alles try/catch), `random.ts` (`crypto.getRandomValues`), `meta.ts` (Tor zu `meta/`), `index.ts` (`getBackend()`). M2 tauscht dort `LocalBackend` gegen `ServerBackend` | P1 (Signaturen nur nach Absprache, Methoden additiv) |
| `src/ui/hints.ts`, `hints-store.ts`, `help.ts`, `version.ts` | Ersthinweise (Speicher + Schritte getrennt, getestet), Hilfe-Overlay, Versionsanzeige | P1 |
| `src/view/placement.ts`, `unit-info.ts` | Bildschirm <-> Welt (`pxToMilli`, `pointerToWorld`), Geist-Status, Zonen-Passung, Treffer auf Units, Shift-Logik, Fehlertoasts, Reichweite und Upgrade-Wirkung (reine Logik, getestet) | P1, Runde 6: P3 |
| `src/view/readability.ts`, `tips.ts` | Runde 6 P4, reine Logik (getestet): Unit-Symbole (`unitTags`: air/area/boss/support/income aus `canHitAir`, `attack.kind`, `ability.kind`, `aura`, `farm`), Flieger-Warnung (`flyerWarning`), Muenz-Hinweis (`coinNudge`), Bereit-Faehigkeiten, Boss-Helfer; `defeatTips`: drei Tipps nach Niederlage aus Recorder-Wellenstatistik, Befehlen, Team | P4 (Runde 6) |
| `src/ui/nudges.ts` | Hinweise unten links im Feld: Muenzen (Leak-Fenster ueber den Bus) und Faehigkeit bereit | P4 (Runde 6) |
| `src/ui/unit-panel.ts` | Auswahl-Panel einer gesetzten Unit | P1 |
| `src/ui/toast.ts` | Fehler-Toast | P1 |
| `src/ui/input.ts` | Tastatur und Rechtsklick (Maus aufs Feld: `board-input.ts`) | P1 |
| `src/ui/panels.ts` | Wellenvorschau und Risikokarten (Seitenleiste) | P1 (Layout), P3-Folgen am Rand |
| `src/ui/boss-banner.ts` | Boss-Banner: Auftritt/Phase animiert, Brech-Fortschritt, "gebrochen durch Stun/Schaden", wandert nach unten, wenn der Boss unter ihm laeuft | P5 |
| `src/ui/screens.ts` + `menu.ts` (nur Credits), `settings.ts`, `settings-screen.ts`, `result.ts`, `mvp.ts`, `markdown.ts` | Szenen: Einstellungen, Credits, Ergebnis, Pause (P6, Runde 5); Runde 7: `screens.ts` schaltet ueber `Nav` zwischen Lobby und Meta-Bildschirmen, `settings-screen.ts` bekam Export/Import/Reset, `result.ts` den Belohnungsblock; `team-select.ts`/`team.ts` (6 aus 8, `localStorage`) sind entfallen | P6, Runde 7: P4 |
| `src/ui/lobby.ts`, `summon.ts`, `units.ts`, `team-screen.ts`, `stage-select.ts`, `crystal-shop.ts`, `reward-box.ts` | Runde 7: Lobby (+ Ladefehler, Starter-Geschenk), Summon (+ Enthuellung), Units, Team (aus der Sammlung), Stage-Auswahl, Mock-Shop, Belohnungsblock im Ergebnis | P4 (Runde 7) |
| `src/ui/meta-model.ts`, `meta-ui.ts`, `nav.ts`, `portrait.ts`, `unit-defs.ts`, `flash.ts` | Runde 7: Sichtmodelle ohne DOM (getestet: Filter, Rolle, Pity-Knopftext, Banner-Auswahl, Enthuellungs-Dauer, Team-Auswahl, Stage-Karten, Belohnung, Kopfzeile, Fehlertexte), gemeinsame Bausteine (Rahmen + Kontostaende, Bestaetigung, Datei speichern/waehlen), Navigation, Atlas-Portrait per CSS, Sim-Definitionen, Meldung (Toast) ausserhalb des Spiels | P4 (Runde 7) |
| `src/ui/dom.ts` | kleine DOM-Helfer | gemeinsam |
| `src/styles.css` | Stil; Abschnitte je Baustein ergaenzen, nichts umsortieren | alle, nur eigene Selektoren |
| `src/game/recorder.ts`, `src/ui/download.ts` | Replay-Aufzeichnung (nur am `GameBus`) und JSON-Download (`replayDownloadBox()` fuer den End-Bildschirm, Pause-Knopf selbst eingehaengt); Nachspielen: `sim/scripts/replay.ts`, Abnahme `npm run replay-check` | P2 |
| `scripts/smoke.mjs`, `scripts/lib/mouse.mjs` | Playwright-Smoke; `mouse.mjs` liest freie Stellen (`placementGrid`/`canPlace`, nur lesend) und klickt sie per echter Maus (auch von `replay-check.mjs` genutzt) | P1, Runde 6: P3 |
| `scripts/perf.mjs`, `shots-p5.mjs`, `audio-check.mjs`, `lib/drive.mjs` | FPS-Messung (W19, 3x, 1920x1080), P5-Screenshots, Ton-Pruefung; `drive.mjs` baut Runden ueber die Session-Schnittstelle auf | P5 |

### Haken: `GameBus` (`game/events.ts`)

Ein Bus fuer die ganze Seite, in `main.ts` erzeugt, an `Session` und `Renderer` uebergeben und als `window.__duskwardens.bus` sichtbar. Abonnenten lesen nur, sie aendern den Sim-Zustand nie. Jede `on…` gibt die Abmeldefunktion zurueck.

| Abo | Wann | Inhalt |
|---|---|---|
| `bus.onEvents(fn(events, tick))` | je Sim-Tick mit Ereignissen (nie leer), direkt nach `drainEvents` | die Sim-Ereignisse (`kill`, `leak`, ...) — **P5** (`fx.ts`, Ton), P2 (Statistik je Welle) |
| `bus.onCommand(fn(rec))` | jeder Befehl an die Sim, auch abgelehnte | `{ tick, player, cmd, result }`, `tick` = Tick vor `apply` — **P2** (Befehlsliste) |
| `bus.onControl(fn(rec))` | Tempo- und Pause-Wechsel | `{ type: 'speed' \| 'pause', tick, ... }` — P2 |
| `bus.onRunStart(fn(session))` | neue Runde gebaut, vor dem ersten Tick | die `Session` (hat `seed`, `difficulty`) |
| `bus.onRunEnd(fn(session))` | Runde vorbei, genau einmal | die `Session` (`sim.state.result`) |

Neue Befehle laufen immer ueber `Session.run`, damit sie am Bus ankommen; wer neue Bedienung baut, ruft Session-Methoden und sendet nie direkt an `sim.apply`.

## Grafik-Pipeline (P4)

```bash
npm run assets        # gen-sprites.mjs (assets/src/**.png) + build-atlas.mjs (assets/atlas/atlas.png + atlas.json)
npm run build && npm run shots:p4   # docs/screenshot-p4-lineup.png und -game.png
```

Reproduzierbar: seedbarer Zufall, feste Packreihenfolge und Kompression, zweimal laufen lassen ergibt gleiche Bytes. Keine zusaetzlichen Pakete (PNG-Schreiber/-Leser in `scripts/lib/png.mjs` auf Basis von `node:zlib`).
`gen-sprites.mjs` prueft das Farbbudget je Bild (Styleguide §4: 16, Pfadkacheln 24). Bilder von Hand oder aus Packs: PNG nach `assets/src/` legen (gleiche Namen ersetzen die erzeugten, dann `gen-sprites` **nicht** mehr laufen lassen oder dort die Zeile entfernen)
und `node scripts/build-atlas.mjs`. Der Atlas wird als URL-Import gebuendelt (`dist/assets/atlas-*.png`, ~10 kB). Zeichenreihenfolge der Karte: Gras, Pfad (Kantenmaske), Huegel-Flaechen (Canvas-Rechtecke), Deko (Baeume/Felsen nur auf `#`-Kacheln, Blumen auf Boden), Spawn/Basis; die Atlas-Bilder `slot_*` aus Runde 5 sind ungenutzt (bleiben im Atlas);
Figuren sind Sprites (Gegner mit zwei Geh-Frames, Blickrichtung per Spiegeln, Flieger mit Boden-Schatten). Palette-Swap: `Img.swap()` in `scripts/lib/pix.mjs` (fuer spaetere CC0-Packs).

## Grenzen

- Grafik (P4): Pixel-Sprites im 32-px-Raster, **alle eigen und code-generiert**, keine Fremdpacks (Downloads waren gesperrt, `assets/ATTRIBUTIONS.md`). Figuren skalieren ganzzahlig (`RenderContext.art` = floor(Tile/32)), die Karte wird als ein nearest-Bild auf die Fenster-Kachel gezogen; die Tile-Groesse selbst folgt dem Fenster und ist daher nicht ganzzahlig zum Raster (ein Einrasten in `renderer.fit` auf Vielfache von 32 waere die saubere Loesung, aber nur 32 und 64 passen in den Bereich 24–72).
- Ein Spieler, kein Koop. Speichern nur im Browser (Runde 7: `backend/`, Export/Import als Datei), kein Konto.
- Pause -> "Quit to lobby" bricht ein laufendes Match ab, ohne Belohnung (es gibt kein Replay eines unfertigen Matches).
- Treffer-Effekte (P5) lesen den Zustand, nicht die Sim-Ereignisse: die Sim meldet Treffer nicht. Ein Schuss ist erkannt, wenn die Abklingzeit `cd` einer Unit steigt, das Ziel wird nachgebildet (`pickTarget`) und kann vom echten Ziel abweichen (nur Darstellung). Schadenszahlen = HP-Differenz je Gegner, gebuendelt.
- Ton (P5): alle Klaenge und die Musik werden zur Laufzeit synthetisiert (eigene Werke, keine Dateien, siehe `assets/ATTRIBUTIONS.md`). Regler und Stumm: `master x sfx`, `master x music`, Taste M (merkt sich `dw.muted`). Der Context startet erst nach der ersten Nutzeraktion.
- Die Sim importiert `node:fs`/`node:url` (nur fuer `loadGameData`); im Browser ersetzen Vite-Alias-Platzhalter (`src/shims/`) sie. `sim/src` ist unveraendert.
- Smoke spielt mit eigenem, einfachem Plan (Units reihum, Upgrades, Wellenruf bei (fast) leerem Feld) und gewinnt nicht zwingend; `evaluate` liest nur Zustand. Fuer Platzierungen liest er freie Stellen aus `placementGrid` (nur dort, wo `canPlace` auch 30 Milli-Tiles daneben `null` liefert) und rechnet sie ueber die Canvas-Breite / 17 in Bildschirmpixel um; Panel-Knoepfe klickt er ueber ihr Layout.
- Smoke: In der Headless-Sandbox (SwiftShader) wird das WebGL-Canvas nach laengerem Betrieb/Hover im Screenshot leer; deshalb laeuft der Screenshot in eigenem Browser mit Session-Aufbau, die Klickpfade in einem zweiten. Kein Befund am Spiel selbst, aber nicht auf echter GPU gegengeprueft.
- Freie Platzierung: Mausposition -> Milli-Tiles wird auf ganze Zahlen gerundet (die Sim lehnt Bruchteile ab). Die Karte (17 x 11) ist eng: neben dem Pfad ist nur ca. 0,6 Tiles breit nutzbar, Farms (Radius 900) passen nur in die breiten Bodenflaechen rechts; eine groessere Karte ist Sache von M4. Klicks innerhalb einer halben Kachel (bei Farm 0,9) um eine gesetzte Unit waehlen sie, statt zu platzieren; dichter als 0,8 Tiles zu stellen geht ohnehin nicht (`overlap`).
