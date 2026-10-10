/** Kleine gemeinsame Teile der Challenge-Bildschirme (Runde 16 E). */
import { describeRules, encodeChallenge, type ChallengeRules } from '../../../sim/src/index';
import { MAP_NAMES } from '../meta';
import { h } from '../ui/dom';
import type { Ctx } from './types';
import './challenge.css';

export const fmtTime = (ticks: number): string => {
  const s = Math.round(ticks / 60);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const diffName = (d: string): string => d[0].toUpperCase() + d.slice(1);

/** Regelzeilen einer Challenge als Liste (Karte und Schwierigkeit zuerst). */
export function rulesList(rules: ChallengeRules): HTMLElement {
  const ul = h('ul', 'ch-rules');
  for (const l of [`${MAP_NAMES[rules.map] ?? rules.map}`, `${diffName(rules.difficulty)} difficulty`, ...describeRules(rules)]) ul.append(h('li', '', l));
  return ul;
}

/** In die Zwischenablage kopieren; Rueckgabe sagt, ob es ging (kein Fehler nach aussen). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Knopf, der `getText()` kopiert und kurz "Copied" zeigt. */
export function copyButton(ctx: Ctx, label: string, getText: () => string, cls = 'btn-small'): HTMLButtonElement {
  const b = h('button', cls, label);
  b.onclick = async () => {
    ctx.sound('click');
    const ok = await copyText(getText());
    b.textContent = ok ? 'Copied' : 'Select and copy';
    setTimeout(() => { b.textContent = label; }, 1400);
  };
  return b;
}

export const codeOf = (rules: ChallengeRules): string => encodeChallenge(rules);
export const linkOf = (code: string): string => `${location.origin}${location.pathname}?challenge=${encodeURIComponent(code)}`;
