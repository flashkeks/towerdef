/** Fehler-Toast: erscheint am Mauszeiger (bzw. unten mittig ohne Zeigerposition). Liest `session.toast`. Besitzer: P1. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { h, setText } from './dom';

export class Toast {
  readonly el = h('div', 'toast hidden');
  private shown: unknown = null;

  update(s: Session): void {
    const tt = s.toast;
    if (tt && tt.until > performance.now()) {
      setText(this.el, t(tt.key, tt.params));
      this.el.classList.remove('hidden');
      if (this.shown !== tt) {
        this.shown = tt;
        const wrap = this.el.parentElement;
        if (tt.at && wrap) {
          const w = wrap.clientWidth;
          const half = Math.min(this.el.offsetWidth / 2 + 8, w / 2);
          const x = Math.max(half, Math.min(w - half, tt.at.x));
          const below = tt.at.y < 56;
          this.el.style.left = `${x}px`;
          this.el.style.top = `${below ? tt.at.y + 28 : tt.at.y - 14}px`;
          this.el.style.bottom = 'auto';
          this.el.classList.toggle('below', below);
          this.el.classList.add('atpointer');
        } else {
          this.el.style.left = '';
          this.el.style.top = '';
          this.el.style.bottom = '';
          this.el.classList.remove('atpointer', 'below');
        }
      }
    } else {
      this.el.classList.add('hidden');
      this.shown = null;
    }
  }
}
