/** Ergebnis einer Challenge (Runde 16 E): Kennzahlen fuer die spaeteren Bestenlisten (#5), Code zum Teilen. */
import { h } from '../ui/dom';
import { icon } from './icons';
import { cv, ptext } from './px';
import { copyButton, fmtTime, linkOf, rulesList } from './challenge-ui';
import { fmt } from './text';
import type { ChallengeResultInfo, Ctx, View } from './types';

export function challengeResultView(ctx: Ctx, info: ChallengeResultInfo): View {
  const el = h('div', `scr result challenge-result ${info.won ? 'won' : 'lost'}`);
  const head = h('header', 'res-head chr-title');
  head.append(ptext(info.quit ? 'Left' : info.won ? 'Victory' : 'Defeat', 7, info.won ? 'leaf' : info.quit ? 'silver' : 'red', 'ink', 'res-title'));
  head.append(h('div', 'res-sub', `${info.source.title} · rounds ${info.rules.startRound}–${info.rules.endRound}`));
  if (info.embersGained > 0) head.append(h('div', 'res-best', `+${info.embersGained} Embers (daily reward)`));
  else if (info.improved && !info.duplicate) head.append(h('div', 'res-best', 'New personal best'));

  const stats = h('div', 'chr-grid');
  const stat = (label: string, value: string, best?: string): void => {
    const c = h('div', 'card chr-stat');
    c.append(h('b', 'num', value), h('span', '', label));
    if (best) c.append(h('em', 'num', best));
    stats.append(c);
  };
  const b = info.best;
  stat('Rounds cleared', `${info.roundsCleared}/${info.rules.endRound - info.rules.startRound + 1}`, b.won ? '' : `Best ${b.rounds}`);
  stat('Gold spent', fmt(info.spent), b.spent !== null ? `Best ${fmt(b.spent)}` : undefined);
  stat('Lives lost', fmt(info.livesLost), b.livesLost !== null ? `Best ${fmt(b.livesLost)}` : undefined);
  stat('Time', fmtTime(info.ticks), b.ticks !== null ? `Best ${fmtTime(b.ticks)}` : undefined);

  const card = h('section', 'card');
  card.append(h('div', 'h2', 'Rules'), rulesList(info.rules));
  const codeRow = h('div', 'chr-code');
  const c = h('input', 'ch-input');
  c.readOnly = true;
  c.value = info.code;
  codeRow.append(c, copyButton(ctx, 'Copy code', () => info.code), copyButton(ctx, 'Copy link', () => linkOf(info.code)));
  card.append(codeRow);

  const btns = h('div', 'res-btns');
  const again = h('button', 'btn-big play');
  again.append(ptext('Again', 4, 'white'), cv(icon('arrow'), 3));
  again.onclick = () => { ctx.sound('click'); ctx.playChallenge(info.rules, info.source); };
  const back = h('button', 'btn-big alt', info.source.from === 'editor' ? 'Edit challenge' : 'Challenges');
  back.onclick = () => { ctx.sound('click'); ctx.go(info.source.from === 'editor' ? { name: 'challenge-edit', rules: info.rules } : { name: 'challenges' }); };
  const home = h('button', 'btn-big alt', 'Home');
  home.onclick = () => { ctx.sound('click'); ctx.go({ name: 'home' }); };
  btns.append(home, back, again);
  el.append(head, stats, card, btns);
  el.dataset.done = '1';
  return { el };
}
