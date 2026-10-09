# Runde 11 P4: Fortschritt und Bildschirme

Einstieg: `runApp(root, { startMatch, store?, sound?, setVolume?, initial?, newMatchId? })` in `client/src/screens/app.ts`
(`main.ts` verdrahtet `startMatch` aus `match/match.ts`, Ton über `audio.play`). Ablauf: Start -> `startMatch` -> `applyMatch` -> Ergebnis.
`?debug` / `?test`: alles frei, Profil nur im Speicher.

Bildschirme: Start (Level, Kartenkachel mit Medaillen, Schwierigkeit), Ergebnis (animierter XP-Balken, Level-Up, Freischalt-Karten, Turm-XP),
Wissensbaum, Turm-Detail (3x5 Stufen, Vorschau beim Überfahren, Freischalten per Klick), Einstellungen, Reset-Hinweis.
Bilder: `node scripts/shots-r11-p4.mjs` -> `p4-*.png` (Demo-Seite `p4-screens.html?scene=...`).

Abweichung vom Entwurf: Start-Turm-XP 250 je Turm (`STARTER_TOWER_XP`), damit die erste Partie nicht ohne Stufen beginnt.
`MatchResult` von P3 liefert `round` (Runde des Endes), nicht "geschaffte Runden": Niederlage = `round - 1`; Leben verloren = Startleben - `livesLeft`.
