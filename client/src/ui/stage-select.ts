/**
 * Stage-Auswahl: der Terrassenweg mit den Stufen Normal / Hard / Nightmare. Gesperrte Stufen nennen den Grund ("Player level 5"),
 * jede Karte zeigt Erst-Clear-Belohnung und Bestwelle. Ein Klick auf eine freie Stufe startet das Match (`nav.play`). Besitzer: P4.
 */
import { getBackend } from '../backend';
import { t } from '../i18n/t';
import { STAGE_ID, type DifficultyId } from '../sim';
import { affinityChips, lockText } from './world-model';
import { h } from './dom';
import { metaFrame } from './meta-ui';
import { errorText, stageCardView, teamComplete, unitName } from './meta-model';
import type { Nav } from './nav';
import { miniOf } from './unit-card';
import { icon, panel } from './kit';

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
    const isMode = info?.kind === 'legend' || info?.kind === 'raid';
    if (title && info) {
      title.textContent = info.kind === 'infinite' ? t('stage.infinite.title', { world: info.worldName }) : isMode ? ((info.actCount ?? 1) > 1 ? t('stage.mode.title', { name: info.modeName ?? '', act: info.act }) : (info.modeName ?? '')) : t('stage.world', { world: info.worldName, act: info.act });
    }
    f.box.dataset.kind = info?.kind ?? 'standard';
    const toWorld = h('button', 'btn stage-world-btn', t('stage.toWorld'));
    toWorld.type = 'button';
    toWorld.addEventListener('click', () => nav.world(info?.kind === 'legend' ? 'legend' : info?.kind === 'raid' ? 'raids' : undefined));
    const head = panel({ corners: true, cls: 'stage-head', tag: 'section' });
    head.body.append(toWorld);
    if (info) {
      head.body.append(h('p', 'tagline', [info.kind === 'act' ? info.name : isMode ? t(info.kind === 'legend' ? 'stage.mode.legend' : 'stage.mode.raid') : '', info.bossName ? t('stage.boss', { name: info.bossName }) : '', t('stage.waves', { n: info.waves })].filter(Boolean).join(' - ')));
      if (isMode) {
        head.body.append(h('p', 'mode-host', t('world.host', { world: info.worldName })));
        const ac = affinityChips(info.affinity ?? { resist: {}, weakBp: {} });
        if (ac.length > 0) {
          const row = h('div', 'affin-row');
          for (const kind of ['resist', 'weak'] as const) {
            const of = ac.filter((c) => c.kind === kind);
            if (of.length === 0) continue;
            const g = h('span', `affin-group ${kind}`);
            g.append(h('span', 'affin-label', t(kind === 'resist' ? 'world.affin.resist' : 'world.affin.weak')));
            for (const c of of) g.append(h('span', `tag-pill affin ${kind}`, kind === 'resist' ? `${c.label} ${c.value}` : `${c.label} +${c.value}%`));
            row.append(g);
          }
          head.body.append(row);
        }
        if (info.guarantee) head.body.append(h('p', 'mode-drop', t('stage.guarantee', { unit: info.guarantee.unitName, done: Math.min(info.guarantee.progress, info.guarantee.clears), n: info.guarantee.clears })));
      }
      if (!info.unlocked && info.lock) head.body.append(h('p', 'warn stage-warn', t('stage.locked.stage', { reason: lockText(info.lock) })));
    } else head.body.append(h('p', 'tagline', t('stage.subtitle')));
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
    const change = h('button', 'btn stage-team-btn', t(teamOk ? 'stage.changeTeam' : 'stage.pickTeam'));
    change.type = 'button';
    change.addEventListener('click', () => nav.team());
    teamRow.append(change);
    head.body.append(teamRow);
    if (!teamOk) head.body.append(h('p', 'warn stage-warn', t(p.ownedCount === 0 ? 'stage.noUnits' : 'stage.teamIncomplete')));
    f.body.append(head);

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
      else {
        b.append(h('span', 'stage-reward', v.rewardText));
        if (v.extraText) b.append(h('span', 'stage-reward extra', v.extraText));
      }
      b.append(h('span', 'stage-best', v.bestText));
      if (v.cleared) b.append(h('span', 'stage-cleared', t('stage.cleared')));
      b.addEventListener('click', () => nav.play(d.difficulty as DifficultyId, id));
      row.append(b);
    }
    f.body.append(row, h('p', 'set-note', t(info?.kind === 'legend' ? 'stage.note.legend' : info?.kind === 'raid' ? 'stage.note.raid' : 'stage.note')));
  })();
  return f.box;
}
