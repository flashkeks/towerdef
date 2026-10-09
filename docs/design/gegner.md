# Gegner (Runde 11, Vertical Slice)

Verbindlich für P1 (`sim/data/enemies.json`) und P2 (Figuren). Vorbild: BTD6-Bloons (`docs/games/btd6/enemies-waves.md`).

## Regeln

- **Schichten:** Jeder Gegner hat eine Hülle mit HP. Fällt sie auf 0, **platzt** er: an seiner Stelle erscheinen die Kinder
  (auf dem Weg um ±3 px je Kind versetzt), sichtbar kleiner/anders. **Überschüssiger Schaden geht an jedes Kind weiter**
  (wie BTD6), außer beim Boss (Hülle schluckt den Rest, BTD6: MOAB-Klasse gibt keinen Schaden weiter). Das Projektil, das den
  Eltern-Gegner geknackt hat, trifft dessen Kinder nicht mehr.
- **RBE** (Red Bloon Equivalent) = Summe aller HP im Baum. Eine Zahl für die Stärke einer Runde (Lehre 5).
- **Leck:** erreicht ein Gegner das Stadttor, kostet er **Leben = seine aktuelle RBE** (Rest-HP der Hülle + RBE der Kinder).
- **Pop-Cash:** **+1 Gold je geknackter Schicht** (jede Hülle, die auf 0 fällt). Boss-Hülle: +100.
- **Tempo** relativ zu Red; Red = **52 px/s** auf Easy (Weg ≈ 1.650 px → ≈ 32 s). Medium × 1,1, Hard × 1,25 (BTD6).
- **Shade (Camo)** ist ein Merkmal, kein eigener Typ: jede Spawn-Gruppe kann `camo: true` tragen; die **Kinder erben** Camo
  (BTD6). Nur Türme mit Erkennung zielen darauf; Projektile, Explosionen und Auren treffen trotzdem. Wrens „Flare“ enttarnt.
- **Status:** Verlangsamen (stärkster Wert zählt, Dauer frischt auf), Betäuben/Einfrieren (steht still), Brand (Schaden über Zeit).
  Kinder erben Verlangsamung **nicht** (BTD6). Eingefrorene nehmen keinen `sharp`-Schaden.

## Typen

| ID | Name | Hülle HP | Tempo | Kinder | RBE | Cash | Merkmal | Radius |
|---|---|---:|---:|---|---:|---:|---|---:|
| `red` | Red Glim | 1 | 1,0 | – | 1 | 1 | – | 6 px |
| `blue` | Blue Glim | 1 | 1,4 | red | 2 | 2 | – | 6 |
| `green` | Green Glim | 1 | 1,8 | blue | 3 | 3 | – | 6 |
| `gold` | Gold Glim | 1 | 3,2 | green | 4 | 4 | **schnell** | 6 |
| `ironshell` | Ironshell | 1 | 1,0 | 2 × gold | 9 | 9 | **gepanzert**: immun gegen `sharp` | 7 |
| `ember` | Emberling | 1 | 2,0 | 2 × gold | 9 | 9 | **kälte-immun**: kein `cold`-Schaden, keine Verlangsamung, kein Einfrieren | 6 |
| `brute` | Gloom Brute | 10 | 1,6 | ironshell + ember | 28 | 19 | **zäh** (mehrere Treffer), Risse bei 70/40 % | 9 |
| `leviathan` | Dusk Leviathan | 300 (Easy 200) | 0,6 | 4 × brute | 412 | 176 | **Boss**: Verlangsamung/Betäubung nur halb bzw. nur mit Spezial-Upgrades, kein Einfrieren außer Absolute Zero (1,5 s), Panzerplatten fallen bei 75/50/25 % | 22 |

**Warum diese sieben:** Rot/Blau/Grün/Gold sind die Schichtenleiter und das Tempo-Problem (Gold rennt). Ironshell zwingt zu
Explosion, Magie oder Kälte (Ranger allein reicht nicht, BTD6-Blei). Emberling zwingt den Frostcaller-Spieler zu einem
zweiten Turm oder Pfad C (Blitz). Brute ist das „viel HP“-Problem und trägt beide Spezialfälle in sich. Shade (Camo) braucht
Ranger C2, Frostcaller C2, Wren L5 oder Flare. Der Leviathan ist die Prüfung in Runde 20 (MOAB in Runde 40 bei BTD6).

## Boss: Dusk Leviathan

- Auftritt Runde 20 mit Namensbanner, Spawn langsam aus dem Waldrand, Schatten auf dem Boden.
- 300 HP Hülle, Medium-Tempo 0,6 × 52 × 1,1 ≈ 34 px/s → ≈ 48 s für den Weg, wenn nichts bremst.
- Schaden durch Bonus-Upgrades: Ranger C4/C5, Bombardier A3–A5, Frostcaller B4, Wren Dawnbreak. Ohne eines davon ist der Boss
  hart: so gewollt („Boss braucht Vorbereitung“, run.md P5).
- Leck = **412 Leben** → auf jeder Stufe sofort verloren, wenn die Hülle steht. Platzt die Hülle, kommen 4 Brutes.

## Nachtrag P1/P5 (09.10.2026) — gilt vor den Tabellen oben

- **Tempo** (P1): Red 52 px/s × `speedBp` Easy 0,75 / Medium 0,85 / **Hard 1,0** (P5: Hard von 0,9 auf 1,0). Mit den Original-
  faktoren 1,0/1,1/1,25 war ab R7 nichts zu halten.
- **Gloom Brute Tempo 1,3** statt 1,6 (P5).
- **Pop-Cash 2 je Schicht** (P5, siehe `runden.md`), Boss-Hülle 100.
- **Leviathan Hard: 400 HP** (P5; Easy 200, Medium 300).
