/**
 * Crossover-Figuren (Runde 8 / P6): Quelle der 25 Datensaetze in `sim/data/units/crossover.json`.
 * Schreiben: `npm run crossover`, pruefen: `npm run crossover:check`. Nur Daten, keine Mechanik: jede Faehigkeit ist eine Kombination
 * aus dem Baukasten (Angriffsform, Hits, DoT, Effekte aus `sim/data/effects.json`, Angriffswechsel je Stufe).
 *
 * Werte: nicht frei erfunden. Je Figur Faktoren (`dmg`, `spa`, `range`, `cost`) auf die Median-Stufenkurve der Seltenheit aus
 * `aa.json` (`vorlage.ts`); `crossover.ts` rundet und prueft gegen das AA-Band P5..P95 je Stufe.
 */
export interface Special {
  name: string;
  duration?: number;
  influence?: number;
  chance?: number;
}
export interface AttackDef {
  aoe?: 'single' | 'circle' | 'cone' | 'line' | 'full';
  radius?: number;
  angle?: number;
  width?: number;
  hits?: number;
  dot?: { type: 'Burn' | 'Bleed' | 'Poison' | 'Wither'; multiplierPerTick: number; ticks: number; totalMultiplier?: number };
  special?: Special | Special[];
}
export interface Stage {
  /** ab dieser Stufe (0 = Platzierung) */
  from: number;
  /** Suffix der Angriffs-ID: `x_<figur>:<key>` */
  key: string;
  /** Name der Faehigkeit (nur Anzeige, steht in `note` der Stufe) */
  title: string;
  attack: AttackDef;
}
export interface Figure {
  id: string;
  name: string;
  rarity: 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Secret';
  placement: 'ground' | 'hill' | 'hybrid';
  damageType?: 'magic' | 'true';
  elements?: string[];
  critChance?: number;
  critDamage?: number;
  footprint?: 1 | 2;
  hitsAir?: boolean;
  /** Faktoren auf die Median-Kurve der Seltenheit (Vorgabe 1) */
  dmg: number;
  spa: number;
  range: number;
  cost?: number;
  flavor: string;
  imageQuery: string;
  stages: Stage[];
}

const slow = (influence: number, duration?: number): Special => ({ name: 'Slow', influence, ...(duration ? { duration } : {}) });

export const FIGURES: Figure[] = [
  // ------------------------------------------------------------------ Secret
  {
    id: 'x_ironman', name: 'Iron Man', rarity: 'Secret', placement: 'hybrid', elements: ['fire', 'lightning'], critChance: 0.25,
    dmg: 1.1, spa: 1, range: 1.05,
    flavor: 'I am Iron Man. Also the beam, the missiles and the invoice.',
    imageQuery: 'Iron Man Tony Stark suit portrait',
    stages: [
      { from: 0, key: 'repulsor', title: 'Repulsor Beam', attack: { aoe: 'line', width: 6 } },
      { from: 3, key: 'salvo', title: 'Micro-Missile Salvo', attack: { aoe: 'circle', radius: 10, hits: 6, dot: { type: 'Burn', multiplierPerTick: 0.05, ticks: 4 } } },
      { from: 6, key: 'unibeam', title: 'Unibeam + Hulkbuster Barrage', attack: { aoe: 'circle', radius: 13, hits: 12, dot: { type: 'Burn', multiplierPerTick: 0.06, ticks: 5 } } },
    ],
  },
  {
    id: 'x_vader', name: 'Darth Vader', rarity: 'Secret', placement: 'ground', damageType: 'magic', elements: ['dark'],
    dmg: 1.05, spa: 1, range: 1,
    flavor: 'I find your lack of armor disturbing.',
    imageQuery: 'Darth Vader helmet portrait Star Wars',
    stages: [
      { from: 0, key: 'choke', title: 'Force Choke', attack: { aoe: 'single', special: { name: 'Unconscious', duration: 1.5 } } },
      { from: 3, key: 'push', title: 'Force Push', attack: { aoe: 'cone', angle: 80, special: { name: 'Knockback' } } },
      { from: 6, key: 'disturbing', title: 'Lack of Faith', attack: { aoe: 'circle', radius: 14, hits: 3, special: { name: 'Cursed (30%)', duration: 8 } } },
    ],
  },
  {
    id: 'x_gandalf', name: 'Gandalf', rarity: 'Secret', placement: 'hill', damageType: 'magic', elements: ['light', 'fire'],
    dmg: 1.1, spa: 1, range: 1.05,
    flavor: 'A wizard is never late, nor are his fireworks.',
    imageQuery: 'Gandalf the Grey portrait Lord of the Rings',
    stages: [
      { from: 0, key: 'staff', title: 'Staff Blast', attack: { aoe: 'line', width: 5 } },
      { from: 3, key: 'pass', title: 'You Shall Not Pass', attack: { aoe: 'line', width: 11, special: { name: 'Knockback' } } },
      { from: 6, key: 'fireworks', title: 'Fellowship Fireworks', attack: { aoe: 'circle', radius: 12, hits: 5, dot: { type: 'Burn', multiplierPerTick: 0.06, ticks: 5 } } },
    ],
  },
  {
    id: 'x_mario', name: 'Mario', rarity: 'Secret', placement: 'ground', elements: ['fire'], critChance: 0.2,
    dmg: 0.95, spa: 0.95, range: 0.95,
    flavor: 'It is-a me! Mostly jumping on things.',
    imageQuery: 'Super Mario portrait Nintendo',
    stages: [
      { from: 0, key: 'stomp', title: 'Goomba Stomp', attack: { aoe: 'circle', radius: 5, hits: 2 } },
      { from: 3, key: 'fireflower', title: 'Fire Flower', attack: { aoe: 'circle', radius: 8, hits: 3, dot: { type: 'Burn', multiplierPerTick: 0.05, ticks: 5 } } },
      { from: 6, key: 'star', title: 'Super Star', attack: { aoe: 'circle', radius: 12, hits: 8, special: { name: 'Battlelust' } } },
    ],
  },
  {
    id: 'x_doge', name: 'Doge', rarity: 'Secret', placement: 'ground', critChance: 0.3,
    dmg: 1, spa: 1, range: 0.95,
    flavor: 'Much damage. Very random. Wow.',
    imageQuery: 'Doge shiba inu meme portrait',
    stages: [
      { from: 0, key: 'wow', title: 'Much Wow', attack: { aoe: 'cone', angle: 90, special: { name: 'Wild Card' } } },
      { from: 3, key: 'explosion', title: 'Very Explosion', attack: { aoe: 'circle', radius: 10, hits: 5, special: { name: 'Wild Card' } } },
      { from: 6, key: 'moon', title: 'To The Moon', attack: { aoe: 'full', hits: 6, special: { name: 'Wild Card' } } },
    ],
  },
  // ------------------------------------------------------------------ Mythic
  {
    id: 'x_rick', name: 'Rick Astley', rarity: 'Mythic', placement: 'ground',
    dmg: 0.85, spa: 1, range: 1.1,
    flavor: 'Never gonna give you up. Your enemies will not give up walking backwards either.',
    imageQuery: 'Rick Astley Never Gonna Give You Up portrait',
    stages: [
      { from: 0, key: 'never_gonna', title: 'Never Gonna Give You Up', attack: { aoe: 'circle', radius: 14, special: { name: 'Confused' } } },
      { from: 3, key: 'let_you_down', title: 'Never Gonna Let You Down', attack: { aoe: 'cone', angle: 100, hits: 2, special: [{ name: 'Confused' }, slow(0.4, 3)] } },
      { from: 6, key: 'rickroll', title: 'Rickroll', attack: { aoe: 'full', hits: 3, special: { name: 'Confused', duration: 6 } } },
    ],
  },
  {
    id: 'x_shrek', name: 'Shrek', rarity: 'Mythic', placement: 'ground', footprint: 2, elements: ['water'],
    dmg: 1, spa: 1.05, range: 0.95,
    flavor: 'Ogres are like onions. They stink and everything in the swamp slows down.',
    imageQuery: 'Shrek ogre portrait',
    stages: [
      { from: 0, key: 'swamp', title: 'Swamp', attack: { aoe: 'circle', radius: 16, special: slow(0.6, 4) } },
      { from: 3, key: 'getout', title: 'Get Out Of My Swamp', attack: { aoe: 'circle', radius: 18, hits: 2, special: [slow(0.7, 4), { name: 'Knockback' }] } },
      { from: 6, key: 'dragon', title: 'Donkey and the Dragon', attack: { aoe: 'circle', radius: 14, hits: 4, dot: { type: 'Burn', multiplierPerTick: 0.06, ticks: 4 }, special: slow(0.75, 5) } },
    ],
  },
  {
    id: 'x_wick', name: 'John Wick', rarity: 'Mythic', placement: 'ground', critChance: 0.5, critDamage: 2.5,
    dmg: 1, spa: 0.95, range: 1,
    flavor: 'They killed his dog. Now your wave has a pencil problem.',
    imageQuery: 'John Wick portrait suit',
    stages: [
      { from: 0, key: 'gunfu', title: 'Gun-Fu', attack: { aoe: 'single', hits: 3 } },
      { from: 3, key: 'pencil', title: 'The Pencil', attack: { aoe: 'cone', angle: 50, hits: 6 } },
      { from: 6, key: 'babayaga', title: 'Baba Yaga', attack: { aoe: 'line', width: 5, hits: 10, dot: { type: 'Bleed', multiplierPerTick: 0.1, ticks: 3 }, special: { name: 'OverCrit' } } },
    ],
  },
  {
    id: 'x_gigachad', name: 'Gigachad', rarity: 'Mythic', placement: 'ground', footprint: 2, critChance: 0.3,
    dmg: 1.2, spa: 1, range: 0.9,
    flavor: 'Does not dodge attacks. The attacks dodge him.',
    imageQuery: 'Gigachad meme black and white portrait',
    stages: [
      { from: 0, key: 'jawline', title: 'Jawline', attack: { aoe: 'single', special: { name: 'Stun' } } },
      { from: 3, key: 'sigma', title: 'Sigma Grindset', attack: { aoe: 'circle', radius: 7, special: { name: 'Knockback' } } },
      { from: 6, key: 'alpha', title: 'Alpha Aura', attack: { aoe: 'circle', radius: 11, hits: 2, special: [{ name: 'Dismembered' }, { name: 'Stun' }] } },
    ],
  },
  {
    id: 'x_neo', name: 'Neo', rarity: 'Mythic', placement: 'hybrid',
    dmg: 0.95, spa: 1, range: 1,
    flavor: 'There is no spoon, but there are four hundred bullets standing still.',
    imageQuery: 'Neo The Matrix portrait sunglasses',
    stages: [
      { from: 0, key: 'kungfu', title: 'I Know Kung Fu', attack: { aoe: 'cone', angle: 60, hits: 4 } },
      { from: 3, key: 'bullettime', title: 'Bullet Time', attack: { aoe: 'circle', radius: 12, hits: 2, special: { name: 'Timestop' } } },
      { from: 6, key: 'theone', title: 'The One', attack: { aoe: 'full', hits: 3, special: { name: 'Timestop', duration: 2.5 } } },
    ],
  },
  {
    id: 'x_pikachu', name: 'Pikachu', rarity: 'Mythic', placement: 'ground', elements: ['lightning'], critChance: 0.1,
    dmg: 0.95, spa: 0.95, range: 1,
    flavor: 'Pika Pika! (Translation: please stop touching the cables.)',
    imageQuery: 'Pikachu portrait Pokemon',
    stages: [
      { from: 0, key: 'shock', title: 'Thunder Shock', attack: { aoe: 'line', width: 4, special: { name: 'Stun', chance: 0.3 } } },
      { from: 3, key: 'thunderbolt', title: 'Thunderbolt', attack: { aoe: 'circle', radius: 10, hits: 5, special: { name: 'Stun', chance: 0.5 } } },
      { from: 6, key: 'thunder', title: 'Thunder', attack: { aoe: 'full', hits: 8, special: { name: 'Stun', chance: 0.35 } } },
    ],
  },
  {
    id: 'x_sonic', name: 'Sonic', rarity: 'Mythic', placement: 'ground', critChance: 0.2,
    dmg: 0.9, spa: 0.9, range: 0.95,
    flavor: 'Gotta go fast. The enemies are already behind him anyway.',
    imageQuery: 'Sonic the Hedgehog portrait',
    stages: [
      { from: 0, key: 'spindash', title: 'Spin Dash', attack: { aoe: 'single', hits: 6 } },
      { from: 3, key: 'homing', title: 'Homing Attack', attack: { aoe: 'circle', radius: 6, hits: 8, special: { name: 'Knockback' } } },
      { from: 6, key: 'super', title: 'Super Sonic', attack: { aoe: 'line', width: 6, hits: 12, special: { name: 'Battlelust' } } },
    ],
  },
  {
    id: 'x_thanos', name: 'Thanos', rarity: 'Mythic', placement: 'ground', footprint: 2, damageType: 'magic', elements: ['dark'],
    dmg: 1.1, spa: 1.05, range: 0.95,
    flavor: 'Perfectly balanced, as all things should be. Your wave, less so.',
    imageQuery: 'Thanos Infinity Gauntlet portrait',
    stages: [
      { from: 0, key: 'fist', title: 'Titan Fist', attack: { aoe: 'single', special: [{ name: 'Dismembered' }, { name: 'Stun' }] } },
      { from: 3, key: 'powerstone', title: 'Power Stone', attack: { aoe: 'circle', radius: 12, hits: 2, special: { name: 'Cursed (30%)' } } },
      { from: 6, key: 'snap', title: 'The Snap', attack: { aoe: 'full', hits: 4, dot: { type: 'Wither', multiplierPerTick: 0.08, ticks: 5 } } },
    ],
  },
  // ------------------------------------------------------------------ Legendary
  {
    id: 'x_spiderman', name: 'Spider-Man', rarity: 'Legendary', placement: 'hill', critChance: 0.2,
    dmg: 1, spa: 1, range: 1,
    flavor: 'With great power comes great web-shooting. Spider-sense not included.',
    imageQuery: 'Spider-Man portrait mask',
    stages: [
      { from: 0, key: 'web', title: 'Web Shot', attack: { aoe: 'line', width: 3, special: slow(0.5, 3) } },
      { from: 3, key: 'webbomb', title: 'Web Bomb', attack: { aoe: 'circle', radius: 7, hits: 3, special: slow(0.6, 3) } },
      { from: 6, key: 'swing', title: 'Web Swing', attack: { aoe: 'circle', radius: 10, hits: 6, special: slow(0.7, 4) } },
    ],
  },
  {
    id: 'x_link', name: 'Link', rarity: 'Legendary', placement: 'ground', hitsAir: true, critChance: 0.25,
    dmg: 1, spa: 1, range: 1,
    flavor: 'Hey! Listen! He never says a word, but his bombs do the talking.',
    imageQuery: 'Link Legend of Zelda portrait',
    stages: [
      { from: 0, key: 'sword', title: 'Master Sword', attack: { aoe: 'single' } },
      { from: 3, key: 'beam', title: 'Sword Beam', attack: { aoe: 'line', width: 4 } },
      { from: 6, key: 'spin', title: 'Spin Attack + Bomb Arrows', attack: { aoe: 'circle', radius: 10, hits: 4, dot: { type: 'Burn', multiplierPerTick: 0.05, ticks: 4 } } },
    ],
  },
  {
    id: 'x_chuck', name: 'Chuck Norris', rarity: 'Legendary', placement: 'ground', critChance: 0.4,
    dmg: 1.05, spa: 1, range: 0.95,
    flavor: 'Does not deal damage. Damage deals Chuck Norris.',
    imageQuery: 'Chuck Norris portrait',
    stages: [
      { from: 0, key: 'roundhouse', title: 'Roundhouse Kick', attack: { aoe: 'circle', radius: 7, special: { name: 'Knockback' } } },
      { from: 3, key: 'sweep', title: 'Beard Sweep', attack: { aoe: 'cone', angle: 120, hits: 3, special: { name: 'Unconscious', duration: 1 } } },
      { from: 6, key: 'stare', title: 'The Stare', attack: { aoe: 'full', special: { name: 'Stun' } } },
    ],
  },
  {
    id: 'x_nyancat', name: 'Nyan Cat', rarity: 'Legendary', placement: 'hill', elements: ['rose'],
    dmg: 0.95, spa: 0.95, range: 1,
    flavor: 'Nyan nyan nyan nyan. Leaves a rainbow, a headache and a slowed wave.',
    imageQuery: 'Nyan Cat pop tart rainbow',
    stages: [
      { from: 0, key: 'rainbow', title: 'Rainbow Trail', attack: { aoe: 'line', width: 8, special: slow(0.5, 3) } },
      { from: 3, key: 'rainbow2', title: 'Double Rainbow', attack: { aoe: 'line', width: 12, hits: 5, special: slow(0.6, 3) } },
      { from: 6, key: 'overdrive', title: 'Nyan Overdrive', attack: { aoe: 'full', hits: 5, special: slow(0.65, 4) } },
    ],
  },
  {
    id: 'x_yoda', name: 'Yoda', rarity: 'Legendary', placement: 'hill', damageType: 'magic', elements: ['light'],
    dmg: 1, spa: 1, range: 1.05,
    flavor: 'Do or do not. There is no try. Also: small, green, and very annoying to hit.',
    imageQuery: 'Yoda portrait Star Wars',
    stages: [
      { from: 0, key: 'push', title: 'Force Push', attack: { aoe: 'cone', angle: 40, special: { name: 'Knockback' } } },
      { from: 3, key: 'size', title: 'Size Matters Not', attack: { aoe: 'line', width: 4, special: { name: 'Cursed (15%)', duration: 8 } } },
      { from: 6, key: 'mindtrick', title: 'Jedi Mind Trick', attack: { aoe: 'full', hits: 2, special: { name: 'Mind Control', chance: 0.25, duration: 2.5 } } },
    ],
  },
  // ------------------------------------------------------------------ Epic
  {
    id: 'x_bobross', name: 'Bob Ross', rarity: 'Epic', placement: 'hill', elements: ['rose'],
    dmg: 1, spa: 1, range: 1,
    flavor: 'There are no mistakes, only happy little accidents. And a few buffed neighbors.',
    imageQuery: 'Bob Ross portrait painter',
    stages: [
      { from: 0, key: 'brush', title: 'Happy Little Trees', attack: { aoe: 'circle', radius: 8, special: { name: 'Motivate' } } },
      { from: 2, key: 'clouds', title: 'Happy Little Clouds', attack: { aoe: 'circle', radius: 12, hits: 3, special: { name: 'Motivate' } } },
      { from: 4, key: 'canvas', title: 'Finishing Touch', attack: { aoe: 'full', special: { name: 'Motivate' } } },
    ],
  },
  {
    id: 'x_pacman', name: 'Pac-Man', rarity: 'Epic', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Waka waka waka. Eats dots, ghosts and your attention span.',
    imageQuery: 'Pac-Man arcade portrait',
    stages: [
      { from: 0, key: 'waka', title: 'Waka Waka', attack: { aoe: 'line', width: 4 } },
      { from: 2, key: 'chomp', title: 'Chomp Chain', attack: { aoe: 'line', width: 6, hits: 5 } },
      { from: 4, key: 'pellet', title: 'Power Pellet', attack: { aoe: 'circle', radius: 8, hits: 4, special: { name: 'Confused', duration: 4 } } },
    ],
  },
  {
    id: 'x_steve', name: 'Steve', rarity: 'Epic', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Punches trees for a living. Has opinions about creepers.',
    imageQuery: 'Minecraft Steve portrait',
    stages: [
      { from: 0, key: 'pickaxe', title: 'Diamond Pickaxe', attack: { aoe: 'single' } },
      { from: 2, key: 'tnt', title: 'TNT', attack: { aoe: 'circle', radius: 8, hits: 3, dot: { type: 'Burn', multiplierPerTick: 0.05, ticks: 3 } } },
      { from: 4, key: 'creeper', title: 'Creeper Blast', attack: { aoe: 'circle', radius: 13, hits: 6, special: { name: 'Knockback' } } },
    ],
  },
  {
    id: 'x_trollface', name: 'Trollface', rarity: 'Epic', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Problem? The enemies think so, and they are not sure which way is forward.',
    imageQuery: 'Trollface meme',
    stages: [
      { from: 0, key: 'umad', title: 'U Mad?', attack: { aoe: 'circle', radius: 8, special: { name: 'Mind Control', chance: 0.3, duration: 3 } } },
      { from: 2, key: 'problem', title: 'Problem?', attack: { aoe: 'cone', angle: 80, hits: 2, special: { name: 'Mind Control', chance: 0.4, duration: 3 } } },
      { from: 4, key: 'trolled', title: 'Trolled', attack: { aoe: 'circle', radius: 12, hits: 3, special: { name: 'Confused', duration: 3 } } },
    ],
  },
  // ------------------------------------------------------------------ Rare
  {
    id: 'x_minion', name: 'Minion', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Banana! Bello! Poopaye! (Mostly banana.)',
    imageQuery: 'Minion Despicable Me portrait',
    stages: [
      { from: 0, key: 'banana', title: 'Banana', attack: { aoe: 'single' } },
      { from: 3, key: 'peel', title: 'Banana Peel Bomb', attack: { aoe: 'circle', radius: 6, hits: 3, special: slow(0.4, 3) } },
    ],
  },
  {
    id: 'x_rubberduck', name: 'Rubber Duck', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Explain your problem to it and it solves itself. Squeaks when stressed.',
    imageQuery: 'rubber duck yellow bath toy portrait',
    stages: [
      { from: 0, key: 'squeak', title: 'Squeak', attack: { aoe: 'single' } },
      { from: 3, key: 'quack', title: 'Debug Quack', attack: { aoe: 'circle', radius: 6, special: { name: 'Confused', duration: 2.5 } } },
    ],
  },
  {
    id: 'x_grumpycat', name: 'Grumpy Cat', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'It was a wave. She hated it.',
    imageQuery: 'Grumpy Cat meme portrait',
    stages: [
      { from: 0, key: 'no', title: 'No.', attack: { aoe: 'single', special: slow(0.6, 3) } },
      { from: 3, key: 'stillno', title: 'Still No.', attack: { aoe: 'cone', angle: 60, hits: 2, special: slow(0.7, 4) } },
    ],
  },
];
