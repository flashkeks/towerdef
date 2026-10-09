# run.md — Runde 15: zwei neue Karten, neue Gegner und Bosse, Zusatzmodi

Du arbeitest in `flashkeks/towerdef` auf **`dev`**. Kein PR, kein Deploy.

## 0. Kaltstart
„Duskwardens“: Web-Tower-Defense wie Bloons TD 6, nur intern. `sim/`, `meta/`, `client/` (Vite + PixiJS v8, Pixel-Art im Code).
Lies: `docs/design/ENTSCHEIDUNGEN.md` (oben), **`docs/design/karten-gegner-r15.md` (Spezifikation)**, `gegner.md`, `runden.md`, `tuerme.md`,
`schnittstelle.md`, `pixel-stil.md`, `docs/STATUS.md`. Vorrunde: `docs/archiv/run-runde14.md`. Danach: Runde 16 (Helden + Türme), Issues #3–#6.

## 1. Regeln
Subagenten nur Sonnet, max. 3, Zwischenstand alle 30 min, nach Limit neuer Sonnet-Agent auf denselben Worktree. Vor dem Merge: Tests + tsc in
sim/meta/client, build, smoke, Bot-Matrix je Karte. Screenshots `client/docs/r15/`. Figuren ohne Plattform, Pixel nur aus der Palette.

## 2. Pakete
A Sim + Meta · B1 Pixel-Karten · B2 Pixel-Gegner · danach C Client (siehe Spezifikation § 4).
