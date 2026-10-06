import { describe, expect, it } from 'vitest';
import { gateReason, type GateWindow } from '../src/gate';

interface Opts {
  coarse?: boolean;
  hoverNone?: boolean;
  fine?: boolean;
  touchPoints?: number;
  ua?: string;
  uaMobile?: boolean;
  w?: number;
  h?: number;
}
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function win(o: Opts = {}): GateWindow {
  const q: Record<string, boolean> = {
    '(pointer: coarse)': o.coarse ?? false,
    '(hover: none)': o.hoverNone ?? false,
    '(any-pointer: fine)': o.fine ?? true,
  };
  return {
    matchMedia: (query: string) => ({ matches: q[query] ?? false }),
    navigator: { maxTouchPoints: o.touchPoints ?? 0, userAgent: o.ua ?? DESKTOP_UA, userAgentData: o.uaMobile === undefined ? undefined : { mobile: o.uaMobile } },
    innerWidth: o.w ?? 1280,
    innerHeight: o.h ?? 800,
  };
}

describe('gateReason', () => {
  it('laesst einen normalen Desktop durch', () => expect(gateReason(win())).toBeNull());
  it('sperrt Handy: grober Zeiger ohne Hover und ohne feinen Zeiger', () => expect(gateReason(win({ coarse: true, hoverNone: true, fine: false, touchPoints: 5, w: 390, h: 844 }))).toBe('touch-primary'));
  it('sperrt iPad ohne Maus (Touch-Punkte, kein feiner Zeiger), auch mit Mac-UA', () => expect(gateReason(win({ fine: false, touchPoints: 5, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }))).toBe('touch-primary'));
  it('erlaubt Touch-Laptop mit Maus/Trackpad (feiner Zeiger vorhanden)', () => expect(gateReason(win({ touchPoints: 10, fine: true }))).toBeNull());
  it('sperrt per userAgentData.mobile', () => expect(gateReason(win({ uaMobile: true }))).toBe('mobile-ua'));
  it('sperrt per Mobil-UA', () => expect(gateReason(win({ ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36' }))).toBe('mobile-ua'));
  it('Desktop-Modus-Trick am Handy bleibt gesperrt', () => expect(gateReason(win({ coarse: true, hoverNone: true, fine: false, touchPoints: 5, ua: DESKTOP_UA, w: 980, h: 1800 }))).toBe('touch-primary'));
  it('sperrt zu kleines Fenster (Breite)', () => expect(gateReason(win({ w: 1023, h: 800 }))).toBe('small-viewport'));
  it('sperrt zu kleines Fenster (Hoehe)', () => expect(gateReason(win({ w: 1280, h: 599 }))).toBe('small-viewport'));
  it('Grenzwert 1024 x 600 ist erlaubt', () => expect(gateReason(win({ w: 1024, h: 600 }))).toBeNull());
});
