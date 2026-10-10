# run.md — Runde 16: zehn Karten, Wassertürme, mehr Türme und Helden, Challenges (#4)

Du arbeitest in `flashkeks/towerdef` auf **`dev`**. Kein PR, kein Deploy (Deploy macht die Homelab-Sitzung nach Frage an Max).

## 0. Kaltstart
Lies: `docs/design/ENTSCHEIDUNGEN.md` (oben), **`docs/design/runde16.md`** (Spezifikation), `docs/design/karten-gegner-r15.md` §5
(eine Rundenliste 120, Easy/Medium/Hard enden R40/60/80, Freeplay), `schnittstelle.md`, `pixel-stil.md`, `docs/STATUS.md`.
Vorrunde: `docs/archiv/run-runde15.md`.

## 1. Regeln
Subagenten nur Sonnet, max. 3, Zwischenstand alle 30 min, nach Limit neuer Sonnet-Agent auf denselben Worktree. Vor dem Merge: Tests + tsc in
sim/meta/client, build, smoke, Bot-Matrix. Figuren ohne Plattform, Pixel nur aus der Palette. Keine neuen Branches auf GitHub.

## 2. Stand 10.10.2026 (Abbruch wegen Wochenlimit, Hauptsitzung)
**Fertig in `dev`** (nicht live, live ist noch `2026-10-10-3687ddd` = Runde 14b):
Runde 15 (Kartenwahl, Modi, neue Gegner/Bosse), 15b (eine Rundenliste bis R120, Freeplay), 15e (Schiffe cruiser/duskrunner/dreadnought),
Runde 16 K1+K2 (sieben neue Karten gemalt + spielbar), Meta-Leiter mit zehn Karten (`meta/src/data.ts` MAPS + LEVEL_UNLOCKS).

**Halb fertig — als Patches in `docs/wip/<paket>/`** (Worktree-Branches waren nur lokal). Wiederherstellen:
`git worktree add ../wt/X -b X BASIS && cd ../wt/X && git am ../../towerdef/docs/wip/X/*.patch`, danach `docs/wip/X` in `dev` löschen.
**Basis je Paket (geprüft 10.10.2026, Folgesitzung):** `r16e` und `r16h` → `7f802bd`, `git am` läuft sauber.
`r16t` → **`9fd5bc9`** (K1-Zweig, vor dem Merge von 15b/K2) — auf `7f802bd` scheitert schon Patch 0001 an `sim/src/game.ts`.
Danach `git merge dev`: 5 Konfliktblöcke (`sim/src/game.ts` 3 — `perTower`/`STRONG_RANK` brauchen beide Seiten: neue Türme
riverkeeper/bellringer/tinker **und** die späten Schiffe dreadnought/cruiser/duskrunner aus 15b; `meta/src/progress.ts` 1,
`meta/test/progress.test.ts` 1). Nicht `git am -3` auf `dev` versuchen, der Merge ist übersichtlicher.
- ~~`r16t`~~ **erledigt, in `dev`** — Paket T (runde16.md §2/§3): Sim `placement: water`, Riverkeeper/Bellringer/Tinker, Helden bram/sela generalisiert, Meta
  (heroes, selectedHero, buyHero, heroLock, Freischaltung L4/L11/L13, Wissensknoten), Client-Platzhalter-Look. Letzter Schritt laut Agent:
  „remaining client fixes“. Offen: Tests/tsc grün ziehen, Matrix, `tuerme-r16.md` prüfen, STATUS „Runde 16 T“.
- ~~`r16e`~~ **erledigt, in `dev`** — Paket E (Issue #4): ChallengeRules + Code + Sim-Regeln, Tages-Challenge + Belohnung (Meta). Offen: ein Test bei R25
  („more iterations“), Client **angefangen, nicht geprüft** (Patch 0003: `screens/challenges.ts`, `challenge-edit.ts`, `challenge-result.ts`,
  `challenge-ui.ts`, `challenge.css`, `scripts/shots-r16-e.mjs`, ~720 Zeilen) — tsc/Tests/Screenshots dafür fehlen, `docs/design/challenges.md` fehlt.
- ~~`r16h`~~ **erledigt, in `dev`** — Paket H: Startseite für zehn Karten (Kacheln liefen unten aus dem Bild). Nur kleiner Anfang (154 Zeilen). Ziel: ohne Scrollen
  bei 1280×720, Reiter nach Stufe oder Seiten à 5, Schloss mit Bedingung, Platz für Knopf „Challenges“.

## 3. Danach
- **TP**: Pixel-Figuren für Riverkeeper/Bellringer/Tinker (Stufen-Looks) und Bram/Sela, Wasser-Platzier-UI, Helden-Auswahl im Setup, Store-Rubrik Heroes.
- Merge-Reihenfolge: H → T → E (E und H fassen beide `home.ts` an: E nur einen Knopf).
- Vor dem Deploy: Screenshots, STATUS, dann Homelab-Sitzung fragt Max (erst zeigen, was geändert wurde).
- Issue #5 (Server/Bestenliste) braucht Max/edge. Issue #3 nach dem Deploy schließen (Market, Karten, Freeplay erledigt).
