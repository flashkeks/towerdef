/** Hilfe-Overlay (`?` oder `H`): Tastenkuerzel, Zonen, Ersthinweise wieder einschalten. Besitzer: P1. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { h } from './dom';
import { setHintsOff } from './hints-store';

const KEYS = ['pick', 'place', 'again', 'cancel', 'select', 'upgrade', 'target', 'ability', 'wave', 'pause', 'speed', 'mute', 'help'] as const;

export class Help {
  readonly el = h('div', 'overlay help hidden');
  /** Haben wir beim Oeffnen pausiert? Dann nehmen wir es beim Schliessen zurueck. */
  private pausedByUs = false;

  constructor(private readonly getSession: () => Session | null, onHintsOn: () => void) {
    const box = h('div', 'dialog helpbox');
    box.append(h('h1', 'title', t('help.title')), h('h2', undefined, t('help.keys')));
    const dl = h('dl', 'keys');
    for (const k of KEYS) dl.append(h('dt', undefined, t(`help.k.${k}`)), h('dd', undefined, t(`help.d.${k}`)));
    box.append(dl, h('h2', undefined, t('help.slots')));
    const ul = h('ul', 'slotlegend');
    for (const k of ['ground', 'hill', 'large'] as const) {
      const li = h('li');
      li.append(h('span', `swatch type-${k}`), h('span', undefined, t(`help.slot.${k}`)));
      ul.append(li);
    }
    box.append(ul, h('p', 'muted', t('help.slot.any')));
    const row = h('div', 'diff-row');
    const tips = h('button', 'btn tips-on', t('hint.on'));
    tips.addEventListener('click', () => {
      setHintsOff(false);
      onHintsOn();
    });
    const close = h('button', 'btn primary help-close', t('help.close'));
    close.addEventListener('click', () => this.close());
    row.append(tips, close);
    box.append(row);
    this.el.append(box);
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });
  }

  get isOpen(): boolean {
    return !this.el.classList.contains('hidden');
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(): void {
    const s = this.getSession();
    this.pausedByUs = !!s && !s.paused && !s.over;
    if (this.pausedByUs) s?.togglePause();
    this.el.classList.remove('hidden');
  }

  close(): void {
    this.el.classList.add('hidden');
    const s = this.getSession();
    if (this.pausedByUs && s?.paused) s.togglePause();
    this.pausedByUs = false;
  }
}
