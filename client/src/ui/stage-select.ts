/**
 * Stage-Auswahl: der Terrassenweg mit den Stufen Normal / Hard / Nightmare. Gesperrte Stufen nennen den Grund ("Player level 5"),
 * jede Karte zeigt Erst-Clear-Belohnung und Bestwelle. Ein Klick auf eine freie Stufe startet das Match (`nav.play`). Besitzer: P4.
 */
import { getBackend } from '../backend';
import { t } from '../i18n/t';
import { STAGE_ID, type DifficultyId } from '../sim';
import { lockText } from './world-model';
import { h } from './dom';
import { metaFrame } from './meta-ui';
import { errorText, stageCardView, teamComplete, unitName } from './meta-model';
import type { Nav } from './nav';
import { portrait } from './portrait';

/** Stufen-Auswahl eines Acts (oder Infinite, oder der Standard-Stage). Ohne `stageId`: der naechste offene Act laut Weltkarte. */
export function buildStageSelect(nav: Nav, stageId?: string): HTMLElement {
  const f = metaFrame('stage', 'stage.title', nav);
  void (async () => {
    let id = stageId;
    if (!id) {
      const w = await getBackend().worldView();
      id = w.ok ? (w.world.nextStageId ?? undefined) : undefined;
    }
    id = id ?? STAGE_ID;
    const [pv, sv] = await Promise.all([getBackend().playerView(), getBackend().stageView(id)]);
    if (!pv.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(pv)));
    if (!sv.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(sv)));
    const p = pv.player;
    const teamOk = teamComplete(p.team, p.teamTarget);
    const ready = teamOk && (sv.info?.unlocked ?? true);

    const info = sv.info;
    const title = f.box.querySelector('h1');
    if (title && info) title.textContent = info.kind === 'infinite' ? t('stage.infinite.title', { world: info.worldName }) : t('stage.world', { world: info.worldName, act: info.act });
    const toWorld = h('button', 'btn stage-world-btn', t('stage.toWorld'));
    toWorld.type = 'button';
    toWorld.addEventListener('click', () => nav.world());
    f.body.append(toWorld);
    if (info) {
      f.body.append(h('p', 'tagline', [info.kind === 'act' ? info.name : '', info.bossName ? t('stage.boss', { name: info.bossName }) : '', t('stage.waves', { n: info.waves })].filter(Boolean).join(' - ')));
      if (!info.unlocked && info.lock) f.body.append(h('p', 'warn stage-warn', t('stage.locked.stage', { reason: lockText(info.lock) })));
    } else f.body.append(h('p', 'tagline', t('stage.subtitle')));
    const teamRow = h('div', 'stage-team');
    if (p.team.length > 0) {
      teamRow.append(h('span', 'muted', t('lobby.teamLabel', { n: p.team.length, max: p.teamTarget })));
      for (const id of p.team) {
        const c = h('span', 'strip-unit');
        c.title = unitName(id);
        c.append(portrait(id, 32));
        teamRow.append(c);
      }
    }
    const change = h('button', 'btn stage-team-btn', t(teamOk ? 'stage.changeTeam' : 'stage.pickTeam'));
    change.type = 'button';
    change.addEventListener('click', () => nav.team());
    teamRow.append(change);
    f.body.append(teamRow);
    if (!teamOk) f.body.append(h('p', 'warn stage-warn', t(p.ownedCount === 0 ? 'stage.noUnits' : 'stage.teamIncomplete')));

    const row = h('div', 'diff-row stage-row');
    for (const d of sv.difficulties) {
      const v = stageCardView(d);
      const b = h('button', `btn diff stage-card ${d.difficulty}${v.locked ? ' locked' : ''}${v.cleared ? ' cleared' : ''}`);
      b.type = 'button';
      b.dataset.difficulty = d.difficulty;
      b.disabled = v.locked || !ready;
      b.append(h('strong', undefined, t(`difficulty.${d.difficulty}`)), h('span', 'diff-desc', t(`difficulty.${d.difficulty}.desc`)));
      if (v.locked) b.append(h('span', 'lock-reason', v.lockText ?? ''));
      else b.append(h('span', 'stage-reward', v.rewardText));
      b.append(h('span', 'stage-best', v.bestText));
      if (v.cleared) b.append(h('span', 'stage-cleared', t('stage.cleared')));
      b.addEventListener('click', () => nav.play(d.difficulty as DifficultyId, id));
      row.append(b);
    }
    f.body.append(row, h('p', 'set-note', t('stage.note')));
  })();
  return f.box;
}
