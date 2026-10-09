/** Pose und Blickrichtung fuer Turm-/Held-Sprites (Vertrag: schnittstelle.md, facing 0..7, 0 = rechts, gegen den Uhrzeigersinn). */
export type TowerFrame = 'idle0' | 'idle1' | 'idle2' | 'idle3' | 'atk0' | 'atk1' | 'atk2' | 'atk3';
export const TOWER_FRAMES: TowerFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3'];

export interface Pose {
  /** Koerper hebt sich um n px (Atmen). */
  up: number;
  /** 0..1 Auszug (Bogen spannen, Ausholen). */
  pull: number;
  /** Rueckstoss in px entgegen der Schussrichtung. */
  recoil: number;
  /** Muendungsfeuer / Abschuss-Frame. */
  flash: boolean;
  /** 0..3 Phase fuer Flattern, Flackern, Kreisen. */
  ph: number;
  atk: boolean;
  /** 0..3 Angriffsframe, -1 = idle. */
  ai: number;
}

export function poseOf(frame: TowerFrame): Pose {
  const i = Number(frame.slice(-1));
  if (frame.startsWith('idle')) return { up: [0, 0, 1, 1][i], pull: 0, recoil: 0, flash: false, ph: i, atk: false, ai: -1 };
  return [
    { up: 0, pull: 0.55, recoil: 0, flash: false, ph: 0, atk: true, ai: 0 },
    { up: 0, pull: 1, recoil: -1, flash: false, ph: 1, atk: true, ai: 1 },
    { up: 1, pull: 0, recoil: 2, flash: true, ph: 2, atk: true, ai: 2 },
    { up: 0, pull: 0.2, recoil: 1, flash: false, ph: 3, atk: true, ai: 3 },
  ][i];
}

export interface Dir {
  /** Am Ende spiegeln (W, NW, SW sind gespiegelte E, NE, SE). */
  flip: boolean;
  /** Zielrichtung im ungespiegelten Bild (y nach unten). */
  ux: number;
  uy: number;
  /** Gesicht: 0 = Hinterkopf, 1 = ein Auge (schraeg hinten), 2 = beide Augen. */
  eyes: 0 | 1 | 2;
  ex: number;
  ey: number;
  /** Waffe hinter den Koerper zeichnen (Blick nach oben). */
  behind: boolean;
  /** Schulter-Seite (+1 rechts im ungespiegelten Bild). */
  sx: number;
}

const R = Math.SQRT1_2;
export function dirOf(facing: number): Dir {
  const f = ((Math.round(facing) % 8) + 8) % 8;
  switch (f) {
    case 0: return { flip: false, ux: 1, uy: 0, eyes: 2, ex: 2, ey: 0, behind: false, sx: 1 };
    case 1: return { flip: false, ux: R, uy: -R, eyes: 1, ex: 3, ey: -2, behind: true, sx: 1 };
    case 2: return { flip: false, ux: 0, uy: -1, eyes: 0, ex: 0, ey: -2, behind: true, sx: 1 };
    case 3: return { ...dirOf(1), flip: true };
    case 4: return { ...dirOf(0), flip: true };
    case 5: return { ...dirOf(7), flip: true };
    case 6: return { flip: false, ux: 0, uy: 1, eyes: 2, ex: 0, ey: 1, behind: false, sx: 1 };
    default: return { flip: false, ux: R, uy: R, eyes: 2, ex: 1, ey: 1, behind: false, sx: 1 };
  }
}

/** Winkel-Index 0..15 aus einem Geschwindigkeitsvektor (y nach unten): 0 = rechts, gegen den Uhrzeigersinn, 22,5 Grad je Schritt. */
export function dir16(vx: number, vy: number): number {
  const a = Math.atan2(-vy, vx);
  return ((Math.round((a / (Math.PI * 2)) * 16) % 16) + 16) % 16;
}
/** Blickrichtung 0..7 aus einem Vektor. */
export function dir8(vx: number, vy: number): number {
  const a = Math.atan2(-vy, vx);
  return ((Math.round((a / (Math.PI * 2)) * 8) % 8) + 8) % 8;
}
