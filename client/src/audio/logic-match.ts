/**
 * Match-Ton, reine Logik (Runde 10 / P2): welche Klaenge zu Schuss, Krit, Faehigkeits-Ansage und Boss-Tod gehoeren.
 * Liegt neben `logic.ts`, damit das Zusammenfuehren mit dem Menue-Ton (P3) nur in der Typ-Union und den Drossel-Regeln zusammentrifft.
 * Die Rezepte stehen in `recipes-match.ts`.
 */
import type { HitStyle } from '../view/feel';
import type { LimitRule } from './logic';

/** Schuss-Klaenge je Element (dezent) und die Ansagen/Akzente des Matches. */
export type MatchSoundId =
  | 'hit.fire'
  | 'hit.water'
  | 'hit.ice'
  | 'hit.lightning'
  | 'hit.air'
  | 'hit.light'
  | 'hit.dark'
  | 'hit.rose'
  | 'hit.magic'
  | 'crit'
  | 'cutin'
  | 'bossDeath';

export const ELEMENT_SHOT_SOUNDS: Readonly<Record<string, MatchSoundId>> = {
  fire: 'hit.fire',
  water: 'hit.water',
  ice: 'hit.ice',
  lightning: 'hit.lightning',
  air: 'hit.air',
  light: 'hit.light',
  dark: 'hit.dark',
  rose: 'hit.rose',
  magic: 'hit.magic',
};

/** Flaechen-Angriffe behalten ihren wuchtigen Stilklang (Knall, Fächer, Strahl); Einzelziele klingen nach ihrem Element. */
const AREA = new Set<HitStyle>(['blast', 'shell', 'full', 'cone', 'line']);

/**
 * Welcher Klang zu einem Schuss gehoert: Einzelziel mit Element -> Elementklang, physisch/true -> Stilklang, Flaeche -> Stilklang.
 * Ergebnis ist immer ein Klang aus dem Treffer-Topf (`hit.`), damit die Drosselung fuer alle gilt.
 */
export function shotSoundFor(style: HitStyle, element: string | undefined): MatchSoundId | `hit.${Exclude<HitStyle, 'full'>}` {
  const el = element ? ELEMENT_SHOT_SOUNDS[element] : undefined;
  if (el && !AREA.has(style)) return el;
  return style === 'full' ? 'hit.blast' : (`hit.${style}` as `hit.${Exclude<HitStyle, 'full'>}`);
}

/** Leiser Schuss: Elementklaenge liegen bewusst unter dem Stilklang, damit 30 Units kein Klangbrei werden. */
export const shotGain = (style: HitStyle, element: string | undefined): number => (element && ELEMENT_SHOT_SOUNDS[element] && !AREA.has(style) ? 0.8 : 0.9);

export const LIMITS_MATCH: Record<string, LimitRule> = {
  crit: { gapMs: 110, burst: { count: 3, windowMs: 900 } },
  cutin: { gapMs: 600 },
  bossDeath: { gapMs: 1500 },
};
