/** Kurzmeldung (Toast) fuer die Bildschirme ausserhalb des Spiels (Lobby, Summon, ...). Das Spiel-Toast (`toast.ts`) gehoert zur Runde und liest die Session. Besitzer: P4. */
import { uiSound } from '../audio/ui-audio';
import { h } from './dom';

let host: HTMLElement | null = null;

/** Zeigt `text` oben mittig; `error` faerbt rot. Mehrere Meldungen stapeln sich, jede verschwindet nach `ms`. Gibt das Element zurueck. */
export function notify(text: string, kind: 'info' | 'error' | 'good' = 'info', ms = 4200): HTMLElement {
  if (!host || !host.isConnected) {
    host = h('div', 'flashes');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  if (kind !== 'info') uiSound(kind === 'error' ? 'ui.bad' : 'ui.good');
  const el = h('div', `flash ${kind}`, text);
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  host.append(el);
  setTimeout(() => el.remove(), ms);
  return el;
}
