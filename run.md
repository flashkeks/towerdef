# run.md — Runde 14: Thornweaver, Alchemist, größerer Wissensbaum

Du arbeitest in `flashkeks/towerdef` auf **`dev`**. Kein PR, kein Deploy.

## 0. Kaltstart
„Duskwardens“: Web-Tower-Defense wie Bloons TD 6, nur intern. `sim/`, `meta/`, `client/` (Vite + PixiJS v8, Pixel-Art im Code).
Lies: `docs/design/ENTSCHEIDUNGEN.md` (oben), **`docs/design/tuerme-r13.md` (Abschnitte 3, 4, „Runde 14 …“ = Spezifikation)**,
`tuerme.md`, `schnittstelle.md`, `pixel-stil.md`, `docs/STATUS.md`. Vorrunde: `docs/archiv/run-runde13.md`. Später: Issues #3–#6.

## 1. Regeln
Subagenten nur Sonnet, max. 3, Zwischenstand alle 30 min, nach Limit neuer Sonnet-Agent auf denselben Worktree. Vor dem Merge:
Tests + tsc in sim/meta/client, build, smoke, Bot-Matrix mit den neuen Türmen. Screenshots `client/docs/r14/`.
Figuren **ohne Plattform**, Stufen deutlich sichtbar (Stufe 3 neue Silhouette, 4 Rüstung/Leuchten, 5 Verwandlung).

## 2. Pakete
- **A — Sim + Meta:** Thornweaver, Alchemist (alle Stufen, Fähigkeiten, Ranken/Pfützen/Tränke), 12 neue Wissensknoten, Freischalt-Level,
  Bot-Strategien + Matrix.
- **B — Pixel:** beide Türme komplett (15 Stufen, Richtungen, Idle/Angriff, Icons, Projektile/Effekte: Dornen, Blitz, Ranken, Baumwand,
  Wirbelwind, Trank-Bogen, Säurespritzer, Pfützen, Monster-Verwandlung, Schrumpf-Trank).
- **C — Client:** Einbau beider Türme, Wissensbaum-Bildschirm **größer** + 40 Knoten, Screenshots, Smoke.
