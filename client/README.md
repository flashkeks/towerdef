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
npm test               # vitest (Gate, Strings, Anzeige-Mapping, Session, Boss-Tracker)
npm run build && npm run smoke   # Playwright: Desktop-Lauf + Mobil-Sperre, Screenshots nach docs/
```

`sim` bleibt eigenstaendig: `cd sim && npm test && npm run typecheck`.

## Bedienung

Stufe waehlen (Normal/Hard/Nightmare), Unit unten waehlen (Tasten 1-8), freien Slot anklicken. Platzierte Unit anklicken: Upgrade, Verkaufen, Fertigkeit, Zielmodus.
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
| `src/game/map-layer.ts`, `palette.ts` | Karte/Tiles zeichnen, Farben | P4 |
| `src/game/sprites.ts` | Formen-Fabrik fuer Units/Gegner (spaeter Atlas) | P4 |
| `src/game/entities-layer.ts` | Units/Gegner anlegen, positionieren, Lebensbalken | P4 |
| `src/game/overlay-layer.ts` | Reichweitenkreis (unter Figuren), Boss-Telegraph/-Fenster/-Schild (darueber); Platzier-Geist und -Reichweite | P1 (Platzieren), P5 (Boss-Zeichnung) |
| `src/game/fx.ts` | Effekte aus Bus-Ereignissen (heute Muenz-Popup, Leak-Blitz); Treffer, Tod, Boss, Zahlen, Ton | P5 |
| `src/ui/app.ts` | Verdrahtung der DOM-Bausteine, `bind`/`update`/`showStart` | - (nur Einzeiler, ggf. P6 fuer Szenen) |
| `src/ui/hud.ts` | Leben, Muenzen, Welle, Start/Pause, Tempo, Stufe | P1 |
| `src/ui/shop.ts` | Unit-Leiste unten | P1 (Team-Auswahl-Filter: P6) |
| `src/ui/slots.ts` | Slot-Buttons ueber dem Canvas, Platzier-Hervorhebung | P1 |
| `src/ui/unit-panel.ts` | Auswahl-Panel einer gesetzten Unit | P1 |
| `src/ui/toast.ts` | Fehler-Toast | P1 |
| `src/ui/input.ts` | Tastatur (Maus-Platzieren folgt hier hinein) | P1 |
| `src/ui/panels.ts` | Wellenvorschau und Risikokarten (Seitenleiste) | P1 (Layout), P3-Folgen am Rand |
| `src/ui/boss-banner.ts` | Boss-Banner | P5 |
| `src/ui/screens.ts` | Start, Ende, Pause-Hinweis (spaeter Menue, Team-Wahl, Einstellungen, Ergebnis) | P6 |
| `src/ui/dom.ts` | kleine DOM-Helfer | gemeinsam |
| `src/styles.css` | Stil; Abschnitte je Baustein ergaenzen, nichts umsortieren | alle, nur eigene Selektoren |
| `src/game/recorder.ts`, `src/ui/download.ts` | Replay-Aufzeichnung (nur am `GameBus`) und JSON-Download (`replayDownloadBox()` fuer den End-Bildschirm, Pause-Knopf selbst eingehaengt); Nachspielen: `sim/scripts/replay.ts`, Abnahme `npm run replay-check` | P2 |
| `scripts/smoke.mjs` | Playwright-Smoke | P1 |

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

## Grenzen

- Nur Formen, keine Assets (`assets/ATTRIBUTIONS.md` leer); Tile-Groesse folgt dem Fenster, nicht ganzzahlig zum 32-px-Raster.
- Ein Spieler, kein Koop, kein Speichern, kein Ton, keine Treffer-Effekte der Units.
- Die Sim importiert `node:fs`/`node:url` (nur fuer `loadGameData`); im Browser ersetzen Vite-Alias-Platzhalter (`src/shims/`) sie. `sim/src` ist unveraendert.
- Smoke: In der Headless-Sandbox (SwiftShader) wird das WebGL-Canvas nach laengerem Betrieb/Hover im Screenshot leer; deshalb laeuft der Screenshot in eigenem Browser mit Session-Aufbau, die Klickpfade in einem zweiten. Kein Befund am Spiel selbst, aber nicht auf echter GPU gegengeprueft.
- Slots sind DOM-Buttons ueber dem Canvas (testbar), kein Pixi-Hit-Testing.
