/** Team-Auswahl 6 aus 8 vor dem Match (gdd.md §5). Besitzer: P6. Logik in `team.ts`. */
import { createSim, loadBrowserData, STAGE_ID, type UnitDef } from '../sim';
import { t } from '../i18n/t';
import { unitColor } from '../view/model';
import { h } from './dom';
import { isComplete, loadTeam, saveTeam, TEAM_SIZE, toggleUnit } from './team';

let catalogCache: UnitDef[] | null = null;

/** Alle Units mit Kosten und Slot-Typ aus den Sim-Daten (einmal gebaut, die Sim liefert den Katalog). */
export function unitCatalog(): UnitDef[] {
  if (!catalogCache) {
    const data = loadBrowserData();
    catalogCache = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data }).catalog();
  }
  return catalogCache;
}

const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

export function buildTeamSelect(onStart: (team: string[]) => void, onBack: () => void): HTMLElement {
  const catalog = unitCatalog();
  const ids = catalog.map((d) => d.id);
  let team = loadTeam(ids);
  const box = h('div', 'dialog team');
  box.append(h('h1', 'title small', t('team.title')), h('p', 'tagline', t('team.subtitle', { n: TEAM_SIZE, total: catalog.length })));
  const grid = h('div', 'team-grid');
  const count = h('p', 'team-count');
  const go = h('button', 'btn primary team-go', t('team.start'));
  const cards = new Map<string, HTMLButtonElement>();

  const refresh = (): void => {
    for (const [id, b] of cards) {
      const on = team.includes(id);
      b.classList.toggle('picked', on);
      b.setAttribute('aria-pressed', String(on));
    }
    count.textContent = isComplete(team) ? t('team.count', { n: team.length, max: TEAM_SIZE }) : `${t('team.count', { n: team.length, max: TEAM_SIZE })} - ${t('team.need', { max: TEAM_SIZE })}`;
    go.disabled = !isComplete(team);
  };

  for (const d of catalog) {
    const b = h('button', 'btn unit-card');
    b.type = 'button';
    b.dataset.unit = d.id;
    const badge = h('span', 'badge', t(`unit.${d.id}.abbr`));
    badge.style.background = css(unitColor(d.id));
    const slot = [t(`placement.${d.placement}`), d.footprint === 2 ? t('team.big') : '', d.canHitAir ? t('team.air') : ''].filter(Boolean).join(', ');
    b.append(
      badge,
      h('strong', undefined, t(`unit.${d.id}.name`)),
      h('span', 'role', `${t(`rarity.${d.rarity}`)} - ${t(`role.${d.id}`)}`),
      h('span', 'cost', t('team.cost', { n: d.placeCost })),
      h('span', 'slottype', slot),
      h('span', 'info', t(`team.info.${d.id}`)),
    );
    b.addEventListener('click', () => {
      team = toggleUnit(team, d.id);
      saveTeam(team);
      refresh();
    });
    cards.set(d.id, b);
    grid.append(b);
  }

  go.addEventListener('click', () => {
    if (!isComplete(team)) return;
    saveTeam(team);
    onStart(catalog.filter((d) => team.includes(d.id)).map((d) => d.id));
  });
  const back = h('button', 'btn menu-back', t('menu.back'));
  back.addEventListener('click', onBack);
  const row = h('div', 'diff-row');
  row.append(back, go);
  box.append(grid, count, row);
  refresh();
  return box;
}
