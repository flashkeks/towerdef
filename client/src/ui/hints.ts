/** Ersthinweise: drei Schritte in der Seitenleiste (Unit waehlen, Slot klicken, Welle starten). Abschaltbar, gemerkt in localStorage. Besitzer: P1. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { h, setText } from './dom';
import { hintsOff, hintStep, setHintsOff, type HintStep } from './hints-store';

export class Hints {
  readonly el = h('section', 'panel hints hidden');
  private readonly step = h('strong', 'step');
  private readonly text = h('p', 'text');
  private off = hintsOff();
  private last: HintStep | null = null;

  constructor() {
    const hide = h('button', 'btn hide-hints', t('hint.off'));
    hide.addEventListener('click', () => this.dismiss());
    this.el.append(this.step, this.text, hide);
  }

  /** Neue Runde: Hinweise wieder pruefen (Einstellung neu lesen). */
  bind(): void {
    this.off = hintsOff();
    this.last = null;
  }

  /** Nach "Show tips again" in der Hilfe. */
  enable(): void {
    this.off = false;
    this.last = null;
  }

  private dismiss(): void {
    setHintsOff(true);
    this.off = true;
  }

  update(s: Session): void {
    const step = this.off ? 'done' : hintStep({ phase: s.sim.state.phase, placing: s.placing !== null, units: s.sim.state.units.length });
    if (step === this.last) return;
    if (step === 'done' && this.last !== null && !this.off) setHintsOff(true); // geschafft: nicht noch einmal zeigen
    this.last = step;
    this.el.classList.toggle('hidden', step === 'done');
    if (step !== 'done') {
      setText(this.step, t('hint.step', { n: step }));
      setText(this.text, t(`hint.${step}`));
    }
  }
}
