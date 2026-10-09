/** Einmaliger Hinweis nach dem Zuruecksetzen alter Staende. */
import { h } from '../ui/dom';
import { icon } from './icons';
import { cv, ptext } from './px';
import { S } from './text';
import type { Ctx, View } from './types';

export function noticeView(ctx: Ctx): View {
  const el = h('div', 'scr notice');
  const box = h('div', 'card notice-box');
  const ok = h('button', 'btn-big play');
  ok.append(ptext(S.resetNotice.ok, 4, 'white'));
  ok.onclick = () => {
    ctx.sound('click');
    void ctx.store.ackResetNotice().then(() => ctx.go({ name: 'home' }));
  };
  box.append(cv(icon('lantern'), 8), ptext(S.resetNotice.title, 6, 'amber'), h('p', 'notice-t', S.resetNotice.text), ok);
  el.append(box);
  queueMicrotask(() => ok.focus());
  return { el };
}
