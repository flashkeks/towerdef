# Meta-Balance: Zufluss, Gacha, Level (Runde 7, P5)

**Alles Startwerte**, grob gerechnet, nicht kalibriert (`recommendations.md` §19 Nr. 14 bleibt offen). Zahlen stehen in `meta/data/rewards.json`,
`meta/src/leveling.ts` (Kostenkurve), `meta/src/progression.ts` (XP-Kurve), `meta/src/starter.ts` (Geschenk). Rechnung nachbaubar mit `rewardAmounts`,
`levelUpTotalCost`, `xpToReach`.

## Belohnung je Lauf (nachgerechnet aus dem Replay)

Gold und Spieler-XP = Siegbonus (nur Sieg) + Wert je gehaltener Welle (alle Gegner getötet, kein Leak; bis 20; bei Sieg alle 20). Crystals nur beim Sieg. Eine Niederlage mit mindestens einer gehaltenen Welle geht also nicht leer aus; wer nur Wellen vorruft, bekommt nichts.

| Stufe | Crystals Erst / Wdh. | Gold Sieg (W20) | XP Sieg (W20) | Niederlage in W10: Gold / XP |
|---|---|---|---|---|
| Normal | 100 / 25 | 150 + 10·20 = 350 | 60 + 2·20 = 100 | 100 / 20 |
| Hard | 150 / 38 | 225 + 15·20 = 525 | 90 + 3·20 = 150 | 150 / 30 |
| Nightmare | 200 / 50 | 300 + 20·20 = 700 | 120 + 4·20 = 200 | 200 / 40 |

Wiederholung = 25 % des Erst-Clears (kaufmännisch gerundet). XP-Sieg entspricht `recommendations.md` §15 (100/150/200). Unit-XP gibt es nicht:
Units steigen mit Gold (ein Spielerhebel weniger, kein totes `unit.xp`). Nachrechnen eines vollen Laufs: ca. 70–100 ms in Node.

## Kurven

- **Spieler-XP** (§15): zum nächsten Level 100 + 25·(L−1). Gesamt: L5 = 550, L10 = 1 800, L25 = 9 300, L50 = 34 300. In Normal-Siegen (100 XP): L5 nach 6 Siegen
  (Hard-Freischaltung), L25 nach 93, L50 nach 343. Niederlagen zählen anteilig.
- **Unit-Level** (Gold): Aufstieg von L auf L+1 kostet 40 + 10·(L−1) (40, 50 … 420), wie die XP-Kurve in §15, nur in Gold. Eine Unit L1 → L20 = 2 470, L1 → L40 = 8 970.
  Ein Team aus 6: **L20 = 14 820, L40 = 53 820 Gold**.

## Zufluss pro Tag

Annahme: jeder Clear ist ein Sieg in Welle 20. Es gibt in dieser Runde **eine** Stage (`standard20`), Erst-Clears sind also einmalig 100 + 150 + 200 = 450 Crystals;
Tagesaufgaben (§13) sind nicht gebaut.

| Szenario (4 Siege/Tag) | Crystals/Tag | Gold/Tag | Spieler-XP/Tag |
|---|---:|---:|---:|
| nur Normal | 100 | 1 400 | 400 |
| Hard (ab L5) | 152 | 2 100 | 600 |
| Nightmare (ab L25) | 200 | 2 800 | 800 |

## Gacha (rec §13, Banner `standard`)

Mythic 1 %, harte Garantie beim 150. Zug, 50 Crystals je Zug, 450 je 10er. Erwartung bis zum ersten Mythic: E = (1 − 0,99^150)/0,01 = **77,9 Züge**
= 3 893 Crystals (3 505 mit 10er-Preis). Legendary: E = 19,0 Züge.

Tage bis zum ersten Mythic (Erwartungswert, 10er-Preis, inkl. Starter 450 und Erst-Clears; einfache Tagesrechnung per Skript):

| Spieler | Tag |
|---|---:|
| 4 Siege/Tag, nur Normal | 30 |
| 4 Siege/Tag, immer höchste freie Stufe (optimistisch: gewinnt Nightmare) | 18 |
| dasselbe plus Tagesaufgabe 100/Tag (nicht gebaut) | 12 |
| 2 Siege/Tag, höchste Stufe | 36 |

Das Ziel „erstes Mythic nach 2–4 Wochen aktivem Spiel“ wird mit einer Stage und ohne Tagesaufgaben nur am oberen Rand getroffen (Normal-Spieler: gut 4 Wochen).
Das Pity-Maximum (150 Züge = 6 750 Crystals) liegt bei 4 Siegen/Tag Normal bei ca. 60 Tagen. **Hebel, wenn es zu zäh ist:** Tagesaufgabe bauen (−6 Tage bei höchster Stufe),
Wiederholungsanteil von 25 % auf 40 % (Normal-Spieler ca. 20 Tage), oder mehr Stages (Erst-Clears).

## Gold: Team-Level

| Ziel (6 Units) | Gold | Tage bei 4 Siegen (nur Normal / höchste Stufe) |
|---|---:|---|
| L20 | 14 820 | 11 / 8 |
| L40 | 53 820 | 39 / 24 |

L40 in 3–6 Wochen: passt zu „Meta-Faktor erst nach der Wippen-Phase“ (§15). Der Schadensfaktor je Level (P2) ändert daran nichts.

## Erster Fortschritt nach Stage 1

Neues Profil: Starter 450 Crystals (ein 10er-Zug sofort, Abnahmeziel erfüllt) + Start-Sammlung. Erster Normal-Sieg: +100 Crystals, 350 Gold (8 Aufstiege L1 → L2, oder
Striker bis ca. L5), 100 XP (Level 2). Nach 6 Siegen Spieler-Level 5 = Hard offen. Eine Niederlage in Welle 10 bringt trotzdem 100 Gold und 20 XP.

## Start-Sammlung (Bot-Messung, Normal, 4 Seeds, grob)

Bots dürfen nur die geschenkten Units kaufen (`botTuning.banned`). Siege je 4 Seeds, Bots `wide`/`upgrade`/`aoe`/`greedy` (alle `@normal`):

| Sammlung | wide | upgrade | aoe | greedy |
|---|---|---|---|---|
| nur Rare (Striker, Gunner) | 0/4 | 0/4 | 0/4 | 0/4 (Welle 5–13) |
| Rare + Epic | 0/4 | 0/4 | 0/4 | 0/4 (Welle 11–20, scheitert am Boss) |
| Rare + Epic + Frost | 1/4 | 2/4 | 4/4 | 3/4 |
| **Rare + Epic + Lancer (gewählt)** | **4/4** | 1/4 | **4/4** | 3/4 |
| Rare + Epic + Titan | 0/4 | 0/4 | 0/4 | 0/4 |

Ohne Legendary kommt kein Bot an den Boss von Welle 20 vorbei (Titan als Boss-Antwort hilft allein nicht, Lancer schon). Das Geschenk enthält deshalb **alle Rare und Epic plus Lancer**.
Die Bots spielen nicht wie Menschen; die Zahl sagt nur, dass Normal mit dem Geschenk machbar ist. Der Lancer ist im Gacha ein Legendary (4 %): Wer ihn schon hat, spart die Hälfte
des Wegs zum ersten Boss-Sieg. Das ist bewusst großzügig; Gegenvorschlag in „Offene Frage“ des Berichts.

## Grenzen

- Replay-Farmen: dasselbe Replay zahlt nur einmal (Ledger `match/<stage>-<difficulty>-<seed>-<tick>-<hash>`); ein anderer Seed oder anderes Spiel zählt neu. Lokal ist alles editierbar
  (kein Manipulationsschutz am Speicherstand); der Server (M2) rechnet dieselbe Funktion nach und begrenzt die Rate.
- `unitMods` im Replay-Kopf (v3, P2) werden durchgereicht; dass sie zum Profil passen (`unitModsFor`), muss der Aufrufer prüfen (siehe `meta/README.md`).
