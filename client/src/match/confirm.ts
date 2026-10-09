/**
 * Bestaetigungs-Pop-up im Match (Runde 11c): "Unlock <Name> for N Tower XP?" mit Yes/No. Enter = Ja, Esc = Nein
 * (die Tasten faengt `Match.onKey` ab, solange `open` wahr ist). Das Pop-up entscheidet nichts: Ja ruft den Callback.
 */
import { h } from '../ui/dom';
import { t } from '../i18n/t';
import { copyCanvas, uiIcon } from './ui-icons';

export interface ConfirmOptions {
  title: string;
  sub?: string;
  icon?: HTMLCanvasElement;
  yes(): void;
  no?(): void;
}

export class Confirm {
  readonly el = h('div', 'm-confirm hidden');
  private cur: ConfirmOptions | null = null;

  get open(): boolean { return this.cur != null; }

  show(o: ConfirmOptions): void {
    this.cur = o;
    const box = h('div', 'cf-box pxbox');
    if (o.icon) { const ic = h('div', 'p-ic cf-ic'); ic.append(copyCanvas(o.icon, 3)); box.append(ic); }
    else { const ic = h('div', 'p-ic cf-ic'); ic.append(uiIcon('bolt', 3)); box.append(ic); }
    const tx = h('div', 'cf-tx');
    tx.append(h('div', 'cf-title', o.title));
    if (o.sub) tx.append(h('div', 'cf-sub', o.sub));
    box.append(tx);
    const row = h('div', 'cf-btns');
    const yes = h('button', 'cf-yes', t('confirm.yes'));
    const no = h('button', 'cf-no', t('confirm.no'));
    yes.append(h('kbd', '', 'Enter'));
    no.append(h('kbd', '', 'Esc'));
    yes.onclick = () => this.answer(true);
    no.onclick = () => this.answer(false);
    row.append(yes, no);
    box.append(row);
    this.el.replaceChildren(box);
    this.el.classList.remove('hidden');
    this.el.onclick = (e) => { if (e.target === this.el) this.answer(false); };
  }

  /** true = Ja, false = Nein/Esc. Ohne offenes Pop-up tut es nichts. */
  answer(yes: boolean): void {
    const c = this.cur;
    if (!c) return;
    this.cur = null;
    this.el.classList.add('hidden');
    this.el.replaceChildren();
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (yes) c.yes(); else c.no?.();
  }

  close(): void { this.cur = null; this.el.classList.add('hidden'); this.el.replaceChildren(); }
}
