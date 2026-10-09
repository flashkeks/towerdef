/**
 * Lautstaerke-Regler (Runde 12): Musik und Soundeffekte getrennt, Schieberegler 0-100 % (0 = stumm).
 * `volumePanel` sind die zwei Zeilen (Match-Pop-over und Einstellungen), `volumeButton` der Lautsprecher mit Pop-over.
 * Arbeitet nur gegen `VolumeApi` (audio/settings.ts), damit Match, Menues, Store und Tests dasselbe nutzen.
 */
import type { VolumeApi } from '../audio/settings';
import { h } from './dom';
import './volume.css';

export const VOLUME_LABELS = { music: 'Music', sfx: 'Sound effects' } as const;

/** Beide Regler als Zeilen. `onChange` feuert beim Ziehen, `onCommit` beim Loslassen (z. B. Klick-Ton oder Speichern). */
export function volumePanel(api: VolumeApi, o: { onCommit?: (kind: 'music' | 'sfx', pct: number) => void; onChange?: (kind: 'music' | 'sfx', pct: number) => void } = {}): HTMLElement {
  const box = h('div', 'vol-panel');
  const cur = api.get();
  for (const kind of ['music', 'sfx'] as const) {
    const row = h('label', 'vol-row');
    row.dataset.kind = kind;
    const name = h('span', 'vol-name', VOLUME_LABELS[kind]);
    const sl = h('input', 'vol-slider') as HTMLInputElement;
    sl.type = 'range'; sl.min = '0'; sl.max = '100'; sl.step = '5';
    sl.value = String(cur[kind]);
    sl.setAttribute('aria-label', VOLUME_LABELS[kind]);
    const val = h('span', 'vol-val num', `${cur[kind]}%`);
    const paint = (): void => { sl.style.setProperty('--fill', `${sl.value}%`); val.textContent = Number(sl.value) === 0 ? 'Off' : `${sl.value}%`; row.classList.toggle('off', Number(sl.value) === 0); };
    sl.oninput = () => { api.set(kind, Number(sl.value)); paint(); o.onChange?.(kind, Number(sl.value)); };
    sl.onchange = () => o.onCommit?.(kind, Number(sl.value));
    paint();
    row.append(name, sl, val);
    box.append(row);
  }
  return box;
}

/** Lautsprecher-Knopf mit Pop-over (Klick oeffnet/schliesst, Klick daneben schliesst). `icon(muted)` liefert das Symbol. */
export function volumeButton(api: VolumeApi, icon: (muted: boolean) => HTMLElement, cls = ''): { el: HTMLElement; refresh(): void; close(): void } {
  const wrap = h('div', `vol-wrap ${cls}`.trim());
  const btn = h('button', 'vol-btn');
  btn.type = 'button';
  btn.title = 'Volume (M: quick mute)';
  btn.setAttribute('aria-haspopup', 'dialog');
  const pop = h('div', 'vol-pop hidden');
  pop.setAttribute('role', 'dialog');
  pop.append(h('div', 'vol-pop-h', 'Volume'), volumePanel(api, { onChange: () => refresh() }));
  const muted = (): boolean => api.quiet || (api.get().music === 0 && api.get().sfx === 0);
  const refresh = (): void => { btn.replaceChildren(icon(muted())); };
  const outside = (e: Event): void => { if (!wrap.contains(e.target as Node)) close(); };
  const close = (): void => { pop.classList.add('hidden'); document.removeEventListener('pointerdown', outside, true); };
  btn.onclick = () => {
    if (pop.classList.contains('hidden')) { pop.classList.remove('hidden'); document.addEventListener('pointerdown', outside, true); }
    else close();
  };
  refresh();
  wrap.append(btn, pop);
  return { el: wrap, refresh, close };
}
