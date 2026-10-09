# Runde 11 P4: Fortschritt und Bildschirme

Einstieg: `runApp(root, { startMatch, store?, sound?, setVolume?, initial?, newMatchId? })` in `client/src/screens/app.ts`
(`main.ts` verdrahtet `startMatch` aus `match/match.ts`, Ton über `audio.play`). Ablauf: Start -> `startMatch` -> `applyMatch` -> Ergebnis.
`?debug` / `?test`: alles frei, Profil nur im Speicher.

Bildschirme: Start (Level, Kartenkachel mit Medaillen, Schwierigkeit), Ergebnis (animierter XP-Balken, Level-Up, Freischalt-Karten, Turm-XP),
Wissensbaum, Turm-Detail (3x5 Stufen, Vorschau beim Überfahren, Freischalten per Klick), Einstellungen, Reset-Hinweis.
Bilder: `node scripts/shots-r11-p4.mjs` -> `p4-*.png` (Demo-Seite `p4-screens.html?scene=...`).

Abweichung vom Entwurf: Start-Turm-XP je Turm (`STARTER_TOWER_XP`), damit die erste Partie nicht ohne Stufen beginnt — 250 in P4, seit Runde 11b **100** (genau Stufe 1).
`MatchResult` von P3 liefert `round` (Runde des Endes), nicht "geschaffte Runden": Niederlage = `round - 1`; Leben verloren = Startleben - `livesLeft`.

## Runde 11b: Freischalten im Match

`?hooks` (nur Pruefskripte): frisches Profil auf Level 4 ohne freie Stufen, nur im Speicher, dazu `window.__dw` — zeigt Sperren und verdeckte Stufen
(`?debug` gibt alles frei). Bilder `node scripts/shots-r11-b.mjs` -> `b-unlock-menue.png`, `b-upgrade-verdeckt.png`, `b-ergebnis-xp.png`, `b-runde-ende.png`.
Match: `match/unlock-menu.ts` (Menue), Knopf „Unlock“ im Panel (`panel.ts`), Toast „+N Ranger XP“ je Typ am Rundenende, Ton `ui.unlock` beim Kauf.
Ergebnis: Turm-XP-Balken laufen vom Stand vor den Rundengewinnen zum Endkonto (im Match Ausgegebenes ist schon abgezogen).
