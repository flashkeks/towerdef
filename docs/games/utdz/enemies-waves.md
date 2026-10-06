# UTDZ - Gegner und Waves (Priorität)

Format: `Wert [Herkunft/Sicherheit Quelle]`. Siehe [sources.md](sources.md).

## Ehrliche Lage

Das Wiki dokumentiert Gegner-HP, -Speed und die Wave-Zusammensetzung nicht. In den Datenmodulen (StoryData, RaidData, VirtualRealmData, WorldRaidData) stehen nur Act-Namen, Bosse, Belohnungen und Drops. Nach drei Versuchen (Module, Story-/Legend-Seiten, Beginners Guide) bleiben UNKNOWN:

| Wert | Status |
|---|---|
| Gegnertypen mit HP und Speed | `UNKNOWN` (Basis-HP, Basis-Speed) |
| HP-Skalierung über Waves (Formel/Tabelle) | `UNKNOWN` |
| Wave-Zusammensetzung einer kompletten Stage | `UNKNOWN` |
| Boss-HP (außer World-Raid-Schadensziele) | `UNKNOWN` |
| Wavezahl Story/Legend | ca. 15 Waves "typisch" [O/LOW UTDZ-S18] |
| Wavezahl Blitz Rush (LTM) | 7 Waves [O/LOW UTDZ-S18] |

## Belegte Gegnereigenschaften

| Typ | Eigenschaften | Quelle |
|---|---|---|
| Normal | Element zugewiesen (alle Gegner haben ein Element, 1,5x/0,5x) | [O/HIGH UTDZ-S11] |
| Armored | reduziert Schaden von Units ohne Anti-Armor-Passive; Greybeard +65 %, Underworld God Primordial erster Treffer 75 % | [O/MEDIUM UTDZ-S14, UTDZ-S8] |
| Shielder (seit 2.0) | hat eine Anzahl Schild-Stacks; jede Schadensinstanz entfernt einen Stack, danach nimmt der Gegner Schaden. Multi-Hit und schnelle Angriffe sind im Vorteil | [O/HIGH UTDZ-S9] |
| Rusher (seit 2.0) | Start-Speed 0,5, 2x normale HP, +0,1 Speed pro Sekunde bis max. 2x Speed. Faktor 4 zwischen Start- und Endspeed; also ca. 15 s bis zum Maximum [D: (2,0-0,5)/0,1] | [O/HIGH UTDZ-S9] |
| Regenerierend | Bleed stoppt Regeneration, also existiert Regeneration | [O/MEDIUM UTDZ-S11] |
| Bosse | Je Act ein Boss (Parodien), z. B. Ninja Forest Act 1 Kakuza ... Act 6 NineTails | siehe Tabelle unten |
| Fliegend, Stealth, Spawn-on-death | `UNKNOWN` | |
| Gegnerangriffe auf Units | existieren (Units haben Dodge, Stuns auf Units durch Bulmo-Kapsel) | [O/MEDIUM UTDZ-S4, UTDZ-S7] |

## Stage-Struktur (Story)

10 Kapitel (Ninja Forest, Marine Base, Hollowed Moon, The Invasion, Shinobi World War, Beyond Fantasy, Sorcerer Games, Conquered Lands, Otherworld Disturbance, Beast Desert), je 6 Acts mit einem Boss pro Act, 3 Schwierigkeiten (Easy/Hard/Nightmare) plus Difficulty-Meter [O/HIGH UTDZ-S12]. Ältere Stände: 6 Kapitel [O/MEDIUM UTDZ-S18].

Bosse eines kompletten Kapitels als Beispiel (Namens-Ebene, keine Zahlen) [O/HIGH UTDZ-S12]:

| Kapitel | Act 1 | Act 2 | Act 3 | Act 4 | Act 5 | Act 6 |
|---|---|---|---|---|---|---|
| Ninja Forest | Kakuza | Hidan | Kisame | Itachi | Obito | NineTails |
| Marine Base | Kizaru | Aokiji | Akainu | Garp | Sengoku | Blackbeard |
| Hollowed Moon | Menos | Grimmjow | Nnoitra | Ulquiorra | Starrk | Aizen |
| The Invasion | Cell Jr | Android 19 | Android 20 | Android 18 | Android 17 | Cell (Imperfect) |
| Sorcerer Games | Hakari | Higuruma | Ryu | Yuta | Gojo | Sukuna |

Alle Acts haben Boss-Waves am Ende; wie viele Waves vor dem Boss kommen: `UNKNOWN`.

## Difficulty-Meter

Schieberegler von 75 % bis 1000 % (utdx-Wiki nennt 75 %; die Beginners Guide 50 % bis 1000 %) [O/MEDIUM UTDZ-S12, UTDZ-S18]. Laut Modul steigert der Regler den Drop-Multiplikator:

| Meter | Multiplikator-Spanne |
|---|---|
| 75-99 % | x1 |
| 100-299 % | x1-2 |
| 300-499 % | x1-3 |
| 500-699 % | x1-4 |
| 700-899 % | x1-5 |
| 900 %+ | x1-6 |

[O/HIGH UTDZ-S12]. Ob der Regler auch Gegner-HP/Speed skaliert: `UNKNOWN` (Guide: "changes drop chance or amount of drops" [O/LOW UTDZ-S18]). Ein höherer Wert liefert also mehr Beute, ob zusätzlich mehr Gegner-Stärke, ist offen.

## Raids, World Raids, Ultra Boss

- Raids: je 5 Floors plus "Rush" (Boss Rush mit Boss-Pool); Beispiel Top of Hueco Castle: Harribell, Grimmjow, Starrk, Ulquiorra, Ichiko, Rush-Pool aus den ersten vier [O/HIGH UTDZ-S15]. Weitere Raids: Shinobi Battlefield, Crimson Throne Chamber [O/HIGH UTDZ-S15, UTDZ-S11].
- World Raid (bis 12 Spieler): Ant Invasion (Ziele "Deal 20M/40M/60M/80M/100M Damage to the Ant King" je Daily-Mission, 500M einmalig), Beasts Place (drei Formen Base/Hybrid/Dragon plus Big Mom), Resurrection of the Bio-Android (stark elementbasiert) [O/HIGH UTDZ-S16]. Schadensziele von 20M-500M zeigen, dass Boss-Lebenspunkte bzw. kumulierter Schaden im Endgame im Millionen-Bereich liegen [D, LOW].
- Ultra Boss (Kitsunox Struggle u. a., Keys I-IV, Tiers T1-T4) [O/MEDIUM UTDZ-S9, UTDZ-S19].
- Universal Tears: Endgame-Stages, die alle 3 Stunden zu einem neuen Boss wechseln [O/MEDIUM UTDZ-S10].
- Spezielle Tag-Boni im Raid: +30 % Schaden für passende Tags [O/HIGH UTDZ-S15].

## Hinweise zur Nutzung für das eigene Spiel

Konkrete HP-/Speed-Kurven lassen sich aus UTDZ nicht übernehmen. Brauchbar sind die Gegnermechaniken (Schild als Hit-Zähler, Rusher mit Beschleunigung und verdoppelter HP, Armored mit Gegenwerten) und die Idee, Schwierigkeit als Regler mit steigendem Beute-Multiplikator zu bauen.
