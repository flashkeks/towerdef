# Playtests: Replays von Max und Plori

Jede Runde im Spiel wird mitgeschrieben (Seed, Stufe, alle Befehle mit Tick, Leben/Münzen/Leaks je Welle, Tempo- und Pausenwechsel, Endergebnis, End-Hash). Daraus lässt sich die Runde im Simulator **exakt nachspielen**. Kein Server, kein Upload, keine personenbezogenen Daten (kein Name, keine IP, kein Gerät; nur der freiwillige Freitext).

## Für Spielerinnen und Spieler

1. Runde spielen (Sieg oder Niederlage).
2. Im End-Bildschirm unter **„What felt bad?“** kurz aufschreiben, was sich schlecht angefühlt hat (zu schwer, unklar, langweilig, Bug ...). Optional.
3. **„Download replay“** drücken. Es entsteht `duskwardens-STUFE-ERGEBNIS-DATUM.json` (z. B. `duskwardens-hard-loss-2026-10-07.json`).
4. Mitten in der Runde geht es auch: pausieren (Leertaste), dann erscheint unten links **„Download replay“**. Die Datei ist dann ein Zwischenstand (`complete: false`, Ergebnis `pause`).
5. Datei an Max schicken (Chat/Mail).

## Für die Auswertung

Datei in diesen Ordner legen (Name beibehalten, bei Duplikaten Namen ergänzen). Dateien, die als Beispiel für Tests dienen, heißen `beispiel-*.json`; der Sim-Test spielt alle v2-`beispiel-*.json` nach und prüft v1-Dateien als „altes Regelwerk“.

```bash
cd sim
npm run replay -- ../docs/balancing/playtests/DATEI.json            # nachspielen, Hash prüfen, Bericht
npm run replay -- ../docs/balancing/playtests/DATEI.json --compare  # plus Bot-Lauf (gleiche Stufe, gleicher Seed, wide@normal)
npm run replay -- DATEI.json --compare --bot upgrade@normal         # anderer Bot
```

Der Bericht zeigt je Welle Start-Tick, Münzen, Leben, Kills und Leaks (nach Gegnertyp), die Münzkurve, gekaufte Units, Upgrades, verkaufte Units und abgelehnte Befehle, dazu den Freitext. Mit `--compare` steht der Bot-Verlauf daneben: Wo der Mensch bei Münzen oder Leaks vom Bot abweicht, liegt meist die Stelle, an der sich das Spiel anders anfühlt.

**Exit-Code:** 0 = Hash und Ergebnis stimmen, 1 = Abweichung (Datei und Replay laufen auseinander), 2 = Datei unbrauchbar, 3 = altes Regelwerk (v1).

### Abweichung heißt

- Die Sim hat sich seit der Aufnahme geändert (Balance, Daten). Dann stimmt die Datei zur Spielversion `gameVersion`, nicht zu `dev`. Zum Nachspielen den Stand dieser Version auschecken.
- Die Datei wurde von Hand verändert, oder der Client hat einen Befehl nicht protokolliert (Bug im Recorder).

## Format v1 und v2 (Runde 6)

| Version | `place` im Befehl | Regelwerk | `npm run replay` |
|---|---|---|---|
| **1** | `slot` (Slot-ID) | feste Slots, Limit je Unit-Typ (bis Runde 5, `dev` vor P1 der Runde 6) | meldet **„altes Regelwerk (v1, Slots)“**, Exit-Code **3**, kein Hash-Fehler und kein Stacktrace. Die Wellen-Zahlen im Bericht stammen aus der Datei (Aufnahme des Clients), `--compare` läuft weiter |
| **2** | `x`, `y` (Milli-Tiles, Mitte der Unit) | freie Platzierung, kein Typ-Limit | spielt nach, prüft Hash und Ergebnis (Exit 0/1) |

Der Client schreibt seit Runde 6 / P1 `formatVersion: 2` (`REPLAY_FORMAT_VERSION` in `client/src/game/recorder.ts`); der Befehl wird 1:1 mitgeschrieben, trägt also `x`/`y`, sobald der Client Positionen schickt (P3). Die v1-Dateien `beispiel-normal.json` und `2026-10-07-max-normal-loss.json` bleiben als Dokument liegen (Max' Playtest lässt sich über den Bericht und `--compare` weiter lesen, nur nicht mehr per Hash prüfen). Das v2-Beispiel `beispiel-v2-bot-normal.json` hat der Simulator selbst erzeugt (Bot `wide@normal`, Normal, Seed 7, Sieg), nicht der Browser:

```bash
cd sim && npx tsx scripts/export-replay.ts --bot wide@normal --difficulty normal --seed 7 --out ../docs/balancing/playtests/beispiel-v2-bot-normal.json
```

`test/replay.test.ts` prüft v2 per Hash und v1 als „altes Regelwerk“. Exit-Codes: 0 Hash und Ergebnis stimmen, 1 Abweichung, 2 Datei unbrauchbar, **3 altes Regelwerk**.

## Format (`formatVersion` 1, Stand bis Runde 5; v2 unterscheidet sich nur im `place`-Befehl)

`format: "towerdef-replay"`, `gameVersion`, `stage`, `difficulty`, `players`, `seed`, `team` (null bis zur Team-Wahl), `cards` (gewählte Risikokarten), `complete`, `result` (`win`/`loss`/null), `endTick`, `endHash`, `endWave`, `endLives`, `endCoins`, `durationTicks`, `durationMs`, `date`, `commands` (`tick`, `player`, `cmd`, `ok`, `reason` bei Ablehnung), `controls` (Tempo/Pause mit Tick), `waves` (Start-Tick, Münzen/Leben zu Beginn und Ende, Leaks, Kills), `feedback`.

`tick` eines Befehls ist `sim.state.tick` unmittelbar vor `apply`. Abgelehnte Befehle stehen mit `ok: false` in der Liste; das Replay wendet sie ebenfalls an und prüft, dass sie wieder abgelehnt werden.

## Abnahme im Browser

`client/scripts/replay-check.mjs` spielt eine Runde im echten Chromium, fängt den Download ab und lässt `npm run replay` darüber laufen:

```bash
cd client && npm run build
SMOKE_PORT=4302 npm run replay-check            # bis Welle 3, Download über den Pause-Knopf
SMOKE_PORT=4302 npm run replay-check -- --full  # bis zum Ende, Freitext, Download im End-Bildschirm (rund 3 Minuten)
```

`beispiel-normal.json` (v1) stammt aus einem `--full`-Lauf (Niederlage in Welle 8, Seed 1802315095, schnelles Wellenrufen ohne Verteidigung) und ist seit Runde 6 / P1 nur noch Dokument.

## Wichtig: Replays gelten nur für denselben Datenstand

Ein Replay ist Seed + Befehle. Ändern sich die Spieldaten (`sim/data/*.json`, z. B. Bounty, Boss-HP, Kosten), läuft dieselbe Befehlsliste anders ab: Käufe scheitern an fehlenden Münzen, der End-Hash weicht ab. Darum steht die Spiel-Version (Commit) in jeder Datei.
Zum Auswerten älterer Replays den passenden Stand auschecken (`git checkout VERSION -- sim/data`) oder das Replay als Verhaltensdaten lesen (Bericht ohne Hash-Prüfung). Nach jeder Regel- oder Balance-Änderung das v2-Beispiel neu erzeugen (`scripts/export-replay.ts`, siehe oben); sobald der Client Positionen schickt (P3), zusätzlich ein Browser-Beispiel: `cd client && npm run build && npm run replay-check -- --full`.


## Playtest-Log

| Datei | Wer | Stufe | Ergebnis | Befund |
|---|---|---|---|---|
| `2026-10-07-max-normal-loss.json` | Max | Normal | verloren W18, Hash OK | Team ohne Farm, Titan im Team aber nie gekauft. Flieger-Leaks W8 (4) und W16 (10) = Luftabwehr fehlte. 5 × `cap-reached` beim Striker (Max: „kein Limit je Typ"). Starb mit 1132 ungenutzten Münzen. Bot `wide` gewinnt Normal zu 92 %: Normal ist für einen Erstspieler ohne Erklärung härter als für den Bot, Lesbarkeit von Flieger-Wellen prüfen |
