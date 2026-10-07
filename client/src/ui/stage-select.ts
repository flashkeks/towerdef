/**
 * Stage-Auswahl: der Terrassenweg mit den Stufen Normal / Hard / Nightmare. Gesperrte Stufen nennen den Grund ("Player level 5"),
 * jede Karte zeigt Erst-Clear-Belohnung und Bestwelle. Ein Klick auf eine freie Stufe startet das Match (`nav.play`). Besitzer: P4.
 */
import { getBackend } from '../backend';
import { t } from '../i18n/t';
import { STAGE_ID, type DifficultyId } from '../sim';
import { h } from './dom';
import { metaFrame } from './meta-ui';
import { errorText, stageCardView, teamComplete, unitName } from './meta-model';
import type { Nav } from './nav';
import { miniOf } from './unit-card';
import { icon } from './kit';

export function buildStageSelect(nav: Nav): HTMLElement {
  const f = metaFrame('stage', 'stage.title', nav);
  void (async () => {
    const [pv, sv] = await Promise.all([getBackend().playerView(), getBackend().stageView(STAGE_ID)]);
    if (!pv.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(pv)));
    if (!sv.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(sv)));
    const p = pv.player;
    const ready = teamComplete(p.team, p.teamTarget);

    f.body.append(h('p', 'tagline', t('stage.subtitle')));
    const teamRow = h('div', 'stage-team');
    if (p.team.length > 0) {
      teamRow.append(h('span', 'muted', t('lobby.teamLabel', { n: p.team.length, max: p.teamTarget })));
      for (const id of p.team) {
        const c = h('span', 'strip-unit');
        c.title = unitName(id);
        c.append(miniOf(id, 36));
        teamRow.append(c);
      }
    }
    const change = h('button', 'btn stage-team-btn', t(ready ? 'stage.changeTeam' : 'stage.pickTeam'));
    change.type = 'button';
    change.addEventListener('click', () => nav.team());
    teamRow.append(change);
    f.body.append(teamRow);
    if (!ready) f.body.append(h('p', 'warn stage-warn', t(p.ownedCount === 0 ? 'stage.noUnits' : 'stage.teamIncomplete')));

    const row = h('div', 'diff-row stage-row');
    for (const d of sv.difficulties) {
      const v = stageCardView(d);
      const b = h('button', `btn diff stage-card ${d.difficulty}${v.locked ? ' locked' : ''}${v.cleared ? ' cleared' : ''}`);
      b.type = 'button';
      b.dataset.difficulty = d.difficulty;
      b.dataset.rank = ({ normal: 'I', hard: 'II', nightmare: 'III' } as Record<string, string>)[d.difficulty] ?? '';
      b.disabled = v.locked || !ready;
      const ic = h('span', 'stage-ic');
      ic.append(icon(({ normal: 'shield', hard: 'bolt', nightmare: 'skull' } as Record<string, string>)[d.difficulty] ?? 'flag'));
      b.append(ic, h('strong', undefined, t(`difficulty.${d.difficulty}`)), h('span', 'diff-desc', t(`difficulty.${d.difficulty}.desc`)));
      if (v.locked) {
        const lr = h('span', 'lock-reason');
        lr.append(icon('lock'), v.lockText ?? '');
        b.append(lr);
      }
      else b.append(h('span', 'stage-reward', v.rewardText));
      b.append(h('span', 'stage-best', v.bestText));
      if (v.cleared) b.append(h('span', 'stage-cleared', t('stage.cleared')));
      b.addEventListener('click', () => nav.play(d.difficulty as DifficultyId));
      row.append(b);
    }
    f.body.append(row, h('p', 'set-note', t('stage.note')));
  })();
  return f.box;
}
