/**
 * Units: Sammlung als Raster mit Seltenheits-Rahmen und Portrait, Filter (Seltenheit, Rolle, Platzierung), Detailansicht mit Werten aus den
 * Sim-Daten (`view/unit-info.ts`), Level, Sterne und Kopien, Level-Up mit Gold. Nicht besessene Units sind grau ("not owned").
 * Kein Unit-Verzeichnis ist hart verdrahtet: alles kommt aus `collectionView()` (Katalog) und der Sim (`UnitDef`). Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { CollectionUnitView } from '../backend/meta';
import { hasKey, t } from '../i18n/t';
import { statValues } from '../view/unit-info';
import { unitTags } from '../view/readability';
import { clear, h } from './dom';
import { notify } from './flash';
import { metaFrame, newKey, type MetaFrame } from './meta-ui';
import { copiesLine, errorText, filterUnits, NO_FILTER, PLACEMENT_CATS, rarityName, RARITY_ORDER, roleCat, ROLE_CATS, sortUnits, starsText, unitName, type UnitFilter } from './meta-model';
import type { Nav } from './nav';
import { portrait } from './portrait';
import { unitDefMap } from './unit-defs';

export function buildUnits(nav: Nav, initial?: string): HTMLElement {
  const f = metaFrame('units', 'units.title', nav);
  void new UnitsScreen(f, initial).load();
  return f.box;
}

type Group = 'rarity' | 'role' | 'placement';

class UnitsScreen {
  private units: CollectionUnitView[] = [];
  private filter: UnitFilter = { ...NO_FILTER };
  private selected: string | null;
  private busy = false;
  private readonly defs = unitDefMap();
  private readonly filters = h('div', 'unit-filters');
  private readonly grid = h('div', 'unit-grid');
  private readonly detail = h('aside', 'unit-detail');
  private readonly count = h('span', 'muted unit-count');

  constructor(
    private readonly f: MetaFrame,
    initial?: string,
  ) {
    this.selected = initial ?? null;
    const main = h('div', 'unit-main');
    main.append(this.filters, this.grid);
    const cols = h('div', 'units-cols');
    cols.append(main, this.detail);
    f.body.append(cols);
  }

  async load(): Promise<void> {
    const r = await getBackend().collectionView();
    if (!r.ok) {
      this.f.body.replaceChildren(h('p', 'warn', errorText(r)));
      return;
    }
    this.units = r.units;
    if (!this.selected || !this.units.some((u) => u.unitId === this.selected)) this.selected = sortUnits(this.units)[0]?.unitId ?? null;
    this.renderFilters(r.ownedCount, r.total);
    this.renderGrid();
    this.renderDetail();
  }

  private renderFilters(owned: number, total: number): void {
    clear(this.filters);
    const rows: [Group, string, readonly string[]][] = [
      ['rarity', 'units.filter.rarity', RARITY_ORDER],
      ['role', 'units.filter.role', ROLE_CATS],
      ['placement', 'units.filter.placement', PLACEMENT_CATS],
    ];
    for (const [group, label, values] of rows) {
      const row = h('div', 'filter-row');
      row.append(h('span', 'filter-label', t(label)));
      const opts: [string | null, string][] = [[null, t('units.filter.all')], ...values.map((v): [string, string] => [v, group === 'rarity' ? rarityName(v) : t(group === 'role' ? `role.cat.${v}` : `placement.${v}`)])];
      for (const [value, text] of opts) {
        const on = (this.filter[group] ?? null) === value;
        const b = h('button', `btn filter-btn${on ? ' active' : ''}`, text);
        b.type = 'button';
        b.dataset.group = group;
        b.dataset.value = value ?? '';
        b.setAttribute('aria-pressed', String(on));
        b.addEventListener('click', () => {
          this.filter = { ...this.filter, [group]: value };
          this.renderFilters(owned, total);
          this.renderGrid();
        });
        row.append(b);
      }
      this.filters.append(row);
    }
    const own = h('button', `btn filter-btn owned-only${this.filter.ownedOnly ? ' active' : ''}`, t('units.filter.owned'));
    own.type = 'button';
    own.setAttribute('aria-pressed', String(!!this.filter.ownedOnly));
    own.addEventListener('click', () => {
      this.filter = { ...this.filter, ownedOnly: !this.filter.ownedOnly };
      this.renderFilters(owned, total);
      this.renderGrid();
    });
    this.count.textContent = t('units.count', { n: owned, total });
    const last = h('div', 'filter-row');
    last.append(own, this.count);
    this.filters.append(last);
  }

  private renderGrid(): void {
    clear(this.grid);
    const list = sortUnits(filterUnits(this.units, this.defs, this.filter));
    if (list.length === 0) this.grid.append(h('p', 'muted', t('units.none')));
    for (const u of list) this.grid.append(this.card(u));
  }

  private card(u: CollectionUnitView): HTMLElement {
    const c = h('button', `unit-tile r-${u.rarity}${u.owned ? '' : ' unowned'}${u.unitId === this.selected ? ' selected' : ''}${u.inTeam ? ' inteam' : ''}`);
    c.type = 'button';
    c.dataset.unit = u.unitId;
    c.dataset.owned = String(u.owned);
    c.append(portrait(u.unitId, 64), h('strong', 'ut-name', unitName(u.unitId)));
    c.append(h('span', 'ut-sub', u.owned ? `${t('units.lv', { n: u.level })} ${starsText(u.stars, u.maxStars)}` : t('units.notOwned')));
    c.addEventListener('click', () => {
      this.selected = u.unitId;
      this.grid.querySelectorAll('.unit-tile.selected').forEach((e) => e.classList.remove('selected'));
      c.classList.add('selected');
      this.renderDetail();
    });
    return c;
  }

  private renderDetail(): void {
    clear(this.detail);
    const u = this.units.find((x) => x.unitId === this.selected);
    if (!u) {
      this.detail.append(h('p', 'muted', t('units.pick')));
      return;
    }
    const def = this.defs.get(u.unitId);
    this.detail.className = `unit-detail r-${u.rarity}${u.owned ? '' : ' unowned'}`;
    const head = h('div', 'ud-head');
    const titles = h('div', 'ud-titles');
    titles.append(h('h2', 'ud-name', unitName(u.unitId)), h('span', `ud-rarity r-${u.rarity}`, rarityName(u.rarity)));
    head.append(portrait(u.unitId, 96), titles);
    this.detail.append(head);

    if (def) {
      const tags = h('div', 'ud-tags');
      tags.append(h('span', 'ud-role', t(`role.cat.${roleCat(def)}`)));
      for (const tag of unitTags(def)) {
        const s = h('span', `utag ${tag}`, t(`tag.${tag}.sym`));
        s.title = t(`tag.${tag}.tip`);
        tags.append(s);
      }
      this.detail.append(tags);
      if (hasKey(`team.info.${u.unitId}`)) this.detail.append(h('p', 'ud-info', t(`team.info.${u.unitId}`)));
      if (def.flavor) this.detail.append(h('p', 'ud-flavor', def.flavor));
      const dl = h('dl', 'ud-stats');
      const add = (k: string, v: string): void => {
        dl.append(h('dt', undefined, k), h('dd', undefined, v));
      };
      add(t('units.placement'), [t(`placement.${def.placement}`), def.footprint === 2 ? t('team.big') : ''].filter(Boolean).join(', '));
      add(t('units.placeCost'), String(def.placeCost));
      for (const r of statValues(def, 1)) add(t(r.key), r.value);
      this.detail.append(dl);
    }

    if (!u.owned) {
      this.detail.append(h('p', 'ud-notowned', t('units.notOwned.long')));
      return;
    }
    const prog = h('div', 'ud-progress');
    prog.append(h('div', 'ud-level', t('units.level', { n: u.level, max: u.maxLevel })), h('div', 'ud-stars', starsText(u.stars, u.maxStars)), h('div', 'ud-copies muted', copiesLine(u)));
    if (u.powerBonusPct > 0) prog.append(h('div', 'ud-power', t('units.power', { n: u.powerBonusPct })));
    this.detail.append(prog);

    const up = h('button', 'btn primary levelup');
    up.type = 'button';
    up.dataset.unit = u.unitId;
    if (u.levelUpCost === null) {
      up.textContent = t('units.maxed');
      up.disabled = true;
    } else {
      up.textContent = t('units.levelUp', { cost: u.levelUpCost });
      up.disabled = !u.canLevelUp || this.busy;
    }
    up.addEventListener('click', () => void this.levelUp(u));
    this.detail.append(up);
    if (u.levelUpCost !== null && !u.canLevelUp) this.detail.append(h('p', 'muted ud-why', t('units.needGold', { n: u.levelUpCost })));
  }

  private async levelUp(u: CollectionUnitView): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.detail.querySelectorAll<HTMLButtonElement>('.levelup').forEach((b) => {
      b.disabled = true;
    });
    const r = await getBackend().levelUp(u.unitId, newKey());
    this.busy = false;
    if (!r.ok) notify(errorText(r), 'error');
    else notify(t('units.leveled', { name: unitName(u.unitId), n: r.level.level }), 'good', 2200);
    await Promise.all([this.load(), this.f.refreshWallet()]);
  }
}
