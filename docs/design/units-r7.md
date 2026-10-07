# Unit-Entwürfe Runde 7 (P6): sechs neue Units, Pool 8 → 14

Fortsetzung von [gdd.md](gdd.md) §6 im selben Stil (Figur, Rolle, Fähigkeit, Gefühl, „Wichtig gegen“). Alle Figuren sind eigene Entwürfe, Welt „Grenzgilde im Nebelriss“. Alle Zahlen: `sim/data/units.json` (Kommentar je Unit), Messung: [kalibrierung.md](../balancing/kalibrierung.md) „Runde 7 — P6“.

**Verteilung:** 1 Rare, 2 Epic, 2 Legendary, 1 Mythic. **Team:** 6 Typ-Plätze bleiben die Regel (`economy.caps.teamSlots`), jede Support-Unit kostet also einen Platz, den eine Kampf-Unit nicht bekommt. Das ist Absicht und der Grund, warum die Bots sie selten wählen.

**Wichtig vorab: Gegner greifen Units nicht an.** Schaden entsteht nur über Leaks (Leben). Ein klassischer Heiler hätte nichts zu heilen. „Heiler / Schild-Support“ (rec §2) ist deshalb auf das umgedeutet, was verletzt werden kann: das **Leben des Teams** (Leak-Schild, `warden`).

| id | Figur | Seltenheit | Platz | Rolle | Kern |
|---|---|---|---|---|---|
| `warden` | Hedda Lorn | Rare | Boden | Leak-Schild | fängt je Wave 1–3 nicht-tödliche Leaks ganz ab |
| `mortar` | Brunna Stoll | Epic | Boden | zweite Boden-Fläche | Kreis r 1,7, halber Burn, Luft 50 % |
| `broker` | Quill Tavish | Epic | Hybrid | Ökonomie | Kill-Bounty im Radius +20…60 % |
| `stormcaller` | Rann Veyl | Legendary | Hügel | Kette, Luft | Kettenblitz, 4 Sprünge à 80 % |
| `seer` | Ilsa Nenn | Legendary | Hybrid | Markierung, Boss-Fenster | +25 % Schaden aufs Ziel, Boss-Fenster +10…40 % länger |
| `weaver` | Nessa Thorne | Mythic | Hybrid | Tempo-Aura | Gegner im Radius 20…48 % langsamer |

### `warden` – Hedda Lorn (Rare, Boden, Leak-Schild)
- **Figur:** Torwächterin der Gilde mit Federbusch-Helm, Hellebarde und einem übergroßen runden Schild, der über die Figur hinausragt (Leitmerkmal: Schild-Silhouette).
- **Rolle:** Sicherheitsnetz. Je Wave fängt das Team so viele **nicht-tödliche** Leaks vollständig ab (Stufe 0–4: 1, 1, 2, 2, 3 Ladungen). Je Typ zählt nur der höchste Wert, mehrere Wardens stapeln nicht. Standort egal: sie steht abseits wie die Farm.
- **Warum so:** Leaks kosten 2–8 Leben, ein abgefangener Elite-Leak (8) ist ein großer Gewinn. **Boss-Leaks (Sofortverlust) fängt sie nie ab**, das bleibt die Regel von ENTSCHEIDUNGEN.md. Darum ist sie kein Pflicht-Kauf, sondern Versicherung für Hard/Nightmare und Flieger-Wellen.
- **Gefühl:** „Gerade noch gehalten“: eine Leak-Marke „Caught!“ am Tor statt rotem Blinken.
- **Wichtig gegen:** Flieger-Pulks (Wave 16/18), Splitter-Schwärme, jeden Fehler beim Aufbau.
- **Alternativen, die verworfen wurden:** Heilung am Wave-Ende (`regenPerWave`-Stil) ist stärker nach dem Fehler, schützt aber nie vor dem Einzelschlag und stapelt zu leicht zur Unverwundbarkeit; Schild-Leben-Pool (Leben statt Leaks) skaliert mit Leak-Kosten und lässt Grunts und Brutes gleich aussehen.

### `mortar` – Brunna Stoll (Epic, Boden, Flächen-Kreis)
- **Figur:** stämmige Artilleristin mit Stahlhelm, Schürze und einem dicken Mörserrohr schräg über der Schulter, Glut an der Mündung.
- **Rolle:** zweite Boden-Flächen-Unit. Löst die Blaster-Pflicht (Runde 6: Verbot −50 bis −97 Punkte). Profil gegen den Blaster: **größerer Radius (1,7 statt 1,2 Tiles), halber Burn (45 % statt 90 %), kein Slow, Luft nur zu 50 % (Blaster 75 %)**, gleicher Anteil 65 %.
- **Gefühl:** der breite, dumpfe Einschlag; man baut sie dort, wo sich der Pulk staut.
- **Wichtig gegen:** große Grunt-Schwärme, Splitter, Runner-Ketten; schwach gegen Flieger.
- **Zahlen-Geschichte:** reiner Splash ohne Burn ließ den Blaster Pflicht (−60 bis −70), voller Burn machte den Mortar selbst zur Pflicht (Blaster-Verbot 0, Mortar-Verbot −53). Der halbe Burn liegt dazwischen (Blaster-Verbot −7…−30).

### `broker` – Quill Tavish (Epic, Hybrid, Kopfgeld)
- **Figur:** Kopfgeld-Maklerin mit hohem Zylinder, Monokel, goldener Weste und einer großen Münze in der Hand.
- **Rolle:** zweite Ökonomie-Unit, anderes Profil als `farm`: kein fester Ertrag am Wave-Ende, sondern **+20 % bis +60 % Bounty** (6 Stufen) auf Gegner, die im Radius (4 Tiles) sterben. Je Typ zählt nur der höchste Wert, **der Standort entscheidet** (dorthin, wo die Gegner sterben), und sie skaliert mit der Wave, weil der Bounty wächst (Kill-Einkommen ist die größte Quelle: ca. 10 400 Münzen je Partie, Farm ca. 2 000).
- **Gefühl:** man sieht die Zahlen „+12“ statt „+10“ an der Todesstelle; Wette auf die Mitte des Pfads.
- **Wichtig gegen:** Geldmangel in W10/W20, späte Waves mit hohem Bounty.

### `stormcaller` – Rann Veyl (Legendary, Hügel, Kettenblitz)
- **Figur:** Blitzrufer in blauer Robe mit spitzer Kapuze, Kristall-Stab und einem Zickzack-Blitz über dem Kopf.
- **Rolle:** zweite Flächen-Antwort gegen Flieger (Hügel, trifft Luft voll). Erster Treffer 60 % des Rarity-DPS, dann bis zu **4 Sprünge** (Sprungweite 1,8 Tiles) zum jeweils nächsten ungetroffenen Gegner, je **80 %** des vorigen Treffers. Jeder Sprung ist eine eigene Schadensinstanz (strippt Schild-Stacks).
- **Gefühl:** der Funke hüpft durch den Pulk; belohnt eng laufende Gruppen.
- **Wichtig gegen:** Flieger-Pulks (W16/W18), Schild-Stacks, Schwärme.

### `seer` – Ilsa Nenn (Legendary, Hybrid, Markierung + Boss-Fenster, Kniff zu K5)
- **Figur:** Nebelseherin mit langem hellem Haar, Nebelsaum statt Füßen und einem schwebenden Auge über dem Kopf.
- **Rolle:** wenig eigener Schaden (30 %), aber jeder Treffer **markiert** das Ziel: +25 % Schaden von allen Quellen (Direktschaden, Cap `buffCaps.vulnerableBp`), 6 s; die stärkste Markierung gewinnt. Dazu **verlängert sie jedes Schwachstellen-Fenster eines Bosses** um 10 % (Stufe 0) bis 40 % (Stufe 6). Je Typ der höchste Wert.
- **K5-Bezug:** Fenster sind das Herz der Boss-Rätsel (Schild brechen, Telegraph unterbrechen). Die Seherin gibt dem Team mehr Zeit im Fenster, ohne selbst Schaden zu machen. Markierung wirkt auch auf den Boss (volle Dauer, kein CC).
- **Wichtig gegen:** Boss (W10, W20), Elite.

### `weaver` – Nessa Thorne (Mythic, Hybrid, Tempo-Aura)
- **Figur:** Nebelweberin in dunklem Kleid mit türkisem Haar vor einem großen leuchtenden Webrad (Leitmerkmal: Ring-Silhouette).
- **Rolle:** kein Angriff. Gegner im Radius (3,5 Tiles) laufen **20 % bis 48 % langsamer** (8 Stufen). Regeln wie Slow: der stärkste Wert gewinnt (kein Stapeln mit Frost), Cap −60 %, Boss nur halbe Wirkung. Mehr Zeit im Feuer für alle Units im Radius.
- **Gefühl:** der Pfad „zieht sich“ im Netz; ein Platz mitten im Pulk-Knoten.
- **Wichtig gegen:** alles, was leakt: Runner, Flieger, späte Waves.

## Schnittstellen im Simulator (alle datengetrieben, keine Unit-IDs im Code)

| Feld in `units.json` | Wirkung | Datei |
|---|---|---|
| `attack.kind: "chain"` (`jumps`, `jumpRadiusMilli`, `falloffBp`) | Kettenangriff | `systems/attack.ts` |
| `onHit: { kind: "mark", vulnBp, ticks }` | Markierung (`EnemyState.markBp/markTicks`) | `attack.ts`, `effects.ts` |
| `windowExtend.bpByLevel` | Boss-Fenster länger | `systems/boss.ts` (`openWindow`) |
| `bountyAura` | Kill-Bounty-Aufschlag am Todesort | `systems/economy.ts` |
| `guard.chargesByLevel` | Leak-Schild (`SimState.guardUsed`, Event `leak.guarded`) | `systems/move.ts`, `economy.ts` |
| `slowAura` | Tempo-Aura | `systems/move.ts` |

**Meta (P2):** `unitMods.lvlBp` multipliziert nur Schaden (Mortar, Stormcaller, Seer-Eigenschaden). Die Support-Werte (Ladungen, Bounty-Prozent, Slow, Fenster) hängen nur an den Stufen im Match; nichts Unit-Spezifisches in den Mods. `yieldBp` wirkt weiter nur auf `farm`.
