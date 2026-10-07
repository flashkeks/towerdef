# Maßstab: AA-Werte im Match (Runde 8 / P1)

**Entscheidung:** AA-Werte werden **unverändert** übernommen (Yen, Schaden, Sekunden pro Angriff). Zwei feste Umrechnungen und eine Anhebung der Gegner-/Einkommenswerte, alles als Zahlen in `sim/data/economy.json` und `sim/data/enemies.json`, nichts im Code.

| Größe | Wert | Datei / Feld | Begründung |
|---|---|---|---|
| AA-Studs -> Kacheln | **5 Studs = 1 Kachel** | `economy.scale.studsPerTile` | AA-Range liegt bei Median 24 Studs, Radien bei 5-12, Linienbreiten bei 3-5. Mit 5 wird Range 25 zu 5 Kacheln (Karte 17 x 11, Pfad 42 Kacheln lang: eine mittlere Unit deckt ca. 10 Kacheln Pfad, ein Viertel der Strecke), Radius 8 zu 1,6 Kacheln (Pulk von 3-5 Gegnern), Linienbreite 4 zu 0,8 Kacheln (so breit wie der Pfad). Kleiner wäre jede Unit ein Scharfschütze, größer deckte jede den halben Pfad |
| AA-Yen -> Münzen | **1 Yen = 1 Münze** | `economy.scale.yenPerCoin` | Platzier- und Upgrade-Preise und Farm-Erträge bleiben, wie AA sie nennt (Median Platzieren Mythic 1350, voller Ausbau 50 500). Kein zweiter Maßstab zum Verwechseln |
| Schaden, SPA, Sekunden | 1:1 | — | `damage` in HP, `spa` in Sekunden (`x 20` Ticks), Effekt-Dauern in Sekunden |
| Start-Münzen | **3000** | `economy.startCoins` | zwei bis drei Mythics zum Start (Platzierung Mythic 1000-1750, Secret 1600), AA nennt keinen Wert (UNKNOWN, `economy.md`) |
| Wave-Bonus | **500 + 150 x Wave** | `economy.waveBonus` | Summe über 20 Waves 41 500; die Kills (`bounty`, ca. 0,7 x HP, fallend) kommen dazu |
| Verkauf | **25 %** | `economy.sell` | AA-Wert (design-brief § 3); Farm gleich |
| Gegner-HP | **Wave 1 Grunt 300 HP**, x1,1525 je Wave | `enemies.hpCurve.baseCenti` 30000 | siehe unten |

## Warum die Gegner-HP so liegen

AA-Gegner-HP sind **in keiner Quelle belegt** (`design-brief.md` Abschnitt 9, `waves.md`); die Unit-Seite ist es. Die HP wurden deshalb so gewählt, dass die **AA-Unit-Werte** gegen das Normal-Tempo der bestehenden Stage `standard20` spielbar sind:

- Eine Mythic auf Stufe 0 macht 300-800 Schaden je 6-8 s (ca. 40-120 DPS), voll ausgebaut 4000-9000 je 7 s (ca. 600-1300 DPS). Epic- und Rare-Units liegen bei 5-20 DPS (AA: Epic Stufe 0 median 10 Schaden, Mythic 400): in AA-Zahlen sind sie Füllmaterial für die ersten Waves, nicht für Welle 20. Das ist AA, kein Fehler des Imports.
- Wave 1 (8 Grunts à 300 HP x 1,57 Normal-Faktor = 471 HP) fällt einer Mythic auf Stufe 0 in einem Durchgang. Welle 20 hat Boss (ca. 95 000 HP), Elite (ca. 55 000) und 7 Grunts (ca. 6 800 HP): drei bis fünf ausgebaute Mythics, wie sie 41 500 Wave-Bonus plus Kills bezahlen.
- **Niedrigere HP machen das Spiel nicht leichter**: Kill-Münzen sind ein Anteil der HP (`gamma x HP`), halbe HP halbieren das Einkommen. Gemessen: bei halber und kleinerer Basis verlor derselbe Bot früher (Wave 11-13 statt Sieg), weil das Geld für Upgrades fehlte. Gegner-HP und Einkommen müssen zusammen skaliert werden.
- Boden-Units treffen **keine Flieger** (AA-Regel), die Stage hat Fliegerwellen ab Welle 8: ein Team nur aus Bodenunits verliert dort. Die Rauchtests nehmen deshalb eine Hügel-Unit als „starke Unit“.

Messung (Rauchtest, kein Balancing, `scripts/sim-cli.ts`, Normal, Seeds 1, 3, 7): `mono-goku_ssj3` (Mythic, Hügel, `circle` mit 3 Treffern) gewinnt mit 30 von 30 Leben, `mono-rikka_evo` (Mythic, Hybrid) ebenso; `mono-stain` (Mythic, Boden) verliert in Welle 11 an den Fliegern; Rare-Units allein halten keine Welle. Die Stufen Hard/Nightmare (HP-Faktoren, Modifier, Elemente) bleiben unverändert und sind **nicht** neu kalibriert (Kurswechsel Punkt 4: keine Messreihen). Wer die Schwierigkeit anfassen will, ändert `enemies.hpCurve.baseCenti` (Gegner-HP), `economy.waveBonus` und `startCoins` (Einkommen) gemeinsam.

## Was P2/P3/P4 wissen müssen

- P3 (Welten): neue Stages tragen **eigene Wave-Tabellen**; HP-Skalierung läuft weiter über `enemies.hpCurve` (global), der Archetyp-Faktor `fHpBp` und der Stufen-Faktor `difficulties.*.hpBp`. Eine AA-Welt mit schwächeren Gegnern = kleinerer `fHpBp` im Archetyp, nicht ein anderer Maßstab der Units. Gegner dürfen Schwächen/Resistenzen tragen: `weakBp`/`resist` im Archetyp (siehe `format.md` und `sim/README.md`).
- P2 (Importer): Kosten, Schaden, SPA, Range, Radius, Breite stehen in AA-Zahlen in den Dateien; **nichts umrechnen**.
- P4 (Interface): `UnitDef` enthält bereits die umgerechneten Festkomma-Werte (`placeCost` in Münzen, `levels[].rangeMilli` in Milli-Kacheln, `damageCenti`, `spaTicks`); AA-Rohwerte sind nicht mehr im `UnitDef`.
