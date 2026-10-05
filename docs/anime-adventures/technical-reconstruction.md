# Technical Reconstruction

Dieser Teil ist **unser Bauplan** und keine AA-Dokumentation. Die Architektur ist auf die recherchierten Systeme zugeschnitten. Wo AA-Werte fehlen, liegen konfigurierbare `DESIGN`-Defaults im Content und nicht im Code.

# Recommended Web Architecture

## Leitprinzipien

1. **Content-driven:** Alle Zahlen (Units, Upgrades, Gegner, Waves, Raten) liegen in versionierten JSON- bzw. Content-Dateien. Unbekannte AA-Werte sind dort als `DESIGN` markiert und ohne Codeänderung tunebar.
2. **Deterministische Simulation:** Fixed Timestep (z. B. 20 Ticks/s), seeded RNG und **Simulation vom Rendering getrennt**. Das ermöglicht Replays, Server-Validierung und Balancing-Tests wie die [Beispiel-Simulation](simulation.md).
3. **Server-autoritativ für alles mit Wert:** Gacha, Traits, Potential, Evolution, Belohnungen, Trades. Der Client fordert nur an.
4. **Koop-Multiplayer:** Server-Sim (autoritativ) mit Client-Interpolation. Inputs sind Place, Upgrade, Sell, Ability, Targeting und Skip.

## Komponenten

```text
Frontend (TypeScript, Vite)
├── Shell/Router (React o. Svelte für Menüs)
├── Lobby-Hub                ← NPC-Funktionen als Panels (Summon, Evolve, Traits, Potential, Shiny, Milestones, Shop, Storage)
├── Unit Collection / Inventory / Teams (6 Slots)
├── Summoning (Banner, Pity-Anzeige, Animation)
├── Evolution / Traits / Potential / Curses / Relics / Limit Break
├── Quests / Battle Pass / Codes / Leaderboards
├── Party & Stage Select (Story/Infinite/Legend/Raid/Portal/Challenge)
├── Trading
└── Tower Defense Client
    ├── Renderer (PixiJS 2D oder Three.js)   ← Animation, VFX, Hit-Frames
    ├── Input (Placement-Preview, Range-Kreis, Unit-Panel, Targeting, Ability)
    └── Net (State-Snapshots, Interpolation)

Game Engine (shared TS package, läuft im Client [Solo/Prediction] und auf dem Server)
├── Sim Core (fixed tick, seeded PRNG)
├── Map System (Pfade als Polylines, Placement-Zonen Ground/Hill, Blocker)
├── Wave Manager (Gruppen, Intervalle, Boss-Waves, Infinite-Generator, Party-Scaling)
├── Enemy Manager (Pfad-Distanz s, Speed-Mods, Flying, Shield, Regen, Tank, Resist/Weak)
├── Unit Manager (Placement-Regeln, Spawn Cap, Upgrades, Sell)
├── Targeting System (First/Strongest/… + Klassenfilter Ground/Air)
├── Combat Engine (Attack-Cycle, AoE-Geometrie, Hits, Crit, Damage-Pipeline)
├── Status Effect System (DoT-Ticks, CC mit Diminishing-Cooldowns, Knockback, Rewind, Shatter)
├── Buff System (Typ-Buffs, Stacking-Regeln, Ability-Cooldowns ~ SPA)
├── Ability System (Active/Passive, Upgrade-Unlocks)
├── Economy (Yen: Start, Kill, Wave, Farm, Golden, Sell)
└── Match Result (Belohnungs-Roll serverseitig)

Backend (Node/TS)
├── Auth (OAuth/E-Mail, Sessions)
├── Player Data (Profil, Level/XP, Milestones, Settings)
├── Inventory (Units als Instanzen, Items, Portale, Stacks mit Limits)
├── Units (Level, Trait, Potential, Worthiness, Curse, Relic, Skin, Shiny, Limited-Flag)
├── Gacha Service (Banner-Rotation, Raten, Pity-Zähler, Audit-Log)
├── Progression (Story-Unlocks, Infinite-Records, Clear-Counter)
├── Currency (Gems, Gold, Remnants, Tokens …; doppelte Buchführung/Ledger)
├── Shops (Merchant-Zyklus, Gold-Shop, Event-Shops, Raid-Shops)
├── Quests/Battle Pass/Codes (Reset-Jobs)
├── Trading (Escrow, Tax, Atomic Swap)
├── Matchmaking/Rooms (Party-Räume, Portal-Host, max. Spieler pro Modus)
├── Match Server (autoritativer Sim-Prozess pro Match, z. B. Colyseus)
├── Leaderboards (Redis Sorted Sets; Saison-Resets)
└── Anti-Cheat (Server-Sim, Rate-Limits, Plausibilitätsprüfung von Inputs, Ledger-Audits)

Persistenz: PostgreSQL (Spieler, Inventar, Ledger) · Redis (Sessions, Leaderboards, Banner-Cache)
```

## Simulation-Loop (Kern)

```text
tick(dt = 0.05):
  waveManager.update(dt)            // spawns
  enemies.move(dt)                  // s += v·dt, Status-Mods, Leaks → baseHP
  statusEffects.tick(dt)            // DoT, CC-Ablauf, Regen
  for unit in units (stabile Reihenfolge):
     if unit.cooldown <= 0 and target = targeting.pick(unit):
        combat.startAttack(unit, target)   // windup → hit event in Queue
  combat.resolveHitEvents()         // Damage-Pipeline, Effekte, Kills → Yen
  abilities.update(dt)
  economy.flush()                   // Wave-Ende: waveYen + farms
```

## Damage-Pipeline (konfigurierbar)

```text
hit = base(level k der Unit)                    // levels[k].damage  [S65]
    × levelCurve(unitLevel)                     // L1 = 1, L100 = 9.20406501834430488  [S72: Template Stats Box]
    × (1 + potential) × (1 + trait) × (1 + curse) × (1 + relic)
    × (1 + Σ damage_add aller aktiven Buffs)    // additiv: +100 % und +10 % → ×2,1 (VERIFIED, Wiki-Template)  [S65 aura_buff, S72]
    × crit × typeMatchup × enemyMods
hitsPerAttack = attack.hits ?? 1                // Damage wird auf die Hits AUFGETEILT  [S76]
for i in 1..hitsPerAttack:
   h = hit / hitsPerAttack
   shieldPhase: if enemy.shield > 0 → enemy.shield -= 1 (Shatter: = 0); continue
   hp -= h
dot (falls attack.dot): totalMultiplier = multiplierPerTick × ticks  (z. B. Burn 0,06 × 5 = 30 %)  [S67]
applySpecial(attack.special); onKill → killYen
```

Die Reihenfolge der Faktoren zwischen Potential, Trait, Curse, Relic und Buff ist nicht belegt (RECONSTRUCTED · LOW). Belegt sind die additive Buff-Stapelung, der Level-100-Faktor und die Hits-Aufteilung.

# Datenmodell

TypeScript-Interfaces als kanonisches Schema. JSON-Beispiele stehen in [data/](data/).

```ts
type Provenance = "VERIFIED" | "OBSERVED" | "RECONSTRUCTED" | "DERIVED" | "UNKNOWN" | "DESIGN";
type Rarity = "rare" | "epic" | "legendary" | "mythic" | "secret" | "exclusive";   // AA: 6 Raritäten [S65]
type Placement = "ground" | "hill" | "hybrid";                                     // AA: hill_unit / hybrid_placement [S65]
type DamageKind = "physical" | "magic" | "true";                                   // Primärtyp [S65]
type Element = "dark" | "fire" | "lightning" | "ice" | "air" | "light" | "water" | "rose";  // Sekundärtypen [S65]
type TargetMode = "first" | "last" | "strongest" | "weakest" | "closest";          // AA-Liste siehe combat-system.md

// Angriffsdefinition – entspricht S67 (1.098 Einträge); wird von Unit-Stufen per ID referenziert
interface AttackDef {
  id: string;
  aoe: "single" | "circle" | "cone" | "line" | "full";
  radius?: number; angleDeg?: number; width?: number;   // Studs bzw. Grad
  hits?: number;                                        // teilt den Damage auf; entfernt je Hit 1 Schild
  dot?: { type: "burn" | "bleed" | "poison" | "wither"; multiplierPerTick: number; ticks: number };
  special?: { name: string; influence?: number; duration?: number };   // Slow 0.5/4 s, Stun, Freeze, Timestop, Knockback, Shatter, Cursed, …
}

interface UnitLevel {             // Stufe 0 = Platzierung (entspricht units.json → levels[])
  level: number;
  cost: number;                   // Kosten DIESER Stufe
  damage: number; spa: number; range: number;   // fehlende Werte erben vom Vorgänger
  attackId: string;               // → AttackDef
  farmPerWave?: number;           // Farm-Units
  note?: string;                  // z. B. "+ Bamboo Shot" = neuer Angriff freigeschaltet
  activeAbility?: { id: string; cooldown: number; duration?: number };
  provenance: Provenance;
}

interface Unit {                  // Definition (Content)
  id: string; name: string; rarity: Rarity;
  limited: boolean; summonable: boolean; rateUpOnly?: boolean; obtain: string[];
  placement: Placement; damageKind: DamageKind; elements: Element[];
  spawnCap: number; spawnCapScope: "player" | "team";   // AA: "6 (Global)" bei Buffern
  sellRate: number;                                      // AA: 0.25 global [S72]
  unsellable?: boolean;
  critChance?: number; critDamage?: number;              // AA: meist 0.5 / Standard
  aura?: { global?: boolean; buffs: { stat: "damage" | "crit" | "range" | "spa"; add: number }[] };
  defaultTarget: TargetMode;
  levels: UnitLevel[];
  body?: { health: number; speed: number };              // Units mit eigener Lauf- bzw. Beschwörungslogik
  summons?: { unitId: string; max: number }[];
  evolution?: Evolution;
  hitFrameMs?: number;            // DESIGN: Animations-Sync
  provenance: Provenance; sources?: string[];
}

interface StatusEffectSpec {      // Laufzeit-Effekt auf Gegnern
  kind: "burn" | "bleed" | "poison" | "wither" | "slow" | "stun" | "freeze" | "timestop" | "knockback"
      | "confused" | "shatter" | "cursed" | "hexed" | "dismembered" | "bleedAmp" | string;
  multiplierPerTick?: number; ticks?: number; tickInterval?: number;
  influence?: number;             // z. B. Slow 0.5 = −50 % Speed
  duration?: number;
  immunityAfter?: number;         // CC-Immunitätsfenster (siehe combat-system.md)
}

interface UnitInstance {          // Besitz (Backend)
  instanceId: string; unitId: string; ownerId: string;
  level: number; xp: number; maxLevel: number;            // 100 + 10 × limitBreaks
  shiny: boolean; skinId?: string;
  traitId?: string; traitTier?: 1 | 2 | 3;
  potential: { damage: number; spa: number; range: number };   // −0.10 … +0.20
  worthiness: number; kills: number;                       // worthiness 0..4
  curse?: { up: { stat: string; pct: number }; down: { stat: string; pct: number } };
  relicId?: string; locked: boolean; tradeable: boolean; obtainedAt: string;
}

interface Trait {
  id: string; name: string; rollWeight: number;            // 29.97 …
  tiers?: { tier: number; damage?: number; spa?: number; range?: number }[];
  damage?: number; spa?: number; range?: number; yen?: number; xp?: number;
  conditional?: { vsBoss?: number; vsLowHpPct?: number; lowHpThreshold?: number; trueDamagePct?: number };
  provenance: Provenance;
}

interface Enemy {
  id: string; name: string; hp: number; speed: number;
  flying: boolean; boss: boolean;
  shield?: number; regenPerSec?: number; tankReduction?: number;
  resist?: DamageType[]; weak?: DamageType[];
  leakDamage: number; killYen: number;
  abilities?: string[]; provenance: Provenance;
}

interface WaveGroup { enemyId: string; count: number; interval: number; startDelay: number; pathId?: string; mods?: string[] }
interface Wave { index: number; groups: WaveGroup[]; bossId?: string; waveYen: number }

interface MapDef {
  id: string; name: string; world?: string;
  paths: { id: string; points: [number, number][]; lengthStuds?: number }[];
  placementZones: { type: "ground" | "hill"; polygon: [number, number][] }[];
  blockedZones?: { polygon: [number, number][] }[];
  baseHp: number; startYen: number;
}

interface Stage {
  id: string; mapId: string; mode: "story" | "infinite" | "legend" | "raid" | "portal" | "challenge" | "dungeon" | "castle" | "contract" | "event";
  act?: number; difficulty?: "normal" | "hard";
  waves: Wave[] | { generator: "infinite"; params: Record<string, number> };
  modifiers?: string[];                 // "tank","shield","regen","fast","flying","highCost",…
  unlock: { requires?: string[]; minLevel?: number };
  rewards: RewardTable; firstClearRewards?: RewardTable; maxPlayers: number;
}

interface RewardTable { entries: { itemId: string; min: number; max: number; chance: number }[]; guaranteedAfterClears?: { clears: number; itemId: string } }

interface Banner {
  id: string; kind: "standard" | "special" | "event" | "legacy";
  currency: "gems" | "eventCurrency" | "legacyGems"; cost: number; vipCost?: number;
  rates: Record<Rarity, number>; shinyRate: number;
  featured: { center?: string; sides?: string[]; centerShareOfMythic: number; sideShareOfMythic: number };
  rotationSeconds?: number;                         // 3600 (LEGACY)
  pity: { mythicCenter?: number; legendary?: number; resetOn: "anyOfRarity" | "featuredOnly" };
  extraDrops?: { itemId: string; chance: number }[]; // Star Remnant 0.0025
}

interface Item { id: string; name: string; category: string; stackLimit?: number; tradeable: boolean }

interface Evolution { fromUnitId: string; toUnitId: string; items: { itemId: string; qty: number }[]; units?: { unitId: string; qty: number; shiny?: boolean }[]; takedowns?: number; statText?: string; shinyItems?: { itemId: string; qty: number }[]; rerollPotential: true; potentialFloor: "previous" }   // AA: 222 Rezepte, Takedowns meist 7.500/5.000 [S65]

interface Portal { id: string; name: string; tiers: { tier: number; mapPool: string[]; enemyHpMult: number; rewardMult: number }[]; secretPortalChance?: number; maxPlayers: number; hostSecretChance?: number; memberSecretChance?: number }

interface Quest { id: string; kind: "daily" | "story" | "infinite" | "event" | "evolution"; objective: { type: string; target?: string; count: number }; rewards: RewardTable; resetCron?: string }

interface Currency { id: "yen" | "gems" | "gold" | "trophies" | "starRemnant" | "rerollToken" | string; scope: "match" | "account" | "event"; tradeable: boolean; cap?: number }

interface Player {
  id: string; level: number; xp: number; currencies: Record<string, number>;
  storageCap: number;                    // 100 (+100 je Pass / Gold-Stufen 150/200/250)
  teams: string[][];                     // je 6 instanceIds
  pity: Record<string /*bannerId*/, { mythic: number; legendary: number }>;
  progress: { clearedStages: Record<string, number>; infiniteBest: Record<string, number> };
  gamepasses: string[]; claimedMilestones: number[]; redeemedCodes: string[];
}
```

## DESIGN-Defaults (bis AA-Daten vorliegen)

| Parameter | Default | Begründung |
|---|---|---|
| Base HP | 100 | Genre-Standard |
| Leak-Schaden | normal 1–5, Boss 20–100 | Genre-Standard |
| Start-Yen | 2.000–2.500 | erlaubt 1 Starter + 1 Farm in Wave 1 (vgl. Captain 300, C.E.O. 550) |
| Wave-Yen | `200 + 100·w` | Farm-ROI von 3–4 Waves soll relevant bleiben |
| Kill-Yen | `5 + floor(HP/10)` | – |
| Gegner-Speed | 4 Studs/s (Boss 2) | Map-Laufzeiten 8–24 s → 32–96 Studs |
| Tick-Rate | 20 Hz | – |
| DoT-Tick | 1 s | – |
| Tank-Reduktion | 20 % | „leicht reduziert“ |
| Typ-Matchup | Schwäche ×1,5 / Resistenz ×0,5 | analog zu Genre-Standards; **nicht** AA |
| Level-Kurve | linear mit Anker L100 = 9,20406501834430488 | einfach, Anker belegt (exakte Konstante aus dem Wiki-Template) |
| Max Spieler | 4 (Secret Portal 6) | Community-Konsens bzw. Beleg |
