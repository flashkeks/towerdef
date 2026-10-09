# run.md — Runde 13: Lantern Market, Longshot, großer Wissensbaum, Figuren ohne Plattform

Du arbeitest in `flashkeks/towerdef` auf **`dev`**. Kein PR, kein Deploy.

## 0. Kaltstart
„Duskwardens“: Web-Tower-Defense wie Bloons TD 6, nur intern. `sim/` (deterministischer Kern), `meta/` (Profil, ohne DOM),
`client/` (Vite + PixiJS v8, Pixel-Art im Code). Lies: `docs/design/ENTSCHEIDUNGEN.md` (oben), **`docs/design/tuerme-r13.md`
(Spezifikation dieser Runde)**, `tuerme.md` (Regeln + Nachträge), `schnittstelle.md`, `pixel-stil.md`, `powers.md`, `docs/STATUS.md`.
Vorrunden: `docs/archiv/run-runde11.md`, `run-runde12.md`. Später: Runde 14 (Thornweaver, Alchemist), Issues #3–#5.

## 1. Regeln
Subagenten nur Sonnet, max. 3, Zwischenstand alle 30 min committen, nach Nutzungslimit neuen Sonnet-Agenten auf denselben Worktree.
Vor jedem Merge: Tests + tsc in sim/meta/client, `npm run build`, `npm run smoke`, Bot-Matrix (`cd sim && npm run matrix`) um die neuen
Türme ergänzt. Screenshots in `client/docs/r13/`.

## 2. Pakete
- **A — Sim + Meta:** Market (Einkommen, Bank, Auren, Grant), Longshot (Karten-Reichweite, schnelles Projektil, Fähigkeiten, Markierung),
  Wissensbaum 30 Knoten + Punkte aus Medaillen, Freischalt-Level, Bot-Strategien + Matrix.
- **B — Pixel:** **alle Plattformen/Sockel weg** (nur Schatten), die drei alten Türme mit **deutlicheren Stufen** (Größe, Farbe, Ausrüstung,
  T3 neue Silhouette, T4 Rüstung/Leuchten, T5 Verwandlung), Market und Longshot komplett (15 Stufen, Richtungen, Idle/Angriff, Icons,
  Projektile/Effekte: Münzflug, Mündungsfeuer, Kiste, Markierung).
- **C — Client:** Einbau Market/Longshot (Turm-Leiste, Panel, Bank-Knopf „Withdraw“, Auren-Ringe, Fähigkeiten), Wissensbaum-Bildschirm
  für 30 Knoten / 5 Äste, Screenshots, Smoke.
