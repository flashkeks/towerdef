# Boss-Telegraphen für den Client (Runde 5, P3 → P5)

Übergabe an P5 (Spielgefühl, Ton). Quelle der Wahrheit sind `sim/data/bosses.json` und `sim/src/systems/boss.ts`; diese Datei sagt, **was der Spieler sehen und hören soll** und **welches Sim-Ereignis** das auslöst. Der Client liest nur Ereignisse (`sim.drainEvents()`) und den lesbaren Zustand (`enemy.bossRun`), er verändert nichts. Zeiten der Sim: 20 Ticks pro Sekunde.

## Leitidee: drei Antworten auf jede Wirkung, keine Pflicht-Unit

Jede unterbrechbare Boss-Wirkung (Heilung, Ruf, Sturm) hat seit P3 **drei gleichwertige Antworten**. Der Spieler soll das am Telegraph **ablesen** können, ohne Text:

| Antwort | Womit | Was der Boss tut |
|---|---|---|
| **Kontrolle** | Frost-Stun (Fähigkeit `stunAoe`) während der Vorwarnzeit | Wirkung bricht, `bossCast.cause = "stun"` |
| **Burst** | ein einzelner Treffer ab der Schwelle, z. B. Titan-Nuke | Wirkung bricht sofort, `cause = "damage"` |
| **Dauerschaden** | Gunner, Striker, Blaster, Lancer … zusammen mindestens `staggerBp` der Max-HP in der Vorwarnzeit | Wirkung bricht, `cause = "damage"`; bis dahin schrumpft die Heilung linear mit dem angerichteten Schaden |

Wird unterbrochen, passiert **immer dasselbe**: Wirkung entfällt, der Boss steht kurz still (`interruptStunTicks`), und es öffnet sich ein **Schwachstellen-Fenster** (`bossWindow`, `cause = "interrupt"`) mit hohem Schadensfaktor und **Rüstung 0** („Panzer offen“). Wer das Fenster nutzt, gewinnt den Kampf; das Fenster ist die Belohnung, nicht die Unterbrechung selbst.

## Ereignisse und Zustand (Format)

Alles **additiv**: kein bestehendes Feld wurde umbenannt oder entfernt. Neu ist mit `NEU` markiert.

| Ereignis | Felder | Zeitpunkt |
|---|---|---|
| `bossPhase` | `enemyId, kit, phase, id, name` | Phasenwechsel (HP-Schwelle unterschritten) |
| `bossTelegraph` | `enemyId, kit, ability, kind, warnTicks, fireTick, interruptible`, **NEU `staggerNeed`** (Centi-HP, 0 = nicht durch Schaden zerstörbar) | Beginn der Vorwarnzeit |
| `bossCast` | `enemyId, kit, ability, kind, interrupted`, **NEU `cause`** (`"stun"`, `"damage"` oder `null`) | Wirkung oder Abbruch. Bei Abbruch durch Schaden **früher** als `fireTick` (Tick nach dem brechenden Treffer), bei Stun zu `fireTick` |
| `bossWindow` | `enemyId, open, damageBp, ticks, cause` (`ward`/`cast`/`interrupt`/`exhaust`/`phase`), **NEU `armor`** (Rüstung im Fenster, `-1` = unverändert) | Fenster auf (`open: true`) und zu (`open: false`) |
| `bossWard` | `enemyId, state` (`up`/`broken`/`expired`), `hp` | Schild steht / gebrochen / abgelaufen |
| **NEU `bossArmor`** | `enemyId, armor, base` | Eine Phase setzt die Rüstung des Bosses (Rüstungsphase; `base` = normale Rüstung). Heute in den Daten **nicht verwendet**, der Baustein ist aber fertig (Hard-Variante möglich) |
| `spawn` | `…, summon: true` bei Beschwörungen des Bosses | Helfer erscheinen |

**Lesbarer Zustand** (nur lesen, jeden Frame zulässig) am Boss `enemy.bossRun`:

| Feld | Bedeutung | Nutzen für den Client |
|---|---|---|
| `tele` | `null` oder `{ ability, left, interrupted, dmg, need, cause }` | **Schadensleiste des Telegraphs**: Füllstand `dmg / need` (Centi-HP), `left` = verbleibende Ticks. `need = 0`: keine Leiste |
| `vulnTicks`, `vulnBp`, `vulnArmor` | offenes Fenster: Restdauer, Faktor, Rüstung (`-1` = unverändert) | Fenster-Leiste, Panzer-Optik |
| `ward`, `wardTicks` | Rest-Schild (Centi-HP), Ticks bis Ablauf | Schildleiste, Ablauf-Timer |
| `armor` | Rüstung der Phase (`-1` = Basis) | Panzer-Optik der Rüstungsphase |
| `hasteTicks` | Sturm läuft | Staubspur, Tempo |
| `phase` | Phasenindex | |

`bossTracker` im Client (`client/src/view/telegraph.ts`) liest `bossTelegraph`, `bossCast`, `bossWindow`, `bossWard`, `bossPhase` heute schon; diese Ereignisse behalten Typ und Felder. P5 muss für die neuen Dinge nur **ergänzen** (`staggerNeed`, `cause`, `armor`, `bossArmor`, `bossRun.tele.dmg/need`).

## Hollow Warden (Wave 10, Lehr-Boss)

Der Warden bringt dem Spieler die drei Regeln bei, bevor der Colossus sie verlangt: **Helfer räumen, Schild brechen, Wirkung unterbrechen**. Er hat auf keiner Stufe einen Boss-Leak verursacht, darf also freundlich wirken.

| Phase (HP) | Fähigkeit / Aktion | Sim-Ereignis | Vorwarnzeit | Was der Spieler sehen / hören soll | Fenster, wer glänzt |
|---|---|---|---|---|---|
| **Awake** (100 %) | **Call of the Hollow**: 3 Grunts hinter dem Boss, alle 20 s, erster Ruf nach 8 s | `bossTelegraph(ability: "call", kind: "summon", warnTicks: 40, interruptible: true, staggerNeed ≈ 8 % Max-HP)` → `bossCast` → 3 × `spawn(summon: true)` | 40 Ticks (2 s) | Boss hebt die Hände, Risse am Boden **hinter** ihm leuchten auf (dort erscheinen die Grunts), kurzer tiefer Hornton beim Telegraph. Kleine Schadensleiste über dem Boss (Füllung durch Treffer). Beim Erscheinen Staubwolke je Grunt | Wird der Ruf unterbrochen: **Fenster 4 s × 1,5** (`cause: "interrupt"`) und Boss steht 1,5 s still. **AoE (Blaster)** räumt die Grunts; Frost-Stun oder Dauerschaden verhindert sie ganz |
| **Stoneward** (65 %) | **Schild** 12 % der Max-HP, läuft nach 15 s ab | `bossPhase(phase: 1, id: "ward")`, `bossWard(state: "up", hp)` → `bossWard(state: "broken")` oder `"expired"` | keine, Phasenwechsel ist selbst die Ansage | Steinhülle um den Boss, Schildleiste; „Phase“-Gong, Stein-Knirschen. Zerbricht der Schild: Splitter, heller Klang, Hülle weg. Läuft er ab: Hülle bröselt leise weg (kein Belohnungston) | Bruch öffnet **Fenster 5 s × 1,8, Rüstung 0** (`bossWindow(cause: "ward", armor: 0)`). **Burst** (Titan-Nuke) bricht ihn sofort, **Dauerschaden** (Gunner, Lancer, Striker) in wenigen Sekunden; im Fenster glänzen **Gunner, Striker, Blaster** (kein Durchschlag nötig) |
| **Fury** (30 %) | nur **Hard/Nightmare**: **Hollow Surge**, Sturm (Tempo ×2 für 3 s), alle 15 s | `bossTelegraph(ability: "surge", kind: "charge", warnTicks: 40, interruptible: true, staggerNeed ≈ 6 %)` → `bossCast` → `bossWindow(cause: "exhaust")` | 40 Ticks | Boss geht in die Hocke, rote Aura, Anlauf-Ton; während des Sturms Staubspur und Tempo-Streifen | Unterbrochen: **Fenster 4 s × 1,4**. Ungestört: nach dem Sturm **Erschöpfungs-Fenster 3 s × 1,5** (Boss keucht). **Frost** (Stun) oder Dauerschaden unterbricht; Blaster/Gunner im Erschöpfungs-Fenster |

## Rift Colossus (Wave 20, Final-Boss)

Der Colossus zitiert alles, was die Stage gelehrt hat, und fügt die **zerstörbare Heilung** hinzu: Er heilt im Takt, und der Spieler entscheidet, wie er den Takt bricht.

| Phase (HP) | Fähigkeit / Aktion | Sim-Ereignis | Vorwarnzeit | Was der Spieler sehen / hören soll | Fenster, wer glänzt |
|---|---|---|---|---|---|
| **Awake** (100–75 %), danach durchgehend | **Mend the Rift**: heilt 6 % der Max-HP, alle 15 s, erster Einsatz nach 10 s (**auch bei voller HP**: das Fenster nach einer Unterbrechung gibt es trotzdem) | `bossTelegraph(ability: "mend", kind: "mend", warnTicks: 80, interruptible: true, staggerNeed ≈ 7 % Max-HP)` → `bossCast(interrupted, cause)` | **80 Ticks (4 s)**, die längste Warnung des Spiels | Boss legt die Hände auf den Riss in der Brust, **grüner Sog** zieht Funken zu ihm, Summen steigt in der Tonhöhe. **Schadensleiste** (Ring um den Boss, `bossRun.tele.dmg / need`) füllt sich mit jedem Treffer, die **Heil-Menge schrumpft sichtbar** mit der Füllung. Bricht die Leiste voll: Glas-Klirren, Funken zerstieben, Boss taumelt (2 s Stillstand, `interruptStunTicks: 40`) | **Fenster 8 s × 2,0, Rüstung 0** (`bossWindow(cause: "interrupt", ticks: 160, damageBp: 20000, armor: 0)`): Boss „offen“, Panzerplatten klappen weg, Treffer machen goldene Zahlen. **Frost** (Stun) bricht ohne Schaden, **Titan** (Nuke ab Schwelle) sofort, **Dauerschaden** (Gunner, Striker, Blaster, Lancer, Banner-Aura) mit etwa 140 Schaden/s auf den Boss während der 4 s (Normal; 7 % der Boss-Max-HP ≈ 560 HP). Im Fenster **nuken** (× 2) und **Frost-Stun in voller Dauer** (keine Sperre). Gunner/Striker/Blaster glänzen (Rüstung 0), Lancer verliert den Durchschlag-Vorteil, behält × 2 |
| **Awake / Riftward** | **Rift Call**: 4 Grunts hinter dem Boss, alle 20 s (nur Phase 0 und 1) | `bossTelegraph(ability: "call", kind: "summon", warnTicks: 40, interruptible: false)` → 4 × `spawn(summon: true)` | 40 Ticks | wie beim Warden, aber vier Risse. **Nicht unterbrechbar** (keine Leiste): hier verlangt der Boss **AoE** (Blaster, Lancer-Linie, Frost-Kegel) | keines. Wer die Grunts liegen lässt, hat die Einheiten gebunden |
| **Riftward** (75 %) | **Schild** 12 % der Max-HP, läuft nach 15 s ab | `bossPhase(phase: 1)`, `bossWard(up, hp)` → `broken`/`expired` | keine | Riss-Schild (lila), Schildleiste. Zerbricht er: Splitter, Fenster | Bruch öffnet **Fenster 7 s × 2,0, Rüstung 0** (`cause: "ward"`). Titan-Nuke bricht ihn sofort, sonst Dauerschaden; die Nuke **danach** ins Fenster ist doppelt so stark |
| **Mending** (50 %) | keine neue Fähigkeit, die Heilung läuft weiter und wird wichtiger (HP schon unten) | `bossPhase(phase: 2, id: "mending")` | – | Phasen-Gong, Brust-Riss glimmt stärker (die Heilung tut jetzt weh) | wie oben |
| **Last Stand** (25 %) | **2 Brutes** erscheinen sofort; ab **Hard** zweiter Schild 8 %; **Rift Surge** (Sturm, Tempo ×2 für 3 s, alle 15 s, erster nach 4 s) | `bossPhase(phase: 3)`, 2 × `spawn(summon: true)`, ab Hard `bossWard(up)`, Sturm: `bossTelegraph(ability: "surge", kind: "charge", warnTicks: 40, interruptible: true, staggerNeed ≈ 6 %)` → `bossCast` → bei Erfolg `bossWindow(cause: "exhaust")` nach dem Sturm | 40 Ticks | Boss brüllt (Bildschirm-Wackeln leicht), Risse brechen auf, Brutes steigen heraus; vor dem Sturm rote Aura und Anlauf-Ton, Staubspur im Lauf, hörbares Keuchen am Ende | Sturm unterbrochen: **Fenster 4 s × 1,4**, Boss steht 2 s. Ungestört: **Erschöpfungs-Fenster 3 s × 1,5** (nach dem Sturm). Zweiter Schild (Hard): Bruch → **Fenster 5 s × 2,0, Rüstung 0**. **Alles auf den Boss**: dies ist die letzte Gelegenheit, Burst und Frost zu zünden |

### Wie das Fenster aussehen soll (alle Fenster)

- **Auf:** `bossWindow(open: true)`: Boss-Sprite wechselt in „offen“ (hell, Panzerplatten klappen, bei `armor: 0` deutlich), goldener Rand, Anstiegston. Leiste mit Restzeit (`ticks`) und Faktor (`damageBp / 10000` als „× 2,0“).
- **Läuft:** Schadenszahlen in Gold statt Weiß, größer; Titan-/Frost-Fähigkeiten pulsen als „jetzt“ (UI-Hinweis an der Einheit, wenn Fähigkeit bereit und Fenster offen).
- **Zu:** `bossWindow(open: false)`: kurzer Schließ-Ton, Platten klappen zu. Laufen die letzten 2 s ab, blinkt die Leiste.
- Fenster **mit** `armor: 0` und Fenster **ohne** (`armor: -1`: Sturm-Fenster) sollen unterscheidbar sein: ersteres „Panzer offen“, letzteres „Boss keucht“.

### Schlüsselzeiten zum Abstimmen von Ton und Animation

| Ereignis | Ticks | Sekunden |
|---|---|---|
| Ruf/Sturm Vorwarnung | 40 | 2 |
| Heilung Vorwarnung | 80 | 4 |
| Schild läuft ab | 300 (zweiter Schild: 240) | 15 (12) |
| Fenster Schild/Heilung (Colossus) | 140 / 160 | 7 / 8 |
| Fenster Schild/Ruf-Abbruch (Warden) | 100 / 80 | 5 / 4 |
| Boss steht nach Unterbrechung | 30–40 | 1,5–2 |

## Welche Unit glänzt wann (Kurzfassung für Tooltips)

| Situation | Glänzt | Warum |
|---|---|---|
| Ruf (Grunts) | Blaster, Lancer, Frost | Fläche; Frost hält sie zusätzlich auf |
| Telegraph der Heilung/Ruf/Sturm | Frost (Stun), Titan (Nuke), alle DPS-Units zusammen | drei Antworten, siehe Leitidee |
| Schild | Titan (bricht sofort), Gunner/Lancer/Striker (Dauerschaden) | Schild absorbiert alles, auch True Damage |
| Fenster (Rüstung 0) | Gunner, Striker, Blaster, Frost-Kegel; Titan-Nuke × 2; Banner-Aura | Rüstung 0 hebt ihre Treffer um bis zu 40 %, Lancer (Durchschlag 40) gewinnt dadurch nichts |
| Sturm | Frost-Stun (volle Dauer im Fenster), Dauerschaden | Telegraph 2 s: Stun oder Schwelle brechen ihn |

## Hinweise für die Umsetzung

- **Nichts ratbar machen:** jede Schwelle (`staggerNeed`) ist in der Leiste sichtbar, jedes Fenster hat Leiste und Faktor. Kein versteckter Wert.
- Die Reihenfolge je Boss-Tick in der Sim ist Phasenwechsel → Fenster/Schild-Timer → Telegraph herunterzählen → neue Fähigkeit beginnen; mehrere Ereignisse im selben Tick sind normal (z. B. `bossCast` und `bossWindow`). Der Client sortiert nach Eingang.
- `bossCast` mit `interrupted: true` und `cause: "damage"` kommt **ein Tick nach dem brechenden Treffer**, nicht erst zum `fireTick`: den Telegraph beim Eintreffen sofort beenden (der Client löscht ihn ohnehin bei jedem `bossCast`).
- Der Telegraph-Ring darf **kein** Spielzustand sein: Fortschritt aus `warnTicks`/`fireTick`, Schadensfüllung aus `bossRun.tele`, beides read-only.
- Bei 3-facher Geschwindigkeit laufen Vorwarnzeiten gleich schnell (Sim-Ticks); Töne und Animationen auf **Sim-Zeit** ausrichten, nicht auf Echtzeit.

## Nachtrag Runde 5 P3b: Blaster trifft Luft

Keine neuen Ereignisse. Der Blaster (Boden-Unit) trifft jetzt auch Flieger, mit 75 % seines Schadens (`UnitDef.airDamageBp = 7500`, `canHitAir = true`). Für den Client folgt daraus nur: Blaster-Treffer und -Flächen-Effekte können auf Flieger-Gegnern auftauchen (Burn, Slow). Der Katalog zeigt `canHitAir` und `airDamageBp` (additiv, Feld fehlt bei allen anderen Units). Blaster bekommt außerdem 10 % Slow (60 Ticks), Frost nur noch 12 % statt 20 %: Tooltips und Effekt-Farben entsprechend lesen (Slow-Anzeige an Gegnern unverändert, nur die Quelle ist jetzt doppelt). Der Beispiel-Replay passt nicht mehr zu den Daten und muss neu aufgenommen werden.
