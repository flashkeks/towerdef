# Türme und Helden Runde 16 — Riverkeeper, Bellringer, Tinker, Bram, Sela

Spezifikation: `runde16.md` §2/§3. Werte stammen aus `sim/data/towers.json` (Stand Merge Paket T, 10.10.2026) und
werden dort gepflegt; diese Datei ist die lesbare Fassung. Muster wie `tuerme-r13.md`: drei Pfade à fünf Stufen,
Crosspath wie BTD6 (nur ein Pfad über Stufe 2), Turm-XP und Freischalten im Match wie die anderen Türme.
Einheiten: Reichweiten in Milli-px (72000 = 72 px), `interval` in Milli-Ticks (60000 = 1 s bei 60 Ticks/s),
Abklingzeiten in Ticks, `*Bp` in Basispunkten (1000 = 10 %).

## Was neu ist in der Sim

- **`placement: 'water'`**: Riverkeeper nur *vollständig* in `water`-Polygonen der Karte (`circleInPolygon`),
  Landtürme dort nie. Fehlercode beim Platzieren wie bei Blockern. Der Bot sucht Wasserplätze in der
  Bounding-Box aller Wasserflächen (feineres Raster, 3 px).
- **Auren-Quellen ohne Angriff** (`AURA_ONLY`: Market, Bellringer) empfangen selbst keine Auren.
- **Tinker**: Sentries auf einem Kreis um den Tinker (`SENTRY_RING`), Fallen (Caltrops) auf dem Weg mit
  Mindestabstand (`TRAP_GAP`), Fähigkeit Overclock (n nächste Türme im Radius doppelt so schnell).
- **Helden generalisiert**: `HERO_TYPES = wren, bram, sela`, `GameOptions.hero`, `GameInfo.hero`. Ein Held je Match.
  Neue Fähigkeiten: `alarm` (Bellringer B5), `overclock` (Tinker C3+), `anvilDrop` (Bram L10), `forgeOfDawn` (Bram L20),
  `starfall` (Sela L10), `eclipse` (Sela L20).
- **Eclipse** (`cosmic`) durchbricht Kälte-Immunität, **nicht** die Slow-Immunität des Dreadnought aus 15b
  (Entscheidung beim Merge: der Dreadnought ist ausdrücklich immun gegen Freeze/Slow/Stun).

## Meta

- Freischaltung über Spieler-Level (`LEVEL_UNLOCKS`): Riverkeeper L4, Bram L10, Tinker L11, Bellringer L13, Sela L15.
- Helden: `HEROES` / `HERO_IDS` in `meta/src/data.ts`; Profil `heroes` (Besitz) und `selectedHero`. Kauf mit Embers
  (`buyHero`: Bram 1.500, Sela 2.500) **oder** Freischaltung über das Level. `heroLock` liefert die Bedingung als Text.
- Wissensbaum +6 Knoten im Ast Specialists (je Turm zwei: Deep Water / Barbed Line, Loud Bells / Silver Tongue,
  Spare Parts / Sharp Caltrops), im Ast Wardens Helden-Knoten (Veteran Hero, Hero Training, Legendary). Gesamt 46 Knoten.

## Balancing beim Abbruch (Patch 0004 der Hauptsitzung)

Nach einer ersten Matrix gepuffert: Tidal Steel +3 statt +2 Schaden; Tinker Grund-Intervall 1,0 s statt 1,3 s;
Overclock-Abklingzeit 45 s / 35 s / 30 s statt 50 / 40 / 35; Bram Hammer 4 Schaden, Pierce 3 (statt 2/2).

## Werte

### Riverkeeper (`riverkeeper`) — 400 Gold, Platz: water

Water tower. Harpoons, sonar and a lantern ship. Can only be built on water.  
Grundwerte: atk=projectile, pk=harpoon, dtype=sharp, dmg=2, pierce=3, interval=66000, range=72000, speed=520, count=1, spread=12

| Pfad | Stufe | Name | Preis | Wirkung |
|---|---:|---|---:|---|
| Harpoons | 1 | Barbed Harpoons | 250 | Harpoons pierce 2 more enemies. |
| Harpoons | 2 | Harpoon Volley | 500 | Fires 3 harpoons in a fan. |
| Harpoons | 3 | Tidal Steel | 2.200 | Steel tips hit Ironshell. +3 damage, +4 against Brutes and ships. |
| Harpoons | 4 | Whaler | 5.500 | +3 damage, +10 against Brutes and ships, +10 against bosses. |
| Harpoons | 5 | Tidal Lance | 22.000 | One huge lance: 40 damage, pierces 25. +40 against Brutes and ships, +200 against bosses. |
| Sonar | 1 | Sonar Ping | 200 | Detects camouflage. Range +10%. |
| Sonar | 2 | Sonar Array | 450 | Towers within 80 px detect camouflage. |
| Sonar | 3 | Riptide | 1.600 | Enemies in range move 30% slower (bosses 15%, ships 15%). |
| Sonar | 4 | Deep Current | 4.200 | Slow 45% (bosses 20%). Towers within 80 px get +15% range. |
| Sonar | 5 | Leviathan Call | 17.000 | Every 4 s the Leviathan strikes the strongest enemy in range for 150 damage. Slow 55%. |
| Armada | 1 | Deck Gun | 300 | Attacks 20% faster. |
| Armada | 2 | Lantern Ship | 700 | Cannonballs: 3 damage, pierce 4, burst on the last hit (18 px, 2 damage). |
| Armada | 3 | Broadside | 2.600 | Fires 4 cannonballs at once. Bursts 22 px. |
| Armada | 4 | Man o' War | 6.500 | +3 damage, attacks 20% faster. Bursts 26 px for 5 damage. +6 against Brutes and ships. |
| Armada | 5 | Dusk Armada | 25.000 | A whole fleet: 8 cannonballs per volley, bursts 30 px for 10 damage. +10 against Brutes and ships, +20 against bosses. |

### Bellringer (`bellringer`) — 1.000 Gold, Platz: land

Does not attack. Its bells buff every tower within 80 px: speed, sight, cheaper upgrades, or a toll of gold.  
Grundwerte: atk=none, range=80000, aRangeBp=800

| Pfad | Stufe | Name | Preis | Wirkung |
|---|---:|---|---:|---|
| Chimes | 1 | Swift Chime | 350 | Towers in range attack 10% faster. |
| Chimes | 2 | Resonant Bronze | 750 | Towers in range attack 18% faster. Radius +15%. |
| Chimes | 3 | Grand Peal | 2.600 | Attack speed +25%. Towers in range pierce 1 more enemy. |
| Chimes | 4 | Cathedral Bells | 6.500 | Attack speed +35%, +1 damage for towers in range. |
| Chimes | 5 | Grand Carillon | 26.000 | Attack speed +50%, +2 damage, pierce +2 for towers in range. Radius +40%. |
| Watch | 1 | Watch Bell | 300 | Towers in range detect camouflage. |
| Watch | 2 | Haggler's Bell | 600 | Upgrades for towers in range cost 8% less. Radius +10%. |
| Watch | 3 | Alarm | 2.000 | Ability: every enemy stops for 2 s (bosses 1 s). Cooldown 60 s. |
| Watch | 4 | Town Crier | 4.800 | Upgrades cost 15% less. Alarm lasts 3 s (bosses 1.5 s), cooldown 50 s. |
| Watch | 5 | Dusk Siren | 15.000 | Alarm lasts 4 s (bosses 2 s), cooldown 40 s; alarmed enemies take +1 damage for 4 s. Upgrades cost 20% less. Sharp hits crack Ironshell. |
| Toll | 1 | Toll of Coin | 400 | +30 gold at the end of every round. |
| Toll | 2 | Silver Bell | 700 | +80 gold per round. |
| Toll | 3 | Merchants' Peal | 2.200 | +220 gold per round. |
| Toll | 4 | Bell Foundry | 5.500 | +520 gold per round. Upgrades for towers in range cost 5% less. |
| Toll | 5 | Golden Belfry | 18.000 | +1,400 gold per round. Upgrades for towers in range cost 10% less. |

### Tinker (`tinker`) — 450 Gold, Platz: land

Builds things. Nail gun at the start; sentries, caltrops on the road and Overclock come with upgrades.  
Grundwerte: atk=projectile, pk=nail, dtype=sharp, dmg=1, pierce=2, interval=60000, range=64000, speed=650, count=1, spread=12

| Pfad | Stufe | Name | Preis | Wirkung |
|---|---:|---|---:|---|
| Sentry | 1 | Sentry Kit | 350 | Builds a sentry every 7 s (one at a time, 25 s each). It shoots nails. |
| Sentry | 2 | Twin Sentries | 600 | Two sentries at once, built every 6 s, shooting faster. |
| Sentry | 3 | Sentry Guns | 2.200 | Three sentries, 2 damage, pierce 3, magic nails (hit Ironshell). |
| Sentry | 4 | Clockwork Turrets | 5.200 | Four sentries, 3 damage, fast. +3 against Brutes and ships. |
| Sentry | 5 | Clockwork Fort | 20.000 | Five sentries, 3 damage, pierce 3, a shot every 0.25 s, 45 s each. +8 against Brutes and ships, +10 against bosses. |
| Caltrops | 1 | Caltrop Layer | 250 | Lays caltrops on the road in range every 8 s (3 at a time): each pops 6 layers. |
| Caltrops | 2 | Spiked Caltrops | 450 | Caltrops hold 10 hits and deal 2 damage. Laid every 7 s. |
| Caltrops | 3 | Spike Mat | 1.800 | Five mats at once, 14 hits each, 3 damage, laid every 6 s. |
| Caltrops | 4 | Heavy Spikes | 4.200 | Six mats, 20 hits each, 5 damage, laid every 5 s. |
| Caltrops | 5 | Iron Thorn Field | 18.000 | Ten mats at once, 30 hits each, 8 damage, laid every 2.5 s. |
| Overclock | 1 | Oiled Gears | 200 | Attacks 15% faster. |
| Overclock | 2 | Gear Sight | 400 | Detects camouflage. Range +15%. |
| Overclock | 3 | Overclock | 2.300 | Ability: the 4 nearest towers in range attack twice as fast for 10 s. Cooldown 45 s. |
| Overclock | 4 | Overclock Lab | 5.500 | Overclock reaches 8 towers, lasts 12 s, cooldown 35 s. |
| Overclock | 5 | Ultra-Overclock | 20.000 | Overclock reaches 20 towers, lasts 15 s, cooldown 30 s. Towers within 70 px always attack 10% faster. |

### Wren (`wren`) — 540 Gold

Hero. One per match. Gains XP after every round and levels up to 20.  
Grundwerte: atk=projectile, pk=lantern, dtype=magic, dmg=1, pierce=3, interval=48000, range=84000, speed=600, count=1, spread=12

| Level | Wirkung |
|---:|---|
| 1 | Lantern bolts: 1 damage, pierces 3, magic. |
| 2 | Range +10%. |
| 3 | Ability: Flare - a light orb on the strongest target: 5 damage in a wide area and reveals camouflage for good. |
| 4 | Pierce +2. |
| 5 | Spots camouflaged Glims. |
| 6 | Fires faster. |
| 7 | +1 damage. |
| 8 | Bolts set enemies ablaze: 1 damage per second for 3 s. |
| 9 | Range +10%. |
| 10 | Ability: Dawnbreak - a beam of light across the whole path: 12 damage to every enemy, 100 to the Leviathan. |
| 11 | Pierce +3. |
| 12 | Aura: towers within 84 px shoot 10% faster. |
| 13 | +1 damage. |
| 14 | Fires faster. |
| 15 | Flare: 15 damage, cooldown 30 s. |
| 16 | Burn deals 3 damage per second. |
| 17 | Aura also grants +10% range. |
| 18 | +2 damage. |
| 19 | Fires faster. |
| 20 | Dawnbreak: 36 damage (240 to the Leviathan), cooldown 45 s. |

### Bram (`bram`) — 650 Gold

Hero. A smith who throws hammers that crack armor. Builds a forge, drops an anvil, ends with the Forge of Dawn.  
Grundwerte: atk=projectile, pk=hammer, dtype=magic, dmg=4, pierce=3, interval=72000, range=70000, speed=520, count=1, spread=12, bonusBrute=2, bonusIron=2

| Level | Wirkung |
|---:|---|
| 1 | Hammer throws: 4 damage, pierces 3, magic. +2 against Brutes and Ironshell. |
| 2 | Range +10%. |
| 3 | The Forge: towers within 80 px deal +1 damage. |
| 4 | Damage +1. |
| 5 | Pierce +1. |
| 6 | Throws 15% faster. |
| 7 | +3 against Brutes, +2 against Ironshell. |
| 8 | Forge bellows: towers within the forge attack 10% faster. |
| 9 | Range +10%. |
| 10 | Ability: Anvil Drop - an anvil crushes the strongest target: 30 damage (150 to bosses) in 30 px, stuns 2 s. Cooldown 55 s. |
| 11 | Damage +1. |
| 12 | The Forge gives +2 damage. |
| 13 | Pierce +2. |
| 14 | Throws 15% faster. |
| 15 | Anvil Drop: 60 damage (400 to bosses), cooldown 45 s. |
| 16 | +5 against Brutes, +3 against Ironshell. |
| 17 | The Forge reaches 30% farther. |
| 18 | Damage +2. |
| 19 | Throws 15% faster. |
| 20 | Ability: Forge of Dawn - for 10 s every tower breaks armor (sharp hits crack Ironshell, +3 damage against armored foes). Cooldown 80 s. Anvil Drop: 100 damage (800 to bosses). |

### Sela (`sela`) — 750 Gold

Hero. A seer with a long-range starlight rifle. Sees camouflage, lends her sight to nearby towers, calls down Starfall and ends with Eclipse.  
Grundwerte: atk=projectile, pk=starlight, dtype=magic, dmg=4, pierce=2, interval=72000, range=110000, speed=1100, count=1, spread=12, camo=1

| Level | Wirkung |
|---:|---|
| 1 | Starlight shots: 4 damage, pierces 2, magic, long range. Sees camouflage. |
| 2 | Range +10%. |
| 3 | Damage +1. |
| 4 | Shoots 10% faster. |
| 5 | Nightglass sight: towers within 80 px detect camouflage. |
| 6 | Pierce +1. |
| 7 | Damage +2. |
| 8 | Shoots 10% faster. |
| 9 | Range +10%. |
| 10 | Ability: Starfall - a beam of starlight along the road in her range: 20 damage to every foe (120 to bosses). Cooldown 50 s. |
| 11 | Damage +2. |
| 12 | Towers within her sight get +10% range. |
| 13 | Pierce +1. |
| 14 | Shoots 15% faster. |
| 15 | Starfall: 40 damage (300 to bosses), cooldown 40 s. |
| 16 | Damage +3. |
| 17 | Her sight reaches 30% farther. |
| 18 | Shoots 15% faster. |
| 19 | Damage +3. |
| 20 | Ability: Eclipse - for 4 s every foe moves at half speed, ships and bosses too. Cooldown 70 s. Starfall: 70 damage (600 to bosses). |

## Bot-Matrix

`cd sim && MATRIX_SEEDS=1 npx tsx scripts/matrix-r16.ts` (Karten mit Wasser: hollow, marsh, harbor), Seed 1, je Zelle beste
von drei Kaufreihenfolgen. `Sieg+N` = Endrunde (40/60/80) geschafft, danach N Runden Freeplay; `Rn` = Tod in Runde n.

| Aufstellung | Karte | Easy (40) | Medium (60) | Hard (80) |
|---|---|---|---|---|
| Referenz 3 T4 + Wren | hollow | R40 | R40 | R36 |
| Referenz 3 T4 + Wren | marsh | R40 | R40 | R20 |
| Referenz 3 T4 + Wren | harbor | R40 | R40 | R18 |
| 3 T4 + Bram | hollow | Sieg+5 | R45 | R18 |
| 3 T4 + Bram | marsh | Sieg+5 | R45 | R17 |
| 3 T4 + Bram | harbor | R40 | R36 | R12 |
| 3 T4 + Sela | hollow | Sieg+5 | R45 | R36 |
| 3 T4 + Sela | marsh | Sieg+5 | R45 | R40 |
| 3 T4 + Sela | harbor | R40 | R40 | R18 |
| 2 T4 + Riverkeeper A4 | hollow | R40 | R36 | R15 |
| 2 T4 + Riverkeeper A4 | marsh | Sieg+18 | R40 | R20 |
| 2 T4 + Riverkeeper A4 | harbor | Sieg+5 | R45 | R18 |
| 2 T4 + Riverkeeper C4 | hollow | R39 | R24 | R15 |
| 2 T4 + Riverkeeper C4 | marsh | R40 | R40 | R20 |
| 2 T4 + Riverkeeper C4 | harbor | R40 | R40 | R20 |
| 2 T4 + Tinker A4 | hollow | Sieg+5 | R40 | R18 |
| 2 T4 + Tinker A4 | marsh | R40 | R40 | R20 |
| 2 T4 + Tinker A4 | harbor | R40 | R23 | R18 |
| 2 T4 + Tinker B4 | hollow | R40 | R40 | R18 |
| 2 T4 + Tinker B4 | marsh | R40 | R40 | R20 |
| 2 T4 + Tinker B4 | harbor | R40 | R23 | R18 |
| 3 T4 + Bellringer A4 | hollow | Sieg+6 | R45 | R15 |
| 3 T4 + Bellringer A4 | marsh | R40 | R40 | R18 |
| 3 T4 + Bellringer A4 | harbor | R40 | R40 | R15 |
| Referenz 6 T5 | hollow | Sieg+32 | Sieg+10 | R20 |
| Referenz 6 T5 | marsh | Sieg+30 | Sieg+4 | R20 |
| Referenz 6 T5 | harbor | Sieg+30 | R60 | R20 |
| 5 T5 + Riverkeeper A5 | hollow | Sieg+26 | Sieg+6 | R20 |
| 5 T5 + Riverkeeper A5 | marsh | Sieg+26 | R60 | R20 |
| 5 T5 + Riverkeeper A5 | harbor | Sieg+32 | Sieg+10 | R20 |
| 5 T5 + Tinker A5 | hollow | Sieg+36 | Sieg+9 | R20 |
| 5 T5 + Tinker A5 | marsh | Sieg+42 | Sieg+20 | R20 |
| 5 T5 + Tinker A5 | harbor | Sieg+36 | Sieg+16 | R20 |
| 6 T5 + Bellringer A5 | hollow | Sieg+42 | Sieg+16 | R20 |
| 6 T5 + Bellringer A5 | marsh | Sieg+40 | Sieg+20 | R20 |
| 6 T5 + Bellringer A5 | harbor | Sieg+42 | R60 | R20 |
| Referenz 3 T4 + Wren | hollow | R40 | R40 | R36 |
| Referenz 3 T4 + Wren | marsh | R40 | R40 | R20 |
| Referenz 3 T4 + Wren | harbor | R40 | R40 | R18 |
| 3 T4 + Bram | hollow | Sieg+5 | R45 | R18 |
| 3 T4 + Bram | marsh | Sieg+5 | R45 | R17 |
| 3 T4 + Bram | harbor | R40 | R36 | R12 |
| 3 T4 + Sela | hollow | Sieg+5 | R45 | R36 |
| 3 T4 + Sela | marsh | Sieg+5 | R45 | R40 |
| 3 T4 + Sela | harbor | R40 | R40 | R18 |
| 2 T4 + Riverkeeper A4 | hollow | R40 | R36 | R15 |
| 2 T4 + Riverkeeper A4 | marsh | Sieg+18 | R40 | R20 |
| 2 T4 + Riverkeeper A4 | harbor | Sieg+5 | R45 | R18 |
| 2 T4 + Riverkeeper C4 | hollow | R39 | R24 | R15 |
| 2 T4 + Riverkeeper C4 | marsh | R40 | R40 | R20 |
| 2 T4 + Riverkeeper C4 | harbor | R40 | R40 | R20 |
| 2 T4 + Tinker A4 | hollow | Sieg+5 | R40 | R18 |
| 2 T4 + Tinker A4 | marsh | R40 | R40 | R20 |
| 2 T4 + Tinker A4 | harbor | R40 | R23 | R18 |
| 2 T4 + Tinker B4 | hollow | R40 | R40 | R18 |
| 2 T4 + Tinker B4 | marsh | R40 | R40 | R20 |
| 2 T4 + Tinker B4 | harbor | R40 | R23 | R18 |
| 3 T4 + Bellringer A4 | hollow | Sieg+6 | R45 | R15 |
| 3 T4 + Bellringer A4 | marsh | R40 | R40 | R18 |
| 3 T4 + Bellringer A4 | harbor | R40 | R40 | R15 |
| Referenz 6 T5 | hollow | Sieg+32 | Sieg+10 | R20 |
| Referenz 6 T5 | marsh | Sieg+30 | Sieg+4 | R20 |
| Referenz 6 T5 | harbor | Sieg+30 | R60 | R20 |
| 5 T5 + Riverkeeper A5 | hollow | Sieg+26 | Sieg+6 | R20 |
| 5 T5 + Riverkeeper A5 | marsh | Sieg+26 | R60 | R20 |
| 5 T5 + Riverkeeper A5 | harbor | Sieg+32 | Sieg+10 | R20 |
| 5 T5 + Tinker A5 | hollow | Sieg+36 | Sieg+9 | R20 |
| 5 T5 + Tinker A5 | marsh | Sieg+42 | Sieg+20 | R20 |
| 5 T5 + Tinker A5 | harbor | Sieg+36 | Sieg+16 | R20 |
| 6 T5 + Bellringer A5 | hollow | Sieg+42 | Sieg+16 | R20 |
| 6 T5 + Bellringer A5 | marsh | Sieg+40 | Sieg+20 | R20 |
| 6 T5 + Bellringer A5 | harbor | Sieg+42 | R60 | R20 |

Lesart:
- Die neuen Türme liegen **auf Höhe der Referenz**, keiner dreht durch. Tinker A5 und Bellringer A5 bringen im späten
  Spiel am meisten (Easy Sieg+36..42 statt Sieg+30..32). Riverkeeper A4 ist auf Marsh (viel Wasser) stark, C4 (Armada) auf
  Hollow schwach (kleiner Teich, weit vom Weg) — Kandidat zum Nachschärfen, wenn Max ihn spielt.
- **Bram** hält Medium auf Hollow/Marsh bis R45 (Referenz mit Wren R40), auf Harbor schwächer. **Sela** etwa wie Wren, auf
  Marsh Hard deutlich besser (R40 statt R20).
- **Hard stirbt überall um R15–20**, auch die Referenz ohne neue Inhalte. Gegenprobe: dieselbe 6×T5-Aufstellung auf Meadow
  Hard liefert auf `dev` vor dem Merge exakt dieselben Werte (R20/R20/R60 je Kaufreihenfolge). Das ist eine Grenze des Bots
  (früh zu teure Kaufreihenfolge auf Hard), keine Regression durch Paket T.
