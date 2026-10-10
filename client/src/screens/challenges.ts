/**
 * Challenges (Runde 16 E): Tages-Challenge, eigene Challenge bauen, Code eingeben.
 * Eine Auswahl (Tages-Challenge oder ein Code) steht links mit Regeln und Start, rechts die Wege dorthin.
 */
import { tryDecodeChallenge, encodeChallenge, type ChallengeRules } from '../../../sim/src/index';
import { DAILY_EMBERS, dailyChallenge, dailyStatus, utcDay } from '../meta';
import { h } from '../ui/dom';
import { icon } from './icons';
import { previewCanvas } from './home';
import { topBar } from './knowledge';
import { cv, ptext } from './px';
import { codeOf, copyButton, diffName, fmtTime, rulesList } from './challenge-ui';
import type { ChallengeSource, Ctx, View } from './types';

export function challengesView(ctx: Ctx, code?: string): View {
  const p = ctx.store.profile;
  const el = h('div', 'scr challenges');
  el.append(topBar(ctx, 'Challenges'));
  const today = utcDay();
  const daily = dailyChallenge(today);

  let sel: { rules: ChallengeRules; source: ChallengeSource } = { rules: daily.rules, source: { kind: 'daily', key: today, title: daily.name, from: 'hub' } };
  let startError = '';
  if (code) {
    const res = tryDecodeChallenge(code);
    if (res.ok) sel = { rules: res.rules, source: { kind: 'custom', key: encodeChallenge(res.rules), title: 'Shared challenge', from: 'hub' } };
    else startError = res.error;
  }

  const body = h('div', 'ch-body');
  const left = h('section', 'card ch-sel');
  const right = h('div', 'ch-side');
  body.append(left, right);
  el.append(body);

  const bestLine = (): HTMLElement => {
    const b = sel.source.kind === 'daily' ? dailyStatus(p, sel.source.key).best : p.challenges.custom[sel.source.key];
    const row = h('div', 'ch-meta num');
    if (!b) row.append(h('span', '', 'Not played yet'));
    else {
      row.append(h('span', '', `Plays: ${b.plays}`), h('span', '', b.won ? 'Cleared' : `Best: ${b.rounds} rounds`));
      if (b.won) row.append(h('span', '', `Least gold: ${b.spent}`), h('span', '', `Fewest lives lost: ${b.livesLost}`), h('span', '', `Fastest: ${fmtTime(b.ticks ?? 0)}`));
    }
    return row;
  };

  const drawSel = (): void => {
    left.replaceChildren();
    const isDaily = sel.source.kind === 'daily';
    left.append(h('div', 'ch-kicker', isDaily ? `Daily challenge · ${sel.source.key}` : 'Challenge code'));
    left.append(h('div', 'ch-name', sel.source.title));
    left.append(h('div', 'ch-sub', `Rounds ${sel.rules.startRound}–${sel.rules.endRound} · ${diffName(sel.rules.difficulty)}`));
    const mid = h('div', 'ch-mid');
    mid.style.display = 'flex';
    mid.style.gap = '16px';
    const pv = previewCanvas(sel.rules.map, 1, 'ch-pv');
    mid.append(pv, rulesList(sel.rules));
    left.append(mid, bestLine());
    if (isDaily) {
      const claimed = dailyStatus(p, sel.source.key).claimed;
      left.append(h('div', `ch-reward ${claimed ? 'done' : ''}`.trim(), claimed ? 'Reward claimed today. Come back tomorrow.' : `Win to earn ${DAILY_EMBERS} Embers (once per day)`));
    } else {
      const row = h('div', 'chr-code');
      const c = h('input', 'ch-input');
      c.readOnly = true;
      c.value = sel.source.key;
      c.setAttribute('aria-label', 'Challenge code');
      row.append(c, copyButton(ctx, 'Copy code', () => sel.source.key));
      left.append(row);
    }
    const start = h('button', 'btn-big play');
    start.dataset.act = 'start-challenge';
    start.append(ptext('Start', 4, 'white'), cv(icon('arrow'), 3));
    start.onclick = () => { ctx.sound('click'); ctx.playChallenge(sel.rules, sel.source); };
    left.append(start);
  };
  drawSel();

  // ---- rechts
  const todayBtn = h('button', 'btn-big alt', "Today's challenge");
  todayBtn.onclick = () => { ctx.sound('click'); sel = { rules: daily.rules, source: { kind: 'daily', key: today, title: daily.name, from: 'hub' } }; err.textContent = ''; drawSel(); };
  const create = h('button', 'btn-big gold', 'Create challenge');
  create.dataset.act = 'create';
  create.onclick = () => { ctx.sound('click'); ctx.go({ name: 'challenge-edit' }); };

  const enter = h('section', 'card');
  enter.append(h('div', 'h2', 'Enter code'));
  const row = h('div', 'ch-code-row');
  const input = h('input', 'ch-input');
  input.placeholder = 'DW1-XXXXX-XXXXX-...';
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Challenge code');
  const go = h('button', 'btn-small', 'Load');
  const err = h('div', 'ch-err', startError);
  const load = (): void => {
    // ein ganzer Link darf eingefuegt werden
    let v = input.value.trim();
    try { if (/^https?:/i.test(v)) v = new URL(v).searchParams.get('challenge') ?? v; } catch { /* bleibt */ }
    const res = tryDecodeChallenge(v);
    if (!res.ok) { ctx.sound('error'); err.textContent = res.error; return; }
    ctx.sound('click');
    err.textContent = '';
    sel = { rules: res.rules, source: { kind: 'custom', key: encodeChallenge(res.rules), title: 'Shared challenge', from: 'hub' } };
    drawSel();
  };
  go.onclick = load;
  input.onkeydown = (e) => { if (e.key === 'Enter') load(); e.stopPropagation(); };
  input.value = code ?? '';
  row.append(input, go);
  enter.append(row, err);

  right.append(todayBtn, create, enter);
  const recent = Object.entries(p.challenges.custom).slice(-4).reverse();
  if (recent.length) {
    const rc = h('section', 'card ch-recent');
    rc.append(h('div', 'h2', 'Your challenges'));
    for (const [c, b] of recent) {
      const r = tryDecodeChallenge(c);
      if (!r.ok) continue;
      const btn = h('button', '');
      btn.append(h('span', '', `${r.rules.map} · R${r.rules.startRound}–${r.rules.endRound}`), h('span', 'num', b.won ? 'Cleared' : `Best R${b.rounds}`));
      btn.onclick = () => { ctx.sound('click'); sel = { rules: r.rules, source: { kind: 'custom', key: c, title: 'Your challenge', from: 'hub' } }; drawSel(); };
      rc.append(btn);
    }
    right.append(rc);
  }
  void codeOf;
  return { el };
}
