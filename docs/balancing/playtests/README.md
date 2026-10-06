# Playtests: Replays von Max und Plori

Jede Runde im Spiel wird mitgeschrieben (Seed, Stufe, alle Befehle mit Tick, Leben/Münzen/Leaks je Welle, Tempo- und Pausenwechsel, Endergebnis, End-Hash). Daraus lässt sich die Runde im Simulator **exakt nachspielen**. Kein Server, kein Upload, keine personenbezogenen Daten (kein Name, keine IP, kein Gerät; nur der freiwillige Freitext).

## Für Spielerinnen und Spieler

1. Runde spielen (Sieg oder Niederlage).
2. Im End-Bildschirm unter **„What felt bad?“** kurz aufschreiben, was sich schlecht angefühlt hat (zu schwer, unklar, langweilig, Bug ...). Optional.
3. **„Download replay“** drücken. Es entsteht `duskwardens-STUFE-ERGEBNIS-DATUM.json` (z. B. `duskwardens-hard-loss-2026-10-07.json`).
4. Mitten in der Runde geht es auch: pausieren (Leertaste), dann erscheint unten links **„Download replay“**. Die Datei ist dann ein Zwischenstand (`complete: false`, Ergebnis `pause`).
5. Datei an Max schicken (Chat/Mail).

## Für die Auswertung

Datei in diesen Ordner legen (Name beibehalten, bei Duplikaten Namen ergänzen). Dateien, die als Beispiel für Tests dienen, heißen `beispiel-*.json`; der Sim-Test spielt alle `beispiel-*.json` nach.

```bash
cd sim
npm run replay -- ../docs/balancing/playtests/DATEI.json            # nachspielen, Hash prüfen, Bericht
npm run replay -- ../docs/balancing/playtests/DATEI.json --compare  # plus Bot-Lauf (gleiche Stufe, gleicher Seed, wide@normal)
npm run replay -- DATEI.json --compare --bot upgrade@normal         # anderer Bot
```

Der Bericht zeigt je Welle Start-Tick, Münzen, Leben, Kills und Leaks (nach Gegnertyp), die Münzkurve, gekaufte Units, Upgrades, verkaufte Units und abgelehnte Befehle, dazu den Freitext. Mit `--compare` steht der Bot-Verlauf daneben: Wo der Mensch bei Münzen oder Leaks vom Bot abweicht, liegt meist die Stelle, an der sich das Spiel anders anfühlt.

**Exit-Code:** 0 = Hash und Ergebnis stimmen, 1 = Abweichung (Datei und Replay laufen auseinander), 2 = Datei unbrauchbar.

### Abweichung heißt

- Die Sim hat sich seit der Aufnahme geändert (Balance, Daten). Dann stimmt die Datei zur Spielversion `gameVersion`, nicht zu `dev`. Zum Nachspielen den Stand dieser Version auschecken.
- Die Datei wurde von Hand verändert, oder der Client hat einen Befehl nicht protokolliert (Bug im Recorder).

## Format (`formatVersion` 1)

`format: "towerdef-replay"`, `gameVersion`, `stage`, `difficulty`, `players`, `seed`, `team` (null bis zur Team-Wahl), `cards` (gewählte Risikokarten), `complete`, `result` (`win`/`loss`/null), `endTick`, `endHash`, `endWave`, `endLives`, `endCoins`, `durationTicks`, `durationMs`, `date`, `commands` (`tick`, `player`, `cmd`, `ok`, `reason` bei Ablehnung), `controls` (Tempo/Pause mit Tick), `waves` (Start-Tick, Münzen/Leben zu Beginn und Ende, Leaks, Kills), `feedback`.

`tick` eines Befehls ist `sim.state.tick` unmittelbar vor `apply`. Abgelehnte Befehle stehen mit `ok: false` in der Liste; das Replay wendet sie ebenfalls an und prüft, dass sie wieder abgelehnt werden.

## Abnahme im Browser

`client/scripts/replay-check.mjs` spielt eine Runde im echten Chromium, fängt den Download ab und lässt `npm run replay` darüber laufen:

```bash
cd client && npm run build
SMOKE_PORT=4302 npm run replay-check            # bis Welle 3, Download über den Pause-Knopf
SMOKE_PORT=4302 npm run replay-check -- --full  # bis zum Ende, Freitext, Download im End-Bildschirm (rund 3 Minuten)
```

`beispiel-normal.json` stammt aus einem `--full`-Lauf (Niederlage in Welle 8, Seed 1802315095, schnelles Wellenrufen ohne Verteidigung).

## Wichtig: Replays gelten nur für denselben Datenstand

Ein Replay ist Seed + Befehle. Ändern sich die Spieldaten (`sim/data/*.json`, z. B. Bounty, Boss-HP, Kosten), läuft dieselbe Befehlsliste anders ab: Käufe scheitern an fehlenden Münzen, der End-Hash weicht ab. Darum steht die Spiel-Version (Commit) in jeder Datei.
Zum Auswerten älterer Replays den passenden Stand auschecken (`git checkout VERSION -- sim/data`) oder das Replay als Verhaltensdaten lesen (Bericht ohne Hash-Prüfung). Nach jeder Balance-Änderung `beispiel-normal.json` neu erzeugen: `cd client && npm run build && npm run replay-check -- --full`, Datei aus der Ausgabe hierher kopieren (so geschehen beim Merge von Runde 5 P3).
