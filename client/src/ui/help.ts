/** Hilfe-Overlay (`?` oder `H`): Tastenkuerzel, Zonen, Ersthinweise wieder einschalten. Besitzer: P1. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { h } from './dom';
import { setHintsOff } from './hints-store';
import { crest, panel, rarityFrame, RARITIES } from './kit';

const KEYS = ['pick', 'place', 'again', 'cancel', 'select', 'upgrade', 'target', 'wave', 'pause', 'speed', 'mute', 'help'] as const;

export class Help {
  readonly el = h('div', 'overlay help hidden');
  /** Haben wir beim Oeffnen pausiert? Dann nehmen wir es beim Schliessen zurueck. */
  private pausedByUs = false;

  constructor(private readonly getSession: () => Session | null, onHintsOn: () => void) {
    const box = h('div', 'dialog helpbox');
    const head = h('header', 'help-head');
    head.append(crest(), h('h1', 'title', t('help.title')), h('p', 'tagline', t('help.sub')));
    box.append(head);
    const cols = h('div', 'help-cols');

    const keys = panel({ title: t('help.keys'), tag: 'section', cls: 'help-keys' });
    const dl = h('dl', 'keys');
    for (const k of KEYS) dl.append(h('dt', undefined, t(`help.k.${k}`)), h('dd', undefined, t(`help.d.${k}`)));
    keys.body.append(dl);

    const side = h('div', 'help-side');
    const flow = panel({ title: t('help.flow'), tone: 'aether', tag: 'section', cls: 'help-flow' });
    const steps = h('ol', 'help-steps');
    for (const n of [1, 2, 3]) {
      const li = h('li');
      li.append(h('span', 'help-step-n', String(n)), h('span', undefined, t(`hint.${n}`)));
      steps.append(li);
    }
    flow.body.append(steps);

    const slots = panel({ title: t('help.slots'), tone: 'ember', tag: 'section', cls: 'help-slots' });
    const ul = h('ul', 'slotlegend');
    for (const k of ['ground', 'hill', 'large'] as const) {
      const li = h('li');
      li.append(h('span', `swatch type-${k}`), h('span', undefined, t(`help.slot.${k}`)));
      ul.append(li);
    }
    slots.body.append(ul, h('p', 'muted help-any', t('help.slot.any')));

    const rar = panel({ title: t('help.rarity'), tone: 'violet', tag: 'section', cls: 'help-rarity' });
    const rl = h('div', 'rarity-legend');
    for (const r of RARITIES) {
      const item = h('span', 'rl-item');
      item.append(rarityFrame(r, h('span', 'rl-fill'), { flow: true, cls: 'rl-frame' }), h('span', 'rl-name', t(`rarity.${r}`)));
      rl.append(item);
    }
    rar.body.append(rl);

    side.append(flow, slots, rar);
    cols.append(keys, side);
    box.append(cols);
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
