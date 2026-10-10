# Schnittstelle Sim ↔ Client (Runde 11) — der Vertrag zwischen P1, P2, P3, P4

Damit P1 (Sim), P2 (Pixel), P3 (Karte + Match-UI) und P4 (Meta) parallel arbeiten können. **Namen und Formen hier sind
verbindlich.** Wer etwas ändern muss, ändert es hier mit Begründung im Commit und sagt es in STATUS.

## Dateien und Besitz

| Bereich | Besitzer | Inhalt |
|---|---|---|
| `sim/src/**`, `sim/test/**`, `sim/data/towers.json`, `enemies.json`, `rounds.json`, `difficulties.json` | **P1** | Kern, Regeln, Daten |
| `sim/data/maps/meadow.json` | **P3** (P1 liest nur; Startfassung liefert P1 aus der Wegliste unten) | Weg, Wasser, Blocker, Grenzen |
| `client/src/pixel/palette.ts`, `raster.ts` | P0 (Hauptsitzung), Erweiterungen durch P2 erlaubt | Palette, Raster-Werkzeug |
| `client/src/pixel/sprites/**`, `client/src/pixel/fx/**`, `client/src/pixel/font.ts` | **P2** | Türme, Held, Gegner, Projektile, Effekte, Pixel-Ziffern |
| `client/src/pixel/map/**` | **P3** | die Karte |
| `client/src/match/**`, `client/src/main.ts`, `client/src/app/**`, `client/src/audio/**` | **P3** | Match-Bildschirm, Renderer, Eingabe, HUD, Panel, Ton |
| `meta/**`, `client/src/meta/**`, `client/src/screens/**` | **P4** | Fortschritt, Speicherstand, Menü-/Ergebnis-Bildschirme |
| `client/scripts/shots-r11-*.mjs`, `client/docs/r11/` | je Paket eigene Skripte/Bilder (`shots-r11-p2.mjs` …) | Screenshots, GIFs |

## Einheiten

Positionen in **Milli-px** (1 px = 1000) auf der 640 × 360-Karte, Zeit in **Ticks (60 je s)**, Schaden/HP ganze Zahlen
(1 = eine Glim-Schicht), Faktoren in **Basispunkten** (10000 = 1,0), Geld ganze Münzen. Zustand nur Ganzzahlen (Hash).

## Sim-API (P1 baut, `sim/src/index.ts` exportiert)

```ts
export type TowerType = 'ranger' | 'bombardier' | 'frostcaller';
export type HeroType = 'wren';
export type EnemyType = 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export type Tiers = [number, number, number];           // Stufe je Pfad A/B/C, 0..5

export interface GameOptions {
  map: string;                                          // 'meadow'
  difficulty: Difficulty;
  seed: number;
  /** Was das Profil freigeschaltet hat (P4). Fehlt = alles frei (Tests, Sandbox). */
  unlocks?: { towers: (TowerType | HeroType)[]; maxTier: Record<TowerType, Tiers> };
  /** Turm-XP-Konto aus dem Profil (Runde 11b). Fehlt = kein XP-System (keine Verteilung, `unlockTier` -> 'no-xp'). */
  towerXp?: Record<TowerType, number>;
  /** Wissensbaum (P4), alles optional, Standard 0. */
  mods?: { startCash?: number; lives?: number; sellBp?: number; earlyBonus?: number; t1DiscountBp?: number;
           rangeBp?: Partial<Record<TowerType, number>>; radiusBp?: number; slowDurBp?: number; heroStartLevel?: number;
           towerXpBp?: number /* Fast Learner: 2000 = +20 % auf den Turm-XP-Topf */ };
}

export function createGame(opts: GameOptions): Game;

export interface Game {
  readonly state: GameState;                            // nur lesen
  apply(cmd: Command): CommandResult;                   // sofort, deterministisch
  step(ticks?: number): void;                           // Standard 1
  /** Events seit dem letzten Aufruf (und leert die Liste). Client ruft das je Bild auf. */
  drainEvents(): SimEvent[];
  hash(): string;
  // Lese-Helfer für UI und Bots:
  canPlace(type: TowerType | HeroType, x: number, y: number): PlaceCheck;  // { ok: true } | { ok: false, reason }
  upgradeInfo(towerId: number): UpgradeInfo[];          // je Pfad: nächste Stufe, Preis, gesperrt-Grund, + unlocked / unlockCost / revealed (11b)
  unlockInfo(type: TowerType): UnlockPathInfo[];        // Freischalt-Menü (11b): 3 Pfade x 5 Stufen, revealed/unlocked/cost; name/desc leer wenn verdeckt
  sellValue(towerId: number): number;
  priceOf(type: TowerType | HeroType): number;          // mit Schwierigkeit
}

export type Command =
  | { type: 'place'; tower: TowerType | HeroType; x: number; y: number }
  | { type: 'upgrade'; towerId: number; path: 0 | 1 | 2 }
  | { type: 'unlockTier'; tower: TowerType; path: 0 | 1 | 2 }   // 11b: nächste Stufe des Pfads für Turm-XP freischalten (Crosspath egal)
  | { type: 'sell'; towerId: number }
  | { type: 'target'; towerId: number; mode: TargetMode }
  | { type: 'ability'; ability: AbilityId }            // 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak'
  | { type: 'startRound' }
  | { type: 'autoStart'; on: boolean };

export type CommandResult = { ok: true; id?: number } | { ok: false; reason: string };  // reason = Schlüssel, z. B. 'no-cash', 'on-path', 'crosspath', 'locked'; `unlockTier`: 'no-xp' | 'maxed' | 'locked'

export interface GameState {
  tick: number;
  phase: 'build' | 'wave' | 'won' | 'lost' | 'freeplay';
  round: number;                 // zuletzt gestartete Runde (0 vor dem Start)
  roundsCleared: number;
  cash: number; lives: number;
  towers: TowerState[];          // aufsteigende id, inkl. Held
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  abilities: { id: AbilityId; ready: boolean; cdLeft: number; cdTotal: number }[];
  stats: { pops: Record<TowerType | HeroType, number>; leaked: number; spent: Record<string, number> };
  /** 11b: Turm-XP-Konto im Match, im Match Verdientes (Summe der `towerXp`-Events), freigeschaltete Stufe je Pfad, Pops (ohne Held) seit dem letzten Rundenende. */
  towerXp: Record<TowerType, number>;
  towerXpGained: Record<TowerType, number>;
  maxTier: Record<TowerType, Tiers>;
  roundPops: Record<TowerType, number>;
}

export interface TowerState {
  id: number; type: TowerType | HeroType; x: number; y: number;
  tiers: Tiers;                  // Held: [0,0,0]
  heroLevel: number;             // nur Held, sonst 0
  heroXp: number;
  target: TargetMode;
  /** Blickrichtung 0..7 (0 = rechts, gegen den Uhrzeigersinn in 45°-Schritten), für die Sprite-Richtung. */
  facing: number;
  /** Angriffs-Phase für die Animation: 0 = idle, sonst Ticks seit `windup` (0..~20). */
  attackTick: number;
  pops: number; spent: number;
  camo: boolean;                 // hat Erkennung
  range: number;                 // aktuell, Milli-px
}

export interface EnemyState {
  id: number; type: EnemyType; x: number; y: number;
  progress: number;              // Milli-px auf dem Weg
  hp: number; maxHp: number;     // Hülle
  camo: boolean; revealed: boolean;
  slowBp: number; slowTicks: number; stunTicks: number; frozenTicks: number; burnTicks: number;
  /** Boss: 0..3 abgefallene Platten; Brute: 0..2 Risse. */
  damageStage: number;
}

export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern';
export interface ProjectileState {
  id: number; kind: ProjectileKind; owner: number;
  x: number; y: number;          // aktuelle Position (Milli-px)
  vx: number; vy: number;        // Milli-px je Tick (für Richtung/Schweif)
  /** Nur Bombe: Start, Ziel und Fortschritt 0..10000 für den Bogen. */
  arc?: { x0: number; y0: number; x1: number; y1: number; t: number };
}
```

## Events (`drainEvents`)

Alle mit `tick`. Client spielt Animation/Effekt/Ton daraus, **nie** aus geratenen Zuständen.

| type | Felder | Bedeutung |
|---|---|---|
| `windup` | tower, target | Turm holt aus (Animation F0) |
| `fire` | tower, projectile?, kind | Abschuss (F2); bei Blitz statt Projektil `chain` |
| `hit` | enemy, tower, dmg, dtype, x, y | Treffer mit Schaden > 0 |
| `blocked` | enemy, x, y, reason | 'armor' (sharp an Ironshell) / 'immune' (cold an Ember) → „tink“ |
| `pop` | enemy, etype, x, y, children: number[], cash | Schicht geknackt (Platzen + Kinder) |
| `explode` | x, y, radius, kind | Explosion ('bomb' / 'mini' / 'star' / 'quake') |
| `nova` | x, y, radius | Frost-Nova |
| `chain` | tower, points: [x,y][], dmg | Blitzkette (sofort) |
| `status` | enemy, kind | 'slow' / 'stun' / 'freeze' / 'burn' / 'reveal' |
| `leak` | enemy, etype, lives | Gegner am Tor |
| `place` / `upgrade` / `sell` | tower, type, tiers?, cash? | Bau-Aktionen |
| `towerXp` | round, pot, gains: Partial<Record<TowerType, number>> | 11b: Rundenende, Topf und Anteile je Turmtyp (Summe = pot); fehlt ohne `GameOptions.towerXp` und wenn niemand etwas investiert/geknackt hat |
| `unlockTier` | tower, path, tier, cost, xp | 11b: Stufe freigeschaltet, `xp` = Rest des Kontos |
| `heroLevel` | tower, level | Held steigt auf |
| `ability` | id, x?, y? | Fähigkeit ausgelöst |
| `roundStart` / `roundEnd` | round, bonus? | |
| `bossStage` | enemy, stage | Platte fällt |
| `gameOver` | result: 'won' / 'lost', round | Ende |

## Karte (`sim/data/maps/meadow.json`)

```json
{ "id": "meadow", "name": "Lanternfall Meadow", "size": [640, 360],
  "path": [[-16,92],[120,92],[120,268],[268,268],[268,68],[440,68],[440,212],[332,212],[332,312],[532,312],[532,160],[656,160]],
  "pathHalfWidth": 13,
  "water": [ /* Polygone in px, unbebaubar */ ],
  "blockers": [ /* Kreise [x, y, r] in px: Bäume, Häuser, Steine */ ],
  "buildArea": [8, 8, 600, 352] }
```

Angaben in **px** (Datei), die Sim rechnet beim Laden in Milli-px um. Weg betritt links (Wald), verlässt rechts (Stadttor),
Länge ≈ 1.650 px. Der Bach läuft ungefähr von (300, −5) nach (350, 365) und kreuzt den Weg dreimal (Brücken). P3 legt Wasser
und Blocker passend zur gemalten Karte fest und darf den Weg **leicht** verschieben (Länge 1.550–1.750 px halten).

## Platzierregel

Turm-Mitte mit Fußabdruck-Radius r (tuerme.md): ganz in `buildArea`; Abstand zur Wegmitte ≥ `pathHalfWidth` + r;
nicht im Wasser (Mittelpunkt und 4 Randpunkte); Abstand zu Blockern ≥ Blocker-r + r; zu anderen Türmen ≥ r1 + r2.
Gründe: `out-of-bounds`, `on-path`, `water`, `blocked`, `overlap`, `no-cash`, `locked`, `hero-limit`.

## Client-Aufbau (P3 legt an, P2/P4 hängen sich ein)

- `client/src/pixel/sprites/index.ts` (P2) exportiert **reine Funktionen**, die Raster liefern, und einen Cache, der Pixi-Texturen baut:
  `towerSprite(type, tiers, facing, frame: 'idle0'..'idle3' | 'atk0'..'atk3')`, `heroSprite(level, facing, frame)`,
  `enemySprite(type, frame, { camo, damageStage, hitFlash })`, `projectileSprite(kind, dir16)`, `iconUpgrade(type, path, tier)`,
  `fx`: `explosion(kind, frame)`, `popShards(etype)`, `nova(frame)`, `boltLine(points)`.
  Rückgabe: `{ canvas, ax, ay }` (Ankerpunkt = Fuß), gecacht je Schlüssel.
- `client/src/match/` (P3): Renderer (Pixi v8, 640 × 360-Textur, nearest), Eingabe (Platzieren mit Geist + Reichweitenkreis,
  Auswahl, Tastatur), HUD (Leben, Geld, Runde x/20, Start/Tempo), Turm-Leiste rechts, Upgrade-Panel wie BTD6.
- Bis P2 fertig ist, benutzt P3 Platzhalter-Raster (einfarbige Kreise) hinter derselben Funktionssignatur.

## Ergänzung Runde 12: Powers

Details und Begründungen: `docs/design/powers.md` (Abschnitt "Umsetzung").

```ts
export type PowerKey = 'goldDrop' | 'lanternBomb' | 'caltrops' | 'frostTrap' | 'timeWarp' | 'lanternOil' | 'extraLives' | 'heroBoost'
  | 'instaWarden:ranger' | 'instaWarden:bombardier' | 'instaWarden:frostcaller';
GameOptions.powers?: Partial<Record<PowerKey, number>>;                      // Inventar beim Start
Command: { type: 'power'; power: PowerKey; x?: number; y?: number }          // Milli-px; x/y bei Lantern Bomb, Fallen, Insta-Warden
GameState.powers: Record<PowerKey, number>;                                  // Restbestand
GameState.powerUsedRound: Record<PowerKey, number>;                          // Runde des letzten Einsatzes, -1 = nie
GameState.traps: { id; kind: 'caltrops' | 'frostTrap'; progress; x; y; charges; until }[];
GameState.stats.powersUsed: Record<PowerKey, number>;
Game.canUsePower(power, x?, y?): PlaceCheck;                                 // Trockenlauf mit denselben Gründen
Game.roundPreview(r): { round; groups: { type; n; camo }[]; rbe; hasCamo; hasArmor; hasEmber; hasBoss } | null;
DATA.powers[key]: { name; desc; price; use: 'button' | 'target' | 'path' | 'place'; params; tower?; tiers? };  DATA.powerOrder; POWER_KEYS
```

Gründe: `unknown-power`, `no-power`, `used-this-round`, `no-hero`, `maxed`, `invalid-target`, `not-on-path`, beim Insta-Warden die Platziergründe (ohne `no-cash`).

| Event | Felder | Bedeutung |
|---|---|---|
| `power` | power, x?, y? | Einsatz erfolgreich (bei Fallen die gerasterte Position) |
| `trap` | id, kind, charges | Ladung verbraucht, `charges` = Rest |
| `trapGone` | id, kind, reason | 'spent' oder 'expired' |

Meta: `Profile.embers`, `Profile.inventory`, `Profile.starterPack`; `MatchResult.powersUsed?`; `MatchReport.embersGained / embers / powersUsed`; `buyPower(profile, key, count?)`; `matchOptions(profile).powers`.

## Ergänzung Runde 13: Lantern Market, Longshot, Wissensbaum

Spezifikation: `docs/design/tuerme-r13.md`. Details der Umsetzung und Abweichungen: `sim/README.md` „Runde 13“, `meta/README.md`.

```ts
export type TowerType = 'ranger' | 'bombardier' | 'frostcaller' | 'longshot' | 'market';
export type AbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak' | 'focus' | 'supplyDrop' | 'grant';
export type ProjectileKind = /* … */ | 'snipe';                      // Longshot-Bolzen (50 px je Tick); Splitter nutzen 'frag'
Command: { type: 'withdraw'; towerId: number }                       // Bank abheben; Gründe 'no-tower' | 'not-bank' | 'empty'; Ergebnis { ok: true, id: towerId }
TowerState.bank: number;                                             // Market-Konto (sonst 0)
TowerState.range                                                     // Longshot: ≥ 1.000.000 = ganze Karte (keine Ring-Zeichnung nötig); Market: Wirkradius der Auren
TowerState.camo                                                      // gilt jetzt inkl. Lookout-Bell-Aura (jeden Tick neu)
EnemyState.markTicks / markBp                                        // Crippling Shot: Boss-Markierung (Restticks, +bp Schaden)
GameState.focusLeft                                                  // Focus (Longshot B4), Restticks
GameState.powerUses                                                  // Einsätze je Power in der Runde powerUsedRound (Spare Pocket: 2)
GameState.stats.income / abilityCash                                 // Market-Einkommen gesamt / Gold aus Grant + Supply Drop
Game.marketInfo(towerId): MarketInfo | null                          // { income, hasBank, bank, bankRateBp, bankCap, nextInterest, grantCash, radius }
Game.auraOf(towerId): TowerAura                                      // { rangeBp, camo, speedBp, armor, pierce, dmg, discountBp } – was gerade auf den Turm wirkt
Game.sellValue(id)                                                   // enthält bei Markets den Bank-Inhalt
GameOptions.towerXp / unlocks.maxTier                                // Partial: fehlende Typen = 0 bzw. [0,0,0]
GameOptions.mods                                                     // neu: t2DiscountBp, tempoBp{typ}, freezeAddTicks, marketBp, bankRateBp, supplyBonus, marketRadiusBp,
                                                                     //      marketPriceBp, heroXpBp, powerUses, freePowers
```

| Event | Felder | Bedeutung |
|---|---|---|
| `income` | tower, round, amount, cash, bank | Rundenende, je Market: `amount` verdient (inkl. Zinsen), `cash` direkt ausgezahlt (ohne Bank = amount; Überlauf bei vollem Konto), `bank` Kontostand danach. Münzen von `tower` zur Geldanzeige fliegen lassen (bei Bank: zum Konto, `cash` zur Anzeige) |
| `withdraw` | tower, amount | Bank abgehoben |
| `ricochet` | tower, points: [x,y][], dmg | Longshot C2: Treffer + Sprungziele (sofort) |
| `ability` | id, x?, y?, **cash?** | `grant` / `supplyDrop`: `cash` = Gold, x/y = Position des (ersten) auslösenden Turms |
| `status` | enemy, kind | neu: `kind: 'mark'` (Boss markiert) |

Fähigkeiten `focus`, `supplyDrop`, `grant` sind wie Arrow Rain **global**: eine gemeinsame Abklingzeit, mehrere Türme addieren Gold bzw. teilen sich die Wirkung.

Meta: `TOWER_TYPES` hat fünf Einträge; `Profile.towerXp` / `towerTiers` je fünf (Staende bis Runde 12 werden beim Laden ergänzt, Startwert 100 bzw. `[0,0,0]`);
`KNOWLEDGE` (28 Knoten) trägt `branch` (`BRANCHES`: economy, primary, specialists, wardens, powers), `col`, `row`, `requires` (mindestens einer);
`knowledgePoints.total` = Level − 1 + erste Medaillen (`medalCount`); `MatchResult` darf `longshot`/`market` in `towerXp`/`towerTiers`/`pops` weglassen;
`MatchReport.embers.pouch`; `powerCost(profile, key)` (Bulk Buyer); `LEVEL_UNLOCKS` mit `longshot` (5) und `market` (6).

## Ergänzung Runde 14: Thornweaver, Alchemist, Wissensbaum 40 Knoten

Spezifikation: `docs/design/tuerme-r13.md` (Abschnitte 3, 4, „Runde 14“). Umsetzung und Abweichungen: `sim/README.md` „Runde 14“, `meta/README.md`.

```ts
export type TowerType = 'ranger' | 'bombardier' | 'frostcaller' | 'longshot' | 'market' | 'thornweaver' | 'alchemist';
export type AbilityId = /* … */ | 'wallOfTrees' | 'tonic';           // global wie Arrow Rain: eine Abklingzeit, wirkt an allen passenden Türmen
export type ProjectileKind = /* … */ | 'thorn' | 'potion';            // Dorn (450 px/s, Fächer/rundum); Trank im Bogen (Flugzeit 36 Ticks)
Command: { type: 'ability', ability: 'wallOfTrees' | 'tonic' }       // wallOfTrees: Grund 'no-target' wenn kein Thornweaver mit B3 einen Weg in Reichweite hat
GameState.walls: WallState[]                                          // Baumwände auf dem Weg { id, owner, progress, x, y, left (freie RBE, Start 150), ttl }
GameState.puddles: PuddleState[]                                      // Säurepfützen (Alchemist C2) { id, owner, progress, x, y, radius, charges, ttl, cd }
GameState.gateLeft / popCarry                                         // Sturdy Gate: verbleibende Leck-Verhinderungen; Bruchrest Pop Bonus
GameState.stats.groveGold / healed / bountyGold                       // Gold aus World Tree + Jungle's Bounty; Leben aus Bounty/Field Medic; Gold aus Lead to Gold/Rubber/Shrink
TowerState.zone                                                       // Thornweaver B4/B5: Radius der Ranken-Zone in Milli-px (0 = keine) -> Zone dauerhaft zeichnen
TowerState.buffTicks / buffDmg / buffRangeBp / buffSpeedBp            // Alchemist-Trank auf diesem Turm (Restticks, +Schaden, Reichweite/Tempo in bp)
TowerState.monsterTicks                                               // Transforming Tonic: Restticks der Monster-Form (0 = normal) -> Monster-Sprite statt Turm
EnemyState.vineTicks / goldTicks / volatile                           // Ranke (steht), Rubber to Gold (Restticks), Unstable Concoction (Id des Alchemisten, 0 = nein)
Game.buffOf(towerId): TowerBuff                                       // { dmg, rangeBp, speedBp, groveSpeedBp, permanent, ticks } – was gerade (inkl. Permanent Brew, Spring Blessing) auf dem Turm wirkt
GameOptions.mods                                                      // neu: popCashBp, pierceAdd{typ}, fragAdd{typ}, icicleDmg, bountyGold, brewDurBp, leadGoldAdd, roundLives, gate
GameOptions.towerXp / unlocks.maxTier                                 // Partial wie in Runde 13
```

| Event | Felder | Bedeutung |
|---|---|---|
| `whirlwind` | tower, x, y, radius, px, enemies[] | Tempest-Wirbelwind: `enemies` = zurückgeworfene Gegner (Nicht-Boss), `px` = Rückstoß in Milli-px Wegfortschritt |
| `vine` | tower, enemy, x, y, ticks | Ranke hält `enemy` für `ticks` fest (Vine Snare) |
| `zone` | tower, x, y, radius, dmg, hits | Ranken-Zone pulsiert einmal je Sekunde (B4/B5) |
| `wall` / `wallEat` / `wallGone` | id, tower, x, y, progress, left / wall, enemy, etype, rbe, left, cash / id, reason `spent`\|`expired` | Wall of Trees entsteht, schluckt einen Gegner (zahlt wie Pops), verschwindet |
| `brew` | tower, target, ticks, dmg, rangeBp, speedBp | Buff-Trank; `ticks` 0 = dauerhaft (Permanent Brew, nur beim ersten Mal je Turm gemeldet) |
| `monster` | tower, source, ticks | Transforming Tonic: Turm `tower` ist `ticks` lang ein Monster (`source` = auslösender Alchemist) |
| `puddle` / `puddleGone` | id, tower, x, y, radius, charges / id, reason | Säurepfütze entsteht, wird aufgefrischt oder verbraucht Treffer / verschwindet |
| `shrink` | tower, enemy, from, x, y, cash | Shrink Potion: Gegner ist jetzt ein Red Glim (gleiche Id und Position) |
| `bounty` | tower, x, y, gold, reason `lead` | Lead to Gold: Zusatzgold an der Trefferstelle |
| `heal` | tower, lives | Rundenertrag Leben (Jungle's Bounty; Field Medic mit `tower: 0`) |
| `gate` | enemy, etype | Sturdy Gate hat ein Leck verhindert |
| `income` | tower, round, amount, cash, bank | auch für Thornweaver-Rundengold (World Tree, Bounty): `bank` 0 |
| `explode` | kind | neu: `'acid'` (Säurespritzer, Radius des Trank-Splash), `'unstable'` (Unstable Concoction, 24 px) |
| `status` | enemy, kind | neu: `'snare'` (Ranke), `'acid'` (Säure läuft), `'gold'` (Rubber to Gold), `'volatile'` (Unstable markiert) |
| `fire` / `windup` | wie bisher | Thornweaver: Fächer (5) bzw. rundum (8) Dornen, `projectile` `thorn`; Alchemist: `potion` im Bogen, Treffer erst bei Ankunft |

Kettenblitz des Thornweavers nutzt das vorhandene Event `chain`. Fähigkeit `wallOfTrees`: `ability`-Event mit x/y der ersten Wand; `tonic`: `ability` plus ein `monster`-Event je betroffenem Turm.

Meta: `TOWER_TYPES` hat sieben Einträge; `Profile.towerXp` / `towerTiers` je sieben (Stände bis Runde 13 werden beim Laden ergänzt: Startwert 100 bzw. `[0,0,0]`, nichts wird zurückgesetzt); `MatchResult.towerXp`/`towerTiers`/`pops` dürfen die neuen Typen weglassen;
`LEVEL_UNLOCKS` mit `thornweaver` (7) und `alchemist` (9); `KNOWLEDGE` hat **40** Knoten (Summe 77 Punkte, jeder mit `branch/col/row/requires/cost/desc`, jede Voraussetzung steht in einer **früheren Zeile** desselben Asts);
`MatchReport.embers.rush` (Ember Rush); `matchEmbers(…, pouchBp, rush)`. Neue IDs: `investor`, `pop-bonus` (economy) · `sharper-arrows`, `fused-shells`, `icicle-edge` (primary) · `deep-roots`, `bountiful-grove`, `potent-brews`, `midas-hands`, `field-medic` (specialists) · `sturdy-gate` (wardens) · `ember-rush` (powers).

## Runde 15 (Karten, Gegner, Modi) — Schnittstelle Sim/Meta (Paket A)

Spezifikation: `docs/design/karten-gegner-r15.md`. Alles abwaertskompatibel: ohne `mode` laeuft Standard, ohne neue Felder verhalten sich alte Profile wie vorher.

- **Sim:** `createGame({ map: 'meadow'|'frostfen'|'quarry', mode?: ModeId, ... })`. `ModeId = 'standard'|'primary-only'|'specialists-only'|'no-hero'|'half-cash'|'deflation'`; `MODES`/`MODE_IDS` aus `sim/src/modes.ts` (Name, Beschreibung, erlaubte Tuerme, Held, Powers). `EnemyType` neu: `pink|frostling|crystal|gloomship|wyrm|colossus`. `RoundPreview.groups[]` hat `regrow`/`fortified`, `RoundPreview` neu `hasFrostling|hasBlimp|hasRegrow|hasFortified`. Karten haben `paths` (mehrere Wegaeste); `path` bleibt der erste.
- **Meta:** `MAPS`/`MAP_IDS`/`MAP_NAMES`/`mapById`/`maxRoundOf`, `mapLock`/`isMapUnlocked`/`unlockedMaps`, `MODE_META`/`modeLock`/`isModeUnlocked`, `rewardFactors(map, mode)`, `medalsOf(p, map, mode?)`, `bestOf(p, map, difficulty, mode?)`, `allMedalCount`. `MatchResult.mode` (Vorgabe `standard`). `matchOptions(p, mode?)` liefert zusaetzlich `mode`; die Karte reicht der Aufrufer weiter. Profil: `modeMedals`/`modeBest` (Karte -> Modus -> Schwierigkeit), Schema weiter 11.
- **Client (Paket C):** Route `{ name: 'setup', map }` (Karte -> Schwierigkeit + Modus -> Play); `Ctx.map`/`Ctx.mode`; `StartOptions.mode`, `MatchResult.map|mode|roundsCleared`; `new Renderer(mapId)`; Darstellungsdaten der Gegner in `match/enemy-info.ts`, Wege je Karte in `match/map-info.ts`. Der Platzhalter `enemy-look.ts` ist entfernt.
