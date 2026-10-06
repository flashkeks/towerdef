/** Fehler-Toast (heute oben im Spielfeld; P1 setzt ihn an den Mauszeiger). Liest `session.toast`. Besitzer: P1. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { h, setText } from './dom';

export class Toast {
  readonly el = h('div', 'toast hidden');

  update(s: Session): void {
    if (s.toast && s.toast.until > performance.now()) {
      setText(this.el, t(s.toast.key));
      this.el.classList.remove('hidden');
    } else this.el.classList.add('hidden');
  }
}
