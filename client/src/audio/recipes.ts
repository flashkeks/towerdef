/**
 * Klang-Rezepte (alles eigen, zur Laufzeit synthetisiert, sfxr-artig): Oszillator oder Rauschen, Frequenzlauf, Huellkurve.
 * Reine Daten; `engine.ts` baut daraus Audio-Knoten. Mehrere Stimmen je Klang werden uebereinander gelegt.
 */
import type { SoundId } from './logic';

export interface Voice {
  wave: 'square' | 'sawtooth' | 'triangle' | 'sine' | 'noise';
  /** Start- und Endfrequenz (Hz), exponentieller Lauf. Bei Rauschen: Filterfrequenz. */
  f0: number;
  f1: number;
  /** Dauer in Sekunden */
  dur: number;
  /** Spitzenlautstaerke 0..1 */
  vol: number;
  /** Einschwingzeit (s), Standard 0.004 */
  attack?: number;
  /** Start-Verzoegerung (s) */
  delay?: number;
  /** Tiefpass (Hz) fuer weichere Klaenge */
  lp?: number;
  /** Vibrato: Frequenz Hz und Tiefe in Halbtoenen */
  vibHz?: number;
  vibSemi?: number;
}

export const RECIPES: Record<SoundId, Voice[]> = {
  place: [
    { wave: 'square', f0: 220, f1: 330, dur: 0.09, vol: 0.22, lp: 2400 },
    { wave: 'noise', f0: 900, f1: 300, dur: 0.07, vol: 0.2, delay: 0.0 },
    { wave: 'triangle', f0: 440, f1: 660, dur: 0.12, vol: 0.2, delay: 0.07 },
  ],
  upgrade: [
    { wave: 'square', f0: 392, f1: 392, dur: 0.08, vol: 0.2, lp: 3000 },
    { wave: 'square', f0: 523, f1: 523, dur: 0.08, vol: 0.2, delay: 0.08, lp: 3000 },
    { wave: 'square', f0: 784, f1: 784, dur: 0.16, vol: 0.22, delay: 0.16, lp: 3000 },
    { wave: 'sine', f0: 1568, f1: 1568, dur: 0.2, vol: 0.1, delay: 0.16 },
  ],
  sell: [
    { wave: 'triangle', f0: 1320, f1: 1320, dur: 0.06, vol: 0.22 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.1, vol: 0.22, delay: 0.06 },
    { wave: 'triangle', f0: 880, f1: 660, dur: 0.14, vol: 0.12, delay: 0.1 },
  ],
  error: [
    { wave: 'square', f0: 150, f1: 110, dur: 0.14, vol: 0.2, lp: 900 },
    { wave: 'square', f0: 140, f1: 90, dur: 0.14, vol: 0.18, delay: 0.1, lp: 900 },
  ],
  'hit.slash': [
    { wave: 'noise', f0: 5200, f1: 1800, dur: 0.09, vol: 0.2 },
    { wave: 'sawtooth', f0: 520, f1: 180, dur: 0.07, vol: 0.12, lp: 1600 },
  ],
  'hit.tracer': [
    { wave: 'square', f0: 1700, f1: 380, dur: 0.06, vol: 0.14, lp: 4200 },
    { wave: 'noise', f0: 3000, f1: 1200, dur: 0.04, vol: 0.1 },
  ],
  'hit.shell': [
    { wave: 'sawtooth', f0: 180, f1: 45, dur: 0.22, vol: 0.28, lp: 700 },
    { wave: 'noise', f0: 1400, f1: 200, dur: 0.2, vol: 0.22, delay: 0.02 },
  ],
  'hit.bolt': [
    { wave: 'square', f0: 880, f1: 330, dur: 0.08, vol: 0.14, lp: 3200 },
    { wave: 'sine', f0: 200, f1: 100, dur: 0.07, vol: 0.14 },
  ],
  'hit.blast': [
    { wave: 'noise', f0: 1500, f1: 160, dur: 0.24, vol: 0.28 },
    { wave: 'sawtooth', f0: 150, f1: 50, dur: 0.2, vol: 0.2, lp: 600 },
  ],
  'hit.cone': [
    { wave: 'noise', f0: 7000, f1: 2500, dur: 0.18, vol: 0.14 },
    { wave: 'sine', f0: 1900, f1: 2600, dur: 0.16, vol: 0.12, vibHz: 24, vibSemi: 1.2 },
  ],
  'hit.line': [
    { wave: 'sawtooth', f0: 1200, f1: 300, dur: 0.14, vol: 0.14, lp: 2600 },
    { wave: 'sine', f0: 2200, f1: 600, dur: 0.12, vol: 0.1 },
  ],
  kill: [
    { wave: 'square', f0: 988, f1: 988, dur: 0.05, vol: 0.14, lp: 3600 },
    { wave: 'square', f0: 1319, f1: 1319, dur: 0.09, vol: 0.14, delay: 0.05, lp: 3600 },
  ],
  leak: [
    { wave: 'sawtooth', f0: 220, f1: 70, dur: 0.38, vol: 0.34, lp: 900 },
    { wave: 'square', f0: 110, f1: 55, dur: 0.38, vol: 0.22, lp: 500 },
    { wave: 'noise', f0: 600, f1: 120, dur: 0.3, vol: 0.18 },
  ],
  wave: [
    { wave: 'triangle', f0: 196, f1: 196, dur: 0.18, vol: 0.3 },
    { wave: 'triangle', f0: 294, f1: 294, dur: 0.18, vol: 0.28, delay: 0.16 },
    { wave: 'triangle', f0: 392, f1: 392, dur: 0.32, vol: 0.3, delay: 0.32 },
    { wave: 'noise', f0: 500, f1: 200, dur: 0.12, vol: 0.12 },
  ],
  frost: [
    { wave: 'sine', f0: 2400, f1: 900, dur: 0.5, vol: 0.2, vibHz: 18, vibSemi: 1.5 },
    { wave: 'noise', f0: 8000, f1: 3000, dur: 0.4, vol: 0.14 },
    { wave: 'triangle', f0: 1200, f1: 1800, dur: 0.3, vol: 0.12, delay: 0.1 },
  ],
  nuke: [
    { wave: 'sawtooth', f0: 120, f1: 28, dur: 0.9, vol: 0.4, lp: 500 },
    { wave: 'noise', f0: 2400, f1: 80, dur: 0.8, vol: 0.34 },
    { wave: 'square', f0: 60, f1: 30, dur: 0.7, vol: 0.2, lp: 200, delay: 0.04 },
  ],
  bossEnter: [
    { wave: 'sawtooth', f0: 82, f1: 41, dur: 1.4, vol: 0.34, lp: 420, vibHz: 6, vibSemi: 0.6 },
    { wave: 'square', f0: 55, f1: 41, dur: 1.4, vol: 0.2, lp: 260, attack: 0.1 },
    { wave: 'noise', f0: 300, f1: 90, dur: 1.2, vol: 0.2, attack: 0.15 },
    { wave: 'triangle', f0: 164, f1: 123, dur: 0.9, vol: 0.18, delay: 0.5, vibHz: 5, vibSemi: 0.4 },
  ],
  bossPhase: [
    { wave: 'sine', f0: 110, f1: 110, dur: 1.0, vol: 0.36 },
    { wave: 'triangle', f0: 220, f1: 220, dur: 0.9, vol: 0.18 },
    { wave: 'noise', f0: 800, f1: 150, dur: 0.4, vol: 0.14 },
  ],
  bossWarn: [
    { wave: 'square', f0: 440, f1: 660, dur: 0.18, vol: 0.2, lp: 2000 },
    { wave: 'square', f0: 440, f1: 660, dur: 0.18, vol: 0.2, delay: 0.26, lp: 2000 },
    { wave: 'square', f0: 440, f1: 880, dur: 0.3, vol: 0.2, delay: 0.52, lp: 2000 },
  ],
  bossCast: [
    { wave: 'sawtooth', f0: 300, f1: 70, dur: 0.5, vol: 0.28, lp: 1200 },
    { wave: 'noise', f0: 1800, f1: 200, dur: 0.4, vol: 0.2 },
  ],
  bossBreak: [
    { wave: 'noise', f0: 6000, f1: 1500, dur: 0.3, vol: 0.28 },
    { wave: 'square', f0: 1568, f1: 392, dur: 0.22, vol: 0.2, lp: 4000 },
    { wave: 'triangle', f0: 784, f1: 1175, dur: 0.3, vol: 0.2, delay: 0.1 },
  ],
  windowOpen: [
    { wave: 'triangle', f0: 523, f1: 523, dur: 0.1, vol: 0.26 },
    { wave: 'triangle', f0: 659, f1: 659, dur: 0.1, vol: 0.26, delay: 0.1 },
    { wave: 'triangle', f0: 1047, f1: 1047, dur: 0.3, vol: 0.28, delay: 0.2 },
    { wave: 'sine', f0: 2093, f1: 2093, dur: 0.3, vol: 0.1, delay: 0.2 },
  ],
  windowClose: [
    { wave: 'triangle', f0: 784, f1: 392, dur: 0.22, vol: 0.2 },
    { wave: 'noise', f0: 700, f1: 200, dur: 0.1, vol: 0.1 },
  ],
  wardBreak: [
    { wave: 'noise', f0: 4800, f1: 900, dur: 0.28, vol: 0.3 },
    { wave: 'square', f0: 1760, f1: 440, dur: 0.16, vol: 0.18, lp: 3500 },
  ],
  win: [
    { wave: 'square', f0: 523, f1: 523, dur: 0.14, vol: 0.2, lp: 3000 },
    { wave: 'square', f0: 659, f1: 659, dur: 0.14, vol: 0.2, delay: 0.14, lp: 3000 },
    { wave: 'square', f0: 784, f1: 784, dur: 0.14, vol: 0.2, delay: 0.28, lp: 3000 },
    { wave: 'square', f0: 1047, f1: 1047, dur: 0.5, vol: 0.24, delay: 0.42, lp: 3000 },
    { wave: 'triangle', f0: 262, f1: 262, dur: 0.8, vol: 0.22, delay: 0.42 },
  ],
  lose: [
    { wave: 'triangle', f0: 392, f1: 392, dur: 0.22, vol: 0.28 },
    { wave: 'triangle', f0: 330, f1: 330, dur: 0.22, vol: 0.28, delay: 0.24 },
    { wave: 'triangle', f0: 262, f1: 262, dur: 0.22, vol: 0.28, delay: 0.48 },
    { wave: 'sawtooth', f0: 196, f1: 98, dur: 0.9, vol: 0.28, delay: 0.72, lp: 700 },
  ],
};

export const SOUND_IDS = Object.keys(RECIPES) as SoundId[];

/** Musik: a-Moll, 8 Takte, 84 BPM. Halbtoene relativ zu A2 (110 Hz). Bass je Takt, Arpeggio je Takt (Achtel). */
export const MUSIC = {
  bpm: 84,
  rootHz: 110,
  /** Grundton je Takt in Halbtoenen: Am F C G Am F G E (Takte 1-8). */
  bass: [0, -4, 3, -2, 0, -4, -2, -5],
  /** Akkordtoene je Takt (relativ zum Bass in Halbtoenen), als Arpeggio-Muster ueber 8 Achtel. */
  chords: [
    [0, 7, 12, 15],
    [0, 7, 12, 16],
    [0, 7, 12, 16],
    [0, 7, 12, 14],
    [0, 7, 12, 15],
    [0, 7, 12, 16],
    [0, 7, 12, 14],
    [0, 7, 11, 16],
  ],
  pattern: [0, 1, 2, 3, 2, 1, 2, 3],
} as const;
