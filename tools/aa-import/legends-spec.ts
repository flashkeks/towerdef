/**
 * Legends of Earth (Runde 10 / P1): Quelle der 25 Promi- und Internet-Figuren in `sim/data/units/legends.json`.
 * Schreiben: `npm run legends`, pruefen: `npm run legends:check` (gleiches Werkzeug wie das Crossover: `crossover.ts --legends`).
 *
 * Nur Daten, kein Code: jede Faehigkeit ist eine Kombination aus dem Baukasten (Angriffsform, Hits, DoT, Effekte aus `sim/data/effects.json`,
 * Angriffswechsel je Stufe, Knopf-Faehigkeiten mit Buff/Muenzen/Beschwoerung). Werte: Faktoren auf die Median-Kurve der Seltenheit (`npm run crossover:vorlage`).
 *
 * Ton: Augenzwinkern, nie beleidigend. Keine Aussagen ueber Politik oder Privatleben, nur ueber das Markenzeichen (Spruch, Geste, Spiel, Stil).
 * IDs mit Praefix `p_`, Angriffs-IDs `p_<figur>:<key>`, `source: "legends"` (eigener Pool, nicht im Crossover- oder Standard-Banner).
 * `imageQuery` = Titel der Wikipedia-Seite (Bild holt die Homelab-Seite).
 *
 * Modellierungs-Naeherungen (Baukasten kennt kein Wiederaufstehen und keinen Schild fuer Verbuendete):
 *  - Schwarzenegger "I'll be back": ruft einen Terminator, der fest steht und aufhaelt, statt selbst aufzustehen.
 *  - Merkel "Raute": Buff (Schaden + Reichweite) statt Schild.
 */
import type { Figure, Special } from './crossover-spec';

const slow = (influence: number, duration?: number): Special => ({ name: 'Slow', influence, ...(duration ? { duration } : {}) });

export const LEGENDS: Figure[] = [
  // ------------------------------------------------------------------ Secret
  {
    id: 'p_trump', name: 'Donald Trump', rarity: 'Secret', placement: 'ground', critChance: 0.2,
    dmg: 1.05, spa: 1, range: 1,
    flavor: 'Tremendous damage. The best damage. Everybody says so.',
    imageQuery: 'Donald Trump',
    stages: [
      { from: 0, key: 'deal', title: 'The Art of the Deal', attack: { aoe: 'single', special: { name: 'Stun', chance: 0.4 } } },
      { from: 3, key: 'huge', title: 'Huge Impact', attack: { aoe: 'circle', radius: 12, hits: 3, special: { name: 'Knockback' } } },
      { from: 6, key: 'landslide', title: 'Landslide', attack: { aoe: 'full', hits: 4, special: slow(0.4, 4) } },
    ],
    abilities: [{ id: 'tariff', name: 'Tariff', cooldown: 50, attack: 'p_trump:tariff', scope: 'global', damageMult: 0, coins: 500 }],
    extraAttacks: { 'p_trump:tariff': { aoe: 'full', special: slow(0.45, 7) } },
  },
  {
    id: 'p_musk', name: 'Elon Musk', rarity: 'Secret', placement: 'hybrid', elements: ['fire', 'lightning'], critChance: 0.2,
    dmg: 1.05, spa: 1, range: 1.05,
    flavor: 'Launches rockets, cars and questionable ideas. Sometimes all three before breakfast.',
    imageQuery: 'Elon Musk',
    stages: [
      { from: 0, key: 'ram', title: 'Cybertruck Ram', attack: { aoe: 'line', width: 6 } },
      { from: 3, key: 'flame', title: 'Flamethrower', attack: { aoe: 'cone', angle: 70, hits: 4, dot: { type: 'Burn', multiplierPerTick: 0.05, ticks: 4 } } },
      { from: 6, key: 'starship', title: 'Starship Landing', attack: { aoe: 'circle', radius: 13, hits: 8, dot: { type: 'Burn', multiplierPerTick: 0.06, ticks: 5 } } },
    ],
    abilities: [{ id: 'launch', name: 'Rocket Launch', cooldown: 60, attack: 'p_musk:launch', scope: 'global', damageMult: 3 }],
    extraAttacks: { 'p_musk:launch': { aoe: 'full', hits: 3, dot: { type: 'Burn', multiplierPerTick: 0.05, ticks: 4 } } },
  },
  {
    id: 'p_arnold', name: 'Arnold Schwarzenegger', rarity: 'Secret', placement: 'ground', critChance: 0.3, critDamage: 2,
    dmg: 1, spa: 1, range: 1,
    flavor: 'Hasta la vista, wave. He promised he would be back, and the cooldown agrees.',
    imageQuery: 'Arnold Schwarzenegger',
    stages: [
      { from: 0, key: 'pump', title: 'Pump Action', attack: { aoe: 'single', hits: 3 } },
      { from: 3, key: 'minigun', title: 'Minigun', attack: { aoe: 'line', width: 5, hits: 10, dot: { type: 'Bleed', multiplierPerTick: 0.08, ticks: 3 } } },
      { from: 6, key: 'terminate', title: 'Terminate', attack: { aoe: 'circle', radius: 12, hits: 5, special: { name: 'Knockback' } } },
    ],
    abilities: [{ id: 'back', name: "I'll Be Back", cooldown: 60, summon: { id: 'p_terminator' }, damageMult: 0 }],
    summons: {
      p_terminator: { name: 'T-800', mode: 'walk', damageMult: 1.2, spa: 3, range: 8, attack: 'p_arnold:endo', lifetime: 0, durability: 45, blocks: true, speed: 1, maxAlive: 1 },
    },
    extraAttacks: { 'p_arnold:endo': { aoe: 'single' } },
  },
  // ------------------------------------------------------------------ Mythic
  {
    id: 'p_rock', name: 'The Rock', rarity: 'Mythic', placement: 'ground', footprint: 2, critChance: 0.2,
    dmg: 1.1, spa: 1, range: 0.95,
    flavor: 'Can you smell what the enemies are cooking? Neither can they, because they are flat.',
    imageQuery: 'Dwayne Johnson',
    stages: [
      { from: 0, key: 'eyebrow', title: 'The Eyebrow', attack: { aoe: 'single', special: { name: 'Stun', chance: 0.4 } } },
      { from: 3, key: 'elbow', title: "People's Elbow", attack: { aoe: 'circle', radius: 8, hits: 2, special: { name: 'Knockback' } } },
      { from: 6, key: 'bottom', title: 'Rock Bottom', attack: { aoe: 'circle', radius: 13, hits: 3, special: { name: 'Stun' } } },
    ],
    abilities: [{ id: 'cooking', name: "Smell What The Rock Is Cooking", cooldown: 50, selfBuff: { damagePct: 60, tempoPct: 20, durationSec: 12 }, damageMult: 0 }],
  },
  {
    id: 'p_brucelee', name: 'Bruce Lee', rarity: 'Mythic', placement: 'ground', critChance: 0.4, critDamage: 2.2,
    dmg: 0.95, spa: 0.9, range: 0.95,
    flavor: 'Be water, my friend. Be fast, be loud, and keep the nunchucks warm.',
    imageQuery: 'Bruce Lee',
    stages: [
      { from: 0, key: 'inch', title: 'One-Inch Punch', attack: { aoe: 'single', special: { name: 'Knockback' } } },
      { from: 3, key: 'nunchaku', title: 'Nunchaku Flurry', attack: { aoe: 'cone', angle: 90, hits: 6 } },
      { from: 6, key: 'dragon', title: 'Enter the Dragon', attack: { aoe: 'circle', radius: 10, hits: 10, dot: { type: 'Bleed', multiplierPerTick: 0.08, ticks: 3 } } },
    ],
    abilities: [{ id: 'water', name: 'Be Water', cooldown: 45, selfBuff: { tempoPct: 80, critPct: 20, durationSec: 8 }, damageMult: 0 }],
  },
  {
    id: 'p_einstein', name: 'Albert Einstein', rarity: 'Mythic', placement: 'hill', damageType: 'magic', elements: ['light'],
    dmg: 0.95, spa: 1, range: 1.1,
    flavor: 'Everything is relative. Especially how slowly your enemies suddenly walk.',
    imageQuery: 'Albert Einstein',
    stages: [
      { from: 0, key: 'thought', title: 'Thought Experiment', attack: { aoe: 'single', special: { name: 'Confused', duration: 3 } } },
      { from: 3, key: 'relativity', title: 'Relativity', attack: { aoe: 'circle', radius: 14, hits: 2, special: slow(0.5, 4) } },
      { from: 6, key: 'emc2', title: 'E = mc2', attack: { aoe: 'full', hits: 3, special: { name: 'Hexed (20%)' } } },
    ],
    abilities: [{ id: 'dilation', name: 'Time Dilation', cooldown: 40, attack: 'p_einstein:dilation', scope: 'global', damageMult: 0 }],
    extraAttacks: { 'p_einstein:dilation': { aoe: 'full', special: slow(0.8, 8) } },
  },
  {
    id: 'p_napoleon', name: 'Napoleon Bonaparte', rarity: 'Mythic', placement: 'hill',
    dmg: 1, spa: 1.05, range: 1.05,
    flavor: 'Short on height, long on artillery. Never met a winter he could not underestimate.',
    imageQuery: 'Napoleon',
    stages: [
      { from: 0, key: 'cannon', title: 'Grande Batterie', attack: { aoe: 'circle', radius: 8, hits: 2 } },
      { from: 3, key: 'volley', title: 'Imperial Guard Volley', attack: { aoe: 'cone', angle: 70, hits: 5 } },
      { from: 6, key: 'austerlitz', title: 'Austerlitz', attack: { aoe: 'circle', radius: 13, hits: 6, special: { name: 'Motivate' } } },
    ],
    abilities: [{ id: 'vive', name: "Vive l'Empereur", cooldown: 40, buff: { damagePct: 30, tempoPct: 15, durationSec: 20, radius: 30, self: false }, damageMult: 0 }],
  },
  {
    id: 'p_merkel', name: 'Angela Merkel', rarity: 'Mythic', placement: 'hill', damageType: 'magic',
    dmg: 0.9, spa: 1, range: 1.05,
    flavor: 'Hands in a diamond, nerves of steel. The wave calms down all by itself.',
    imageQuery: 'Angela Merkel',
    stages: [
      { from: 0, key: 'raute', title: 'The Rhombus', attack: { aoe: 'circle', radius: 10, special: { name: 'Motivate' } } },
      { from: 3, key: 'together', title: 'We Can Do This', attack: { aoe: 'circle', radius: 14, hits: 2, special: [{ name: 'Motivate' }, slow(0.4, 3)] } },
      { from: 6, key: 'calm', title: 'Chancellor Calm', attack: { aoe: 'full', hits: 2, special: [{ name: 'Motivate' }, slow(0.5, 4)] } },
    ],
    abilities: [{ id: 'rhombus', name: 'Rhombus Stability', cooldown: 45, buff: { damagePct: 15, rangePct: 15, durationSec: 25 }, damageMult: 0 }],
  },
  // ------------------------------------------------------------------ Legendary
  {
    id: 'p_obama', name: 'Barack Obama', rarity: 'Legendary', placement: 'hill', damageType: 'magic',
    dmg: 0.95, spa: 1, range: 1.05,
    flavor: 'Yes we can. Also yes, he can drop the mic from this range.',
    imageQuery: 'Barack Obama',
    stages: [
      { from: 0, key: 'speech', title: 'Campaign Speech', attack: { aoe: 'circle', radius: 8, special: { name: 'Motivate' } } },
      { from: 3, key: 'mic', title: 'Mic Drop', attack: { aoe: 'circle', radius: 10, hits: 2, special: { name: 'Stun', duration: 1.5 } } },
      { from: 6, key: 'hope', title: 'Hope', attack: { aoe: 'full', special: { name: 'Motivate' } } },
    ],
    abilities: [{ id: 'yeswecan', name: 'Yes We Can', cooldown: 45, buff: { damagePct: 25, durationSec: 15 }, damageMult: 0 }],
  },
  {
    id: 'p_zuckerberg', name: 'Mark Zuckerberg', rarity: 'Legendary', placement: 'hybrid', damageType: 'magic', elements: ['water'],
    dmg: 1, spa: 1, range: 1,
    flavor: 'Connects everyone. Enemies included, into one conveniently clustered group.',
    imageQuery: 'Mark Zuckerberg',
    stages: [
      { from: 0, key: 'poke', title: 'Poke', attack: { aoe: 'single', special: { name: 'Unconscious', duration: 1 } } },
      { from: 3, key: 'feed', title: 'News Feed', attack: { aoe: 'circle', radius: 9, hits: 3, special: { name: 'Mind Control', chance: 0.3, duration: 2.5 } } },
      { from: 6, key: 'metaverse', title: 'Metaverse Rift', attack: { aoe: 'circle', radius: 12, hits: 5, special: { name: 'Confused', duration: 4 } } },
    ],
  },
  {
    id: 'p_bezos', name: 'Jeff Bezos', rarity: 'Legendary', placement: 'ground', critChance: 0.1,
    dmg: 1, spa: 1, range: 1,
    flavor: 'Prime delivery: your enemies arrive in two days, your coins in two seconds.',
    imageQuery: 'Jeff Bezos',
    stages: [
      { from: 0, key: 'package', title: 'Same-Day Package', attack: { aoe: 'single', hits: 2 } },
      { from: 3, key: 'drones', title: 'Drone Delivery', attack: { aoe: 'circle', radius: 8, hits: 5 } },
      { from: 6, key: 'blueorigin', title: 'Blue Origin', attack: { aoe: 'line', width: 6, hits: 8 } },
    ],
    abilities: [{ id: 'prime', name: 'Prime Delivery', cooldown: 40, coins: 600, damageMult: 0 }],
  },
  {
    id: 'p_snoop', name: 'Snoop Dogg', rarity: 'Legendary', placement: 'ground', elements: ['air'],
    dmg: 0.95, spa: 1, range: 1,
    flavor: 'Smooth moves, smoother flow. The enemies are in no hurry anymore.',
    imageQuery: 'Snoop Dogg',
    stages: [
      { from: 0, key: 'drop', title: "Drop It Like It's Hot", attack: { aoe: 'circle', radius: 7, dot: { type: 'Burn', multiplierPerTick: 0.04, ticks: 3 } } },
      { from: 3, key: 'chill', title: 'Mellow Cloud', attack: { aoe: 'circle', radius: 12, hits: 2, special: slow(0.6, 4) } },
      { from: 6, key: 'ginjuice', title: 'Smooth Groove', attack: { aoe: 'full', hits: 4, special: [slow(0.5, 4), { name: 'Confused', duration: 3 }] } },
    ],
    aura: { critPct: 10, damagePct: 8, radius: 22 },
  },
  {
    id: 'p_ramsay', name: 'Gordon Ramsay', rarity: 'Legendary', placement: 'ground', elements: ['fire'], critChance: 0.25,
    dmg: 1.05, spa: 1, range: 0.95,
    flavor: 'The enemies are RAW. The lanes are a disaster. Everything is on fire, including the sauce.',
    imageQuery: 'Gordon Ramsay',
    stages: [
      { from: 0, key: 'raw', title: "It's RAW!", attack: { aoe: 'single', hits: 2 } },
      { from: 3, key: 'flambe', title: 'Flambe', attack: { aoe: 'cone', angle: 70, hits: 4, dot: { type: 'Burn', multiplierPerTick: 0.06, ticks: 4 } } },
      { from: 6, key: 'nightmare', title: 'Kitchen Nightmare', attack: { aoe: 'circle', radius: 12, hits: 6, dot: { type: 'Burn', multiplierPerTick: 0.07, ticks: 5 } } },
    ],
    abilities: [{ id: 'hellskitchen', name: "Hell's Kitchen", cooldown: 40, attack: 'p_ramsay:hells', damageMult: 2 }],
    extraAttacks: { 'p_ramsay:hells': { aoe: 'circle', radius: 14, hits: 4, dot: { type: 'Burn', multiplierPerTick: 0.08, ticks: 5 } } },
  },
  {
    id: 'p_ronaldo', name: 'Cristiano Ronaldo', rarity: 'Legendary', placement: 'ground', hitsAir: true, critChance: 0.3,
    dmg: 1.05, spa: 1, range: 1,
    flavor: 'Jumps higher than the ball, celebrates louder than the stadium.',
    imageQuery: 'Cristiano Ronaldo',
    stages: [
      { from: 0, key: 'freekick', title: 'Free Kick', attack: { aoe: 'line', width: 3 } },
      { from: 3, key: 'bicycle', title: 'Bicycle Kick', attack: { aoe: 'circle', radius: 6, hits: 3, special: { name: 'Knockback' } } },
      { from: 6, key: 'siu', title: 'SIUUU!', attack: { aoe: 'circle', radius: 12, hits: 6, special: { name: 'Stun' } } },
    ],
    abilities: [{ id: 'siu', name: 'SIUUU!', cooldown: 40, selfBuff: { damagePct: 40, critPct: 40, durationSec: 10 }, damageMult: 0 }],
  },
  {
    id: 'p_messi', name: 'Lionel Messi', rarity: 'Legendary', placement: 'ground', critChance: 0.2,
    dmg: 1, spa: 0.95, range: 1,
    flavor: 'Small, calm, unstoppable. The defenders are still looking for the ball.',
    imageQuery: 'Lionel Messi',
    stages: [
      { from: 0, key: 'dribble', title: 'Dribble', attack: { aoe: 'single', hits: 4 } },
      { from: 3, key: 'nutmeg', title: 'Nutmeg', attack: { aoe: 'cone', angle: 60, hits: 3, special: { name: 'Confused', duration: 3 } } },
      { from: 6, key: 'worldcup', title: 'World Cup Strike', attack: { aoe: 'line', width: 5, hits: 10 } },
    ],
    abilities: [{ id: 'goat', name: 'The Goat', cooldown: 45, selfBuff: { tempoPct: 60, damagePct: 20, durationSec: 10 }, damageMult: 0 }],
  },
  // ------------------------------------------------------------------ Epic
  {
    id: 'p_mrbeast', name: 'MrBeast', rarity: 'Epic', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Last one standing wins one million coins. You are the coins.',
    imageQuery: 'MrBeast',
    stages: [
      { from: 0, key: 'challenge', title: 'Last To Leave', attack: { aoe: 'single' } },
      { from: 2, key: 'giveaway', title: 'Giveaway', attack: { aoe: 'circle', radius: 8, hits: 3 } },
      { from: 4, key: 'island', title: 'Private Island Finale', attack: { aoe: 'circle', radius: 12, hits: 5, special: slow(0.4, 3) } },
    ],
    abilities: [{ id: 'giveaway', name: 'Gold Rain', cooldown: 25, coins: 180, damageMult: 0 }],
  },
  {
    id: 'p_pewdiepie', name: 'PewDiePie', rarity: 'Epic', placement: 'hill',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Brofist to the front row. The chair stays in the room, the enemies do not.',
    imageQuery: 'PewDiePie',
    stages: [
      { from: 0, key: 'brofist', title: 'Brofist', attack: { aoe: 'single' } },
      { from: 2, key: 'subscribe', title: 'Subscribe!', attack: { aoe: 'circle', radius: 8, hits: 2, special: { name: 'Mind Control', chance: 0.3, duration: 3 } } },
      { from: 4, key: 'army', title: 'Bro Army', attack: { aoe: 'circle', radius: 12, hits: 4, special: { name: 'Motivate' } } },
    ],
    abilities: [{ id: 'bros', name: 'Bro Army', cooldown: 40, buff: { damagePct: 15, durationSec: 15, radius: 22 }, damageMult: 0 }],
  },
  {
    id: 'p_swift', name: 'Taylor Swift', rarity: 'Epic', placement: 'hill', damageType: 'magic', elements: ['rose'],
    dmg: 1, spa: 1, range: 1.05,
    flavor: 'Every era hits harder than the last. Her fans handle the logistics.',
    imageQuery: 'Taylor Swift',
    stages: [
      { from: 0, key: 'shake', title: 'Shake It Off', attack: { aoe: 'circle', radius: 8, special: slow(0.4, 3) } },
      { from: 2, key: 'blood', title: 'Bad Blood', attack: { aoe: 'cone', angle: 70, hits: 3, special: { name: 'Cursed (15%)', duration: 8 } } },
      { from: 4, key: 'eras', title: 'Eras Tour', attack: { aoe: 'circle', radius: 12, hits: 6, special: { name: 'Motivate' } } },
    ],
    abilities: [{ id: 'eras', name: 'Eras Tour', cooldown: 50, buff: { tempoPct: 20, damagePct: 10, durationSec: 20 }, damageMult: 0 }],
  },
  {
    id: 'p_jackie', name: 'Jackie Chan', rarity: 'Epic', placement: 'ground', critChance: 0.2,
    dmg: 1, spa: 0.95, range: 1,
    flavor: 'Does his own stunts. Uses the ladder, the umbrella and a suspicious amount of furniture.',
    imageQuery: 'Jackie Chan',
    stages: [
      { from: 0, key: 'ladder', title: 'Ladder Fu', attack: { aoe: 'cone', angle: 70, hits: 3 } },
      { from: 2, key: 'umbrella', title: 'Umbrella Spin', attack: { aoe: 'circle', radius: 6, hits: 4, special: { name: 'Knockback' } } },
      { from: 4, key: 'police', title: 'Police Story', attack: { aoe: 'circle', radius: 10, hits: 6, special: { name: 'Stun', duration: 1.5 } } },
    ],
  },
  {
    id: 'p_gates', name: 'Bill Gates', rarity: 'Epic', placement: 'hill', damageType: 'magic',
    dmg: 1, spa: 1, range: 1.05,
    flavor: 'Restarts your enemies. Please do not turn off your computer during the update.',
    imageQuery: 'Bill Gates',
    stages: [
      { from: 0, key: 'bluescreen', title: 'Blue Screen', attack: { aoe: 'single', special: { name: 'Stun', duration: 1.5 } } },
      { from: 2, key: 'update', title: 'Forced Update', attack: { aoe: 'circle', radius: 8, hits: 2, special: slow(0.6, 4) } },
      { from: 4, key: 'cad', title: 'Ctrl+Alt+Delete', attack: { aoe: 'circle', radius: 12, hits: 3, special: { name: 'Stun' } } },
    ],
    abilities: [{ id: 'reboot', name: 'Reboot', cooldown: 55, attack: 'p_gates:reboot', scope: 'global', damageMult: 0 }],
    extraAttacks: { 'p_gates:reboot': { aoe: 'full', special: { name: 'Stun', duration: 2.5 } } },
  },
  // ------------------------------------------------------------------ Rare
  {
    id: 'p_bohlen', name: 'Dieter Bohlen', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'The verdict is in, and it is a very short one.',
    imageQuery: 'Dieter Bohlen',
    stages: [
      { from: 0, key: 'verdict', title: 'Harsh Verdict', attack: { aoe: 'single', special: { name: 'Stun', chance: 0.3 } } },
      { from: 3, key: 'combo', title: 'Pop Titan Combo', attack: { aoe: 'circle', radius: 6, hits: 3, special: { name: 'Confused', duration: 2.5 } } },
    ],
  },
  {
    id: 'p_knossi', name: 'Knossi', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Streams, laughs and survives every party. His chat is a second army.',
    imageQuery: 'Knossi',
    stages: [
      { from: 0, key: 'party', title: 'Party Stream', attack: { aoe: 'single' } },
      { from: 3, key: 'cheers', title: 'Cheers, Chat!', attack: { aoe: 'circle', radius: 6, hits: 2, special: slow(0.4, 3) } },
    ],
  },
  {
    id: 'p_montana', name: 'MontanaBlack', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Plays, rages, wins. The keyboard is sometimes a casualty.',
    imageQuery: 'MontanaBlack',
    stages: [
      { from: 0, key: 'tilt', title: 'Tilt', attack: { aoe: 'single', hits: 2 } },
      { from: 3, key: 'rage', title: 'Rage Quit', attack: { aoe: 'circle', radius: 6, hits: 3, special: { name: 'Knockback' } } },
    ],
  },
  {
    id: 'p_irwin', name: 'Steve Irwin', rarity: 'Rare', placement: 'ground',
    dmg: 1, spa: 1, range: 1,
    flavor: 'Crikey! Isn\'t she a beauty? Even the grumpiest beast on the lane calms down.',
    imageQuery: 'Steve Irwin',
    stages: [
      { from: 0, key: 'crikey', title: 'Crikey!', attack: { aoe: 'single' } },
      { from: 3, key: 'wrangle', title: 'Croc Wrangle', attack: { aoe: 'circle', radius: 6, hits: 2, special: slow(0.6, 3) } },
    ],
  },
  {
    id: 'p_budspencer', name: 'Bud Spencer', rarity: 'Rare', placement: 'ground', footprint: 2,
    dmg: 1.05, spa: 1.05, range: 0.95,
    flavor: 'Two slow slaps and a tray of beans. The brawl is over before it started.',
    imageQuery: 'Bud Spencer',
    stages: [
      { from: 0, key: 'slap', title: 'Double Slap', attack: { aoe: 'single', special: { name: 'Knockback' } } },
      { from: 3, key: 'brawl', title: 'Saloon Brawl', attack: { aoe: 'circle', radius: 6, hits: 3, special: { name: 'Stun', chance: 0.4 } } },
    ],
  },
];
