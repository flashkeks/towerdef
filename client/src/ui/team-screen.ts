/**
 * Team: sechs Units aus der eigenen Sammlung (`setTeam`). Ersetzt die feste Auswahl "6 aus 8" (Runde 6). Nur besessene Units sind waehlbar;
 * das Ziel ist `min(6, Anzahl besessener Units)` (`PlayerView.teamTarget`). Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { CollectionUnitView } from '../backend/meta';
import { t } from '../i18n/t';
import { unitTags } from '../view/readability';
import { clear, h } from './dom';
import { notify } from './flash';
import { metaFrame, newKey } from './meta-ui';
import { cleanTeam, errorText, rarityName, sortUnits, starsText, teamComplete, toggleTeam, unitName } from './meta-model';
import type { Nav } from './nav';
import { portrait } from './portrait';
import { unitDefMap } from './unit-defs';

export function buildTeam(nav: Nav): HTMLElement {
  const f = metaFrame('team', 'team.title', nav);
  void (async () => {
    const [pv, cv] = await Promise.all([getBackend().playerView(), getBackend().collectionView()]);
    if (!pv.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(pv)));
    if (!cv.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(cv)));
    const owned = cv.units.filter((u) => u.owned);
    const ownedIds = new Set(owned.map((u) => u.unitId));
    const target = pv.player.teamTarget;
    if (target === 0) {
      f.body.append(h('p', 'muted', t('team.noUnits')));
      const go = h('button', 'btn primary', t('lobby.summon'));
      go.addEventListener('click', () => nav.summon());
      f.body.append(go);
      return;
    }
    let team = cleanTeam(pv.player.team, ownedIds, target);
    const defs = unitDefMap();

    const slots = h('div', 'team-slots');
    const count = h('p', 'team-count');
    const save = h('button', 'btn team-save', t('team.save'));
    const play = h('button', 'btn primary team-play', t('team.savePlay'));
    const grid = h('div', 'unit-grid team-pick');

    const tile = (u: CollectionUnitView): HTMLElement => {
      const c = h('button', `unit-tile r-${u.rarity}${team.includes(u.unitId) ? ' picked' : ''}`);
      c.type = 'button';
      c.dataset.unit = u.unitId;
      c.setAttribute('aria-pressed', String(team.includes(u.unitId)));
      c.append(portrait(u.unitId, 64), h('strong', 'ut-name', unitName(u.unitId)), h('span', 'ut-sub', `${t('units.lv', { n: u.level })} ${starsText(u.stars, u.maxStars)}`));
      const d = defs.get(u.unitId);
      if (d) {
        const tags = h('span', 'utags');
        for (const tag of unitTags(d)) {
          const s = h('span', `utag ${tag}`, t(`tag.${tag}.sym`));
          s.title = t(`tag.${tag}.tip`);
          tags.append(s);
        }
        c.append(tags);
      }
      c.title = `${rarityName(u.rarity)} - ${unitName(u.unitId)}`;
      c.addEventListener('click', () => {
        team = toggleTeam(team, u.unitId, ownedIds, target);
        refresh();
      });
      return c;
    };

    const refresh = (): void => {
      clear(slots);
      for (let i = 0; i < target; i++) {
        const id = team[i];
        const s = h('button', `team-slot${id ? ' filled' : ''}`);
        s.type = 'button';
        if (id) {
          s.dataset.unit = id;
          s.title = t('team.slot.remove', { name: unitName(id) });
          s.append(portrait(id, 48), h('span', 'slot-name', unitName(id)));
          s.addEventListener('click', () => {
            team = team.filter((x) => x !== id);
            refresh();
          });
        } else {
          s.disabled = true;
          s.append(h('span', 'slot-empty', String(i + 1)));
        }
        slots.append(s);
      }
      clear(grid);
      for (const u of sortUnits(owned)) grid.append(tile(u));
      const ok = teamComplete(team, target);
      count.textContent = ok ? t('team.count', { n: team.length, max: target }) : `${t('team.count', { n: team.length, max: target })} - ${t('team.need', { max: target })}`;
      save.disabled = !ok;
      play.disabled = !ok;
    };

    const doSave = async (thenPlay: boolean): Promise<void> => {
      save.disabled = true;
      play.disabled = true;
      const r = await getBackend().setTeam(team, newKey());
      if (!r.ok) {
        notify(errorText(r), 'error');
        refresh();
        return;
      }
      team = [...r.team];
      notify(t('team.saved'), 'good', 2200);
      if (thenPlay) nav.world();
      else refresh();
    };
    save.addEventListener('click', () => void doSave(false));
    play.addEventListener('click', () => void doSave(true));

    const row = h('div', 'diff-row');
    row.append(save, play);
    f.body.append(h('p', 'tagline', t('team.subtitle', { n: target, total: owned.length })), slots, count, grid, row);
    refresh();
  })();
  return f.box;
}
