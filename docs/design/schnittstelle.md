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
