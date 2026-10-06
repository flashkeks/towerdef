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

| Pfad | Inhalt |
|---|---|
| `src/boot.ts`, `src/gate.ts` | Einstieg und Desktop-Sperre (architecture.md §4); das Spiel-Bundle (`main.ts`) wird nur bei Desktop per `import()` geladen |
| `src/i18n/en.ts`, `t.ts` | alle sichtbaren Texte; Titel nur als `game.title` (auch `<title>`) |
| `src/sim/` | einziges Tor zur Sim, baut die Daten im Browser aus `sim/data/*.json` (gleiche zod-Pruefung) |
| `src/game/session.ts` | fester Tick (20/s, Akkumulator), Befehle, Auswahl |
| `src/game/renderer.ts` | Pixi-Zeichnung (Formen), Interpolation zwischen Ticks |
| `src/view/` | reine Abbildung Zustand -> Anzeige und Boss-Tracker (getestet) |
| `src/ui/` | DOM-Oberflaeche (HUD, Leiste, Panels, Overlays) |
| `scripts/smoke.mjs` | Playwright-Smoke |

## Grenzen

- Nur Formen, keine Assets (`assets/ATTRIBUTIONS.md` leer); Tile-Groesse folgt dem Fenster, nicht ganzzahlig zum 32-px-Raster.
- Ein Spieler, kein Koop, kein Speichern, kein Ton, keine Treffer-Effekte der Units.
- Die Sim importiert `node:fs`/`node:url` (nur fuer `loadGameData`); im Browser ersetzen Vite-Alias-Platzhalter (`src/shims/`) sie. `sim/src` ist unveraendert.
- Smoke: In der Headless-Sandbox (SwiftShader) wird das WebGL-Canvas nach laengerem Betrieb/Hover im Screenshot leer; deshalb laeuft der Screenshot in eigenem Browser mit Session-Aufbau, die Klickpfade in einem zweiten. Kein Befund am Spiel selbst, aber nicht auf echter GPU gegengeprueft.
- Slots sind DOM-Buttons ueber dem Canvas (testbar), kein Pixi-Hit-Testing.
