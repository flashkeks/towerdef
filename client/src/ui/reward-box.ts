/**
 * Belohnungsblock des Ergebnis-Bildschirms (Runde 7, P4): meldet das Match ueber `Backend.reportMatch` (das Replay wird nachgerechnet),
 * zeigt Crystals, Gold, XP, Erst-Clear-Hinweis und Spieler-Level-Up. Fehler (z. B. `replay-mismatch`) erscheinen freundlich, ohne Absturz.
 */
import { getBackend } from '../backend';
import type { MatchReward } from '../backend/meta';
import type { ReplayFile } from '../game/recorder';
import { t } from '../i18n/t';
import { icon } from './kit';
import { h } from './dom';
import { newKey } from './meta-ui';
import { errorText, rewardView, walletView } from './meta-model';
import { celebrate } from './menu-fx';
import { openRewardPack, rewardPrizes } from './prize-sources';

/** Fehler, bei denen ein erneuter Versuch mit demselben Schluessel sinnvoll ist (Speicher/Technik), nicht bei einem abgelehnten Replay. */
export const RETRYABLE: readonly string[] = ['save-failed', 'internal-error'];

/** Box mit "Calculating rewards ..." und meldet das Match sofort. `replay` ist der abgeschlossene Lauf des Recorders. */
export function buildRewardBox(replay: ReplayFile | null, won: boolean): HTMLElement {
  const box = h('div', 'reward-box');
  box.dataset.state = 'pending';
  box.append(h('p', 'muted', t('reward.pending')));
  const key = newKey(); // ein Spiel = ein Schluessel: Wiederholung bucht nicht doppelt
  const run = async (): Promise<void> => {
    box.dataset.state = 'pending';
    box.replaceChildren(h('p', 'muted', t('reward.pending')));
    if (!replay) return showError(box, { code: 'no-replay', message: '' }, null);
    const r = await getBackend().reportMatch(replay, key);
    if (!r.ok) return showError(box, r, run);
    const pv = await getBackend().playerView();
    showReward(box, r.reward, won, pv.ok ? walletView(pv.player) : null);
  };
  void run();
  return box;
}

type Fail = { code: string; message: string };

function showError(box: HTMLElement, f: Fail, retry: (() => Promise<void>) | null): void {
  box.replaceChildren();
  box.dataset.state = 'error';
  box.dataset.code = f.code;
  box.append(h('h2', undefined, t('reward.title')), h('p', 'warn reward-error', errorText(f)), h('p', 'muted', t('reward.none')));
  if (retry && RETRYABLE.includes(f.code)) {
    const b = h('button', 'btn reward-retry', t('reward.retry'));
    b.addEventListener('click', () => void retry());
    box.append(b);
  }
}

function showReward(box: HTMLElement, reward: MatchReward, won: boolean, wallet: ReturnType<typeof walletView> | null): void {
  box.replaceChildren();
  box.dataset.state = 'ok';
  const v = rewardView(reward, won);
  box.append(h('h2', undefined, t('reward.title')));
  const list = h('ul', 'reward-lines');
  for (const l of v.lines) {
    const li = h('li', `reward-line ${l.kind}`);
    li.dataset.value = String(l.value);
    const bub = h('span', `w-icon ${l.kind}`);
    bub.append(icon(({ crystals: 'crystal', gold: 'coin', xp: 'star', material: 'shard', marks: 'mark', bonus: 'sparkle' } as Record<string, string>)[l.kind] ?? 'star', 'fill'));
    li.append(bub, h('span', undefined, l.text));
    list.append(li);
  }
  box.append(list);
  // Runde 10 / P3: Gewinne als Paket oeffnen. Raid-Meilensteine und die garantierte Raid-Unit oeffnen sich von selbst, sonst per Knopf.
  const prizes = rewardPrizes(reward);
  if (prizes.length > 1) {
    const open = h('button', 'btn primary reward-open');
    open.type = 'button';
    open.append(icon('gift'), t('reveal.open'));
    open.addEventListener('click', () => void openRewardPack(reward));
    box.append(open);
    if (reward.unit || (reward.milestones?.length ?? 0) > 0) void openRewardPack(reward);
  }
  if (v.levelUp !== null) celebrate({ kind: 'levelup', title: t('levelup.title'), sub: t('reward.levelUp', { n: v.levelUp }) });
  if (v.firstClear) box.append(h('p', 'reward-firstclear', t('reward.firstClear')));
  if (v.consolation) box.append(h('p', 'muted reward-consolation', t('reward.consolation')));
  if (v.levelUp !== null) box.append(h('p', 'reward-levelup', t('reward.levelUp', { n: v.levelUp })));
  if (wallet) {
    const bar = h('div', 'bar xpbar');
    const fillEl = h('div', 'bar-fill xp');
    fillEl.style.width = `${wallet.xpPct}%`;
    bar.append(fillEl);
    const row = h('div', 'reward-xp');
    row.append(h('span', undefined, `${wallet.level}`), bar, h('span', 'muted', wallet.xp));
    box.append(row);
  }
}
