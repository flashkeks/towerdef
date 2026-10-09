# run.md — Runde 12: Reiter, Embers, Store und Powers

Du arbeitest in `flashkeks/towerdef` auf **`dev`**. Kein PR, kein Deploy.

## 0. Kaltstart
„Duskwardens“: Web-Tower-Defense wie Bloons TD 6, nur intern. `sim/` (deterministischer Kern, 60 Ticks/s, Milli-px),
`meta/` (Profil, Level, Turm-XP, Wissensbaum, ohne DOM), `client/` (Vite + PixiJS v8, Pixel-Art im Code).
Lies: `docs/design/ENTSCHEIDUNGEN.md` (oben), `docs/design/powers.md` (**Spezifikation dieser Runde**),
`docs/design/schnittstelle.md`, `docs/design/pixel-stil.md`, `docs/STATUS.md` (Runde 11/11b/11c).
Vorrunde: `docs/archiv/run-runde11.md`. Offene spätere Themen: GitHub-Issues #3–#5.

## 1. Regeln
Subagenten nur Sonnet, max. 3, Zwischenstand spätestens alle 30 min committen, nach Nutzungslimit neuen Sonnet-Agenten auf
denselben Worktree setzen (nicht per SendMessage fortsetzen). Vor jedem Merge: Tests + tsc in sim/meta/client, `npm run build`,
`npm run smoke`. Screenshots in `client/docs/r12/`.

## 2. Pakete
- **A — Sim + Meta**: Powers als Befehl inkl. Fallen, Wellen-Vorschau, Embers/Inventar/Store-Logik, Startpaket, Tests.
- **B — Client**: Reiter Towers/Powers/Wave, Einsatz der Powers im Match, Store auf der Hauptseite, Embers-Anzeige, Pixel-Art
  aller Powers, Ergebnis mit Embers, Smoke, Screenshots.
- **Abschluss (Hauptsitzung)**: Merge, Bot-Matrix bleibt unverändert (Powers sind optional), STATUS „Runde 12“.

## 3. Ziel
Max sieht rechts drei Reiter, kann nach jeder Partie Embers ausgeben, im Match eine Lantern Bomb werfen oder eine Frost Trap
legen, und weiß vor jeder Runde, was kommt.
