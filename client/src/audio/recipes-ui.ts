/**
 * Menue-Klaenge, Beschwoer-Klaenge und Menue-Musik (Runde 10, P3). Wie `recipes.ts` alles eigene WebAudio-Synthese (keine Dateien, siehe
 * `assets/ATTRIBUTIONS.md`), reine Daten. Liegt bewusst in einer eigenen Datei neben `recipes.ts`, damit die Match-Klaenge (P2) und diese
 * hier beim Zusammenfuehren nicht in derselben Tabelle landen. `engine.ts` spielt sie ueber `playUi`/`playVoices`.
 * Tauschen sich spaeter gegen Kenney-Dateien aus (Wunschliste in STATUS), dann nur hier und in `engine.ts` anfassen.
 */
import type { Voice } from './recipes';

export type UiSoundId =
  | 'ui.hover'
  | 'ui.click'
  | 'ui.back'
  | 'ui.open'
  | 'ui.tick'
  | 'ui.coin'
  | 'ui.claim'
  | 'ui.buy'
  | 'ui.levelup'
  | 'ui.evolve'
  | 'ui.unlock'
  | 'ui.good'
  | 'ui.bad'
  | 'summon.rumble'
  | 'summon.burst'
  | 'card.flip'
  | 'reveal.rare'
  | 'reveal.epic'
  | 'reveal.legendary'
  | 'reveal.mythic'
  | 'reveal.secret'
  | 'reveal.exclusive'
  | 'stinger.mythic'
  | 'stinger.secret'
  | 'reveal.new'
  | 'reveal.shiny'
  | 'reveal.done';

/** Hilfe: Akkord aus Tonhoehen als gestaffelte Stimmen. */
const chord = (hz: number[], wave: Voice['wave'], dur: number, vol: number, gap = 0, delay = 0, lp?: number): Voice[] =>
  hz.map((f, i) => ({ wave, f0: f, f1: f, dur, vol, delay: delay + i * gap, ...(lp ? { lp } : {}) }));

export const UI_RECIPES: Record<UiSoundId, Voice[]> = {
  'ui.hover': [{ wave: 'sine', f0: 1180, f1: 1500, dur: 0.05, vol: 0.05 }],
  'ui.click': [
    { wave: 'triangle', f0: 760, f1: 480, dur: 0.07, vol: 0.14 },
    { wave: 'noise', f0: 4200, f1: 1500, dur: 0.03, vol: 0.07 },
  ],
  'ui.back': [{ wave: 'triangle', f0: 560, f1: 360, dur: 0.1, vol: 0.13 }],
  'ui.open': [
    { wave: 'noise', f0: 500, f1: 3200, dur: 0.2, vol: 0.09, attack: 0.05 },
    { wave: 'triangle', f0: 392, f1: 660, dur: 0.16, vol: 0.1 },
  ],
  'ui.tick': [{ wave: 'square', f0: 1900, f1: 1700, dur: 0.02, vol: 0.04, lp: 4000 }],
  'ui.coin': [
    { wave: 'triangle', f0: 1568, f1: 1568, dur: 0.07, vol: 0.18 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.24, vol: 0.18, delay: 0.07 },
    { wave: 'sine', f0: 4186, f1: 4186, dur: 0.18, vol: 0.05, delay: 0.07 },
  ],
  'ui.claim': [...chord([523, 659, 784, 1047], 'triangle', 0.18, 0.2, 0.07), { wave: 'sine', f0: 2093, f1: 2093, dur: 0.4, vol: 0.08, delay: 0.28 }],
  'ui.buy': [
    { wave: 'square', f0: 330, f1: 330, dur: 0.06, vol: 0.14, lp: 2200 },
    { wave: 'triangle', f0: 1568, f1: 1568, dur: 0.08, vol: 0.18, delay: 0.06 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.26, vol: 0.18, delay: 0.14 },
  ],
  'ui.levelup': [
    ...chord([523, 659, 784, 1047], 'square', 0.12, 0.17, 0.09, 0, 3200),
    { wave: 'triangle', f0: 1047, f1: 1047, dur: 0.6, vol: 0.2, delay: 0.36 },
    { wave: 'triangle', f0: 262, f1: 262, dur: 0.7, vol: 0.18, delay: 0.36 },
    { wave: 'sine', f0: 3136, f1: 3136, dur: 0.5, vol: 0.06, delay: 0.4, vibHz: 12, vibSemi: 0.6 },
  ],
  'ui.evolve': [
    { wave: 'sawtooth', f0: 160, f1: 1400, dur: 0.95, vol: 0.18, lp: 2400, attack: 0.1 },
    { wave: 'sine', f0: 400, f1: 3200, dur: 0.95, vol: 0.1, vibHz: 14, vibSemi: 0.8 },
    { wave: 'noise', f0: 600, f1: 7000, dur: 0.9, vol: 0.12, attack: 0.2 },
    ...chord([392, 523, 659, 784], 'triangle', 0.9, 0.2, 0.0, 0.95),
    { wave: 'sine', f0: 1568, f1: 1568, dur: 0.9, vol: 0.1, delay: 0.95, vibHz: 6, vibSemi: 0.3 },
  ],
  'ui.unlock': [
    { wave: 'noise', f0: 5000, f1: 900, dur: 0.07, vol: 0.2 },
    { wave: 'square', f0: 220, f1: 220, dur: 0.07, vol: 0.14, lp: 1200, delay: 0.04 },
    ...chord([784, 988, 1319], 'triangle', 0.3, 0.17, 0.09, 0.14),
    { wave: 'sine', f0: 2637, f1: 2637, dur: 0.4, vol: 0.06, delay: 0.3 },
  ],
  'ui.good': [...chord([659, 880], 'triangle', 0.14, 0.17, 0.09)],
  'ui.bad': [
    { wave: 'square', f0: 190, f1: 130, dur: 0.12, vol: 0.14, lp: 900 },
    { wave: 'square', f0: 150, f1: 100, dur: 0.14, vol: 0.12, delay: 0.1, lp: 900 },
  ],
  'summon.rumble': [
    { wave: 'sawtooth', f0: 58, f1: 42, dur: 0.9, vol: 0.2, lp: 180, attack: 0.1 },
    { wave: 'noise', f0: 260, f1: 90, dur: 0.8, vol: 0.14, attack: 0.1 },
  ],
  'summon.burst': [
    { wave: 'noise', f0: 9000, f1: 400, dur: 0.6, vol: 0.34 },
    { wave: 'sine', f0: 140, f1: 38, dur: 0.5, vol: 0.4 },
    { wave: 'triangle', f0: 1200, f1: 2400, dur: 0.3, vol: 0.12, delay: 0.02 },
  ],
  'card.flip': [
    { wave: 'noise', f0: 2400, f1: 7000, dur: 0.09, vol: 0.12 },
    { wave: 'triangle', f0: 520, f1: 940, dur: 0.07, vol: 0.12 },
  ],
  'reveal.rare': [...chord([659, 784], 'triangle', 0.22, 0.2, 0.08)],
  'reveal.epic': [
    ...chord([523, 659, 784], 'triangle', 0.24, 0.2, 0.07),
    { wave: 'sine', f0: 2093, f1: 2093, dur: 0.4, vol: 0.08, delay: 0.2, vibHz: 10, vibSemi: 0.5 },
  ],
  'reveal.legendary': [
    ...chord([392, 523, 659, 784, 1047], 'sawtooth', 0.4, 0.14, 0.07, 0, 2600),
    { wave: 'triangle', f0: 196, f1: 196, dur: 0.9, vol: 0.22, delay: 0.1 },
    { wave: 'sine', f0: 3136, f1: 3136, dur: 0.7, vol: 0.07, delay: 0.3, vibHz: 12, vibSemi: 0.6 },
    { wave: 'noise', f0: 6000, f1: 1200, dur: 0.4, vol: 0.12 },
  ],
  'reveal.mythic': [
    ...chord([294, 392, 494, 587, 784], 'sawtooth', 0.7, 0.14, 0.06, 0, 2200),
    { wave: 'sawtooth', f0: 98, f1: 98, dur: 1.2, vol: 0.2, lp: 400, delay: 0.05 },
    { wave: 'triangle', f0: 1175, f1: 1568, dur: 0.9, vol: 0.12, delay: 0.3, vibHz: 7, vibSemi: 0.4 },
    { wave: 'noise', f0: 7000, f1: 800, dur: 0.6, vol: 0.18 },
  ],
  'reveal.secret': [
    ...chord([262, 330, 392, 523, 659, 784, 1047, 1319], 'triangle', 0.9, 0.16, 0.08, 0),
    { wave: 'sawtooth', f0: 65, f1: 65, dur: 1.6, vol: 0.22, lp: 300 },
    { wave: 'sine', f0: 2093, f1: 4186, dur: 1.2, vol: 0.08, delay: 0.5, vibHz: 16, vibSemi: 1 },
    { wave: 'noise', f0: 9000, f1: 600, dur: 0.9, vol: 0.2 },
  ],
  'reveal.exclusive': [...chord([440, 554, 659, 880], 'triangle', 0.5, 0.18, 0.08), { wave: 'sine', f0: 1760, f1: 1760, dur: 0.6, vol: 0.08, delay: 0.3 }],
  'stinger.mythic': [
    { wave: 'sawtooth', f0: 73, f1: 36, dur: 1.4, vol: 0.34, lp: 260 },
    { wave: 'sine', f0: 55, f1: 28, dur: 1.2, vol: 0.4 },
    ...chord([196, 247, 294], 'square', 1.0, 0.07, 0.0, 0.06, 900),
    { wave: 'noise', f0: 3000, f1: 100, dur: 1.1, vol: 0.2 },
  ],
  'stinger.secret': [
    { wave: 'sine', f0: 50, f1: 24, dur: 1.8, vol: 0.5 },
    { wave: 'sawtooth', f0: 98, f1: 49, dur: 1.8, vol: 0.28, lp: 320 },
    ...chord([196, 247, 294, 392, 494], 'sawtooth', 1.4, 0.07, 0.0, 0.08, 1100),
    ...[1319, 1568, 1976, 2349, 2637, 3136].map((f, i): Voice => ({ wave: 'sine', f0: f, f1: f, dur: 0.5, vol: 0.07, delay: 0.5 + i * 0.1 })),
    { wave: 'noise', f0: 9000, f1: 200, dur: 1.4, vol: 0.28 },
  ],
  'reveal.new': [
    { wave: 'triangle', f0: 1319, f1: 1319, dur: 0.07, vol: 0.18 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.2, vol: 0.18, delay: 0.07 },
  ],
  'reveal.shiny': Array.from({ length: 9 }, (_, i): Voice => ({ wave: 'sine', f0: 2600 + ((i * 937) % 2400), f1: 3800 + ((i * 613) % 2200), dur: 0.14, vol: 0.06, delay: i * 0.055 })),
  'reveal.done': [{ wave: 'triangle', f0: 523, f1: 784, dur: 0.12, vol: 0.14 }],
};

export const UI_SOUND_IDS = Object.keys(UI_RECIPES) as UiSoundId[];
export const isUiSound = (id: string): id is UiSoundId => id in UI_RECIPES;

/** Mindestabstand je Menue-Klang (ms), damit Hover-Wellen und Zaehler nicht knattern. */
export const UI_GAP_MS: Partial<Record<UiSoundId, number>> = { 'ui.hover': 70, 'ui.tick': 48, 'ui.click': 40, 'card.flip': 60, 'ui.coin': 90 };

/**
 * Aufstieg des Beschwoer-Aufbaus: ein Sweep ueber die ganze Vorlaufzeit, dazu je Farbstufe (Blau, Lila, Gold, Regenbogen) ein hoeherer Ton.
 * `stages` = Anzahl der Farbstufen bis zur besten Seltenheit, `ms` = Vorlaufzeit. Die Stimmen sind dynamisch, daher kein festes Rezept.
 */
export function chargeVoices(stages: number, ms: number): Voice[] {
  const dur = Math.max(0.5, ms / 1000);
  const out: Voice[] = [
    { wave: 'sawtooth', f0: 90, f1: 90 * (2 + stages), dur, vol: 0.12, lp: 900 + stages * 500, attack: dur * 0.5 },
    { wave: 'sine', f0: 300, f1: 300 * (3 + stages), dur, vol: 0.09, attack: dur * 0.4, vibHz: 7 + stages * 3, vibSemi: 0.5 },
    { wave: 'noise', f0: 400, f1: 4000 + stages * 1500, dur, vol: 0.09, attack: dur * 0.6 },
  ];
  const step = (dur * 0.8) / Math.max(1, stages);
  const base = [392, 494, 587, 784, 988];
  for (let i = 0; i < stages; i++) out.push({ wave: 'triangle', f0: base[i] ?? 988, f1: base[i] ?? 988, dur: 0.28, vol: 0.14 + i * 0.015, delay: dur * 0.12 + i * step });
  return out;
}

// ---- Menue-Musik -------------------------------------------------------------------------------------------------------

export interface MusicTheme {
  bpm: number;
  rootHz: number;
  /** Grundton je Takt (Halbtoene) */
  bass: readonly number[];
  /** Akkordtoene je Takt (relativ zum Bass), Arpeggio ueber 8 Achtel */
  chords: readonly (readonly number[])[];
  pattern: readonly number[];
  /** Klangfarbe des Arpeggios und seine Lautstaerke (Menue leiser und weicher als im Match) */
  arpWave: OscillatorType;
  arpVol: number;
  arpLp: number;
  /** Halbtonspruenge fuer das Arpeggio (Oktave hoch) */
  arpOct: number;
  /** weiche Flaeche pro Takt: Lautstaerke */
  padVol: number;
  /** Optional (Runde 12b): Melodie je Takt, 8 Achtel, Halbtoene ueber `rootHz` (null = Pause) */
  lead?: readonly (readonly (number | null)[])[];
  leadWave?: OscillatorType;
  leadVol?: number;
  leadLp?: number;
  /** Bass: Wellenform, Lautstaerke, Tiefpass; `bounce` = zweiter Basston (Quinte) auf Achtel 4 */
  bassWave?: OscillatorType;
  bassVol?: number;
  bassLp?: number;
  bounce?: boolean;
  /** leises Hi-Hat auf den Achtel-Zwischenschlaegen: Lautstaerke (0 = aus) */
  hatVol?: number;
}

const ARP = [0, 1, 2, 3, 2, 1, 2, 3] as const;

/** Je Bildschirm eine Stimmung. Alle ruhig, in D bzw. F, 60 bis 76 BPM. */
export const MENU_THEMES = {
  /** Lobby, Einstellungen, Credits (Runde 12b): hell, Dur, beschwingt. C-Dur I-V-vi-IV, 108 BPM, Glockenspiel-Melodie ueber leichtem Bass */
  dusk: {
    bpm: 108, rootHz: 261.6, bass: [0, -5, -3, -7],
    chords: [[0, 4, 7, 12], [0, 4, 7, 11], [0, 3, 7, 12], [0, 4, 7, 12]],
    pattern: ARP, arpWave: 'sine', arpVol: 0.012, arpLp: 3200, arpOct: 12, padVol: 0.03,
    lead: [
      [16, null, 19, 16, 24, null, 19, 16],
      [14, null, 19, 14, 23, null, 19, 14],
      [16, null, 21, 16, 24, null, 21, 19],
      [17, 21, 24, 21, 17, null, 19, null],
    ],
    leadWave: 'square', leadVol: 0.03, leadLp: 3600,
    bassWave: 'triangle', bassVol: 0.04, bassLp: 700, bounce: true, hatVol: 0.012,
  },
  /** Summon: geheimnisvoll, langsam, hohe Glocken */
  arcane: { bpm: 56, rootHz: 87.3, bass: [0, -2, -4, -5], chords: [[0, 7, 12, 15], [0, 6, 12, 15], [0, 7, 11, 15], [0, 7, 10, 14]], pattern: [0, 2, 1, 3, 2, 3, 1, 2], arpWave: 'sine', arpVol: 0.07, arpLp: 3200, arpOct: 24, padVol: 0.1 },
  /** Welt, Stage, Units, Team: etwas Schwung */
  march: { bpm: 76, rootHz: 110, bass: [0, 0, -4, -2], chords: [[0, 7, 12, 15], [0, 7, 12, 15], [0, 7, 12, 16], [0, 7, 12, 14]], pattern: [0, 1, 2, 1, 3, 2, 1, 2], arpWave: 'triangle', arpVol: 0.055, arpLp: 1800, arpOct: 12, padVol: 0.07 },
  /** Shops: freundlich, hell */
  bazaar: { bpm: 72, rootHz: 130.8, bass: [0, 5, 7, 5], chords: [[0, 4, 7, 12], [0, 4, 7, 12], [0, 4, 7, 11], [0, 4, 7, 12]], pattern: ARP, arpWave: 'triangle', arpVol: 0.05, arpLp: 2200, arpOct: 12, padVol: 0.07 },
} as const satisfies Record<string, MusicTheme>;
export type MenuThemeId = keyof typeof MENU_THEMES;
