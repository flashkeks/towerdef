/**
 * Sammlung (Runde 8, P4): Raster mit Portraet-Karten (virtuell, 561+ Units fluessig), Suche, Filter (Seltenheit, Element, Platzierung, Rolle, Besitz),
 * Sortierung (Seltenheit, Element, Platzierung, DPS, Level, Name) und Detailseite mit grossem Portraet, Werten je Upgrade-Stufe aus `UnitDef.levels`,
 * Angriffsform-Vorschau, Platz fuer Trait-Reroll und Evolution (noch gesperrt: kommt mit dem Backend von P2), Level-Up mit Gold.
 * Sichtlogik ohne DOM: `collection-model.ts`. Nicht besessene Units sind grau ("not owned"). Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { CollectionUnitView } from '../backend/meta';
import { t } from '../i18n/t';
import type { UnitDef } from '../sim';
import { statValues } from '../view/unit-info';
import { unitTags } from '../view/readability';
import { attackPreview } from './attack-preview';
import { attackShape, DEFAULT_QUERY, levelDps, primaryElement, queryCollection, seriesOptions, SORT_KEYS, unitDps, type CollectionQuery, type SortKey } from './collection-model';
import { clear, h } from './dom';
import { uiSound } from '../audio/ui-audio';
import { notify } from './flash';
import { celebrate } from './menu-fx';
import { artLayer, chip, elementIcon, elementVar, icon, panel, rarityFrame, rarityId, stars } from './kit';
import { ELEMENT_IDS } from './kit/icons';
import { confirmDialog, metaFrame, newKey, type MetaFrame } from './meta-ui';
import { copiesLine, errorText, PLACEMENT_CATS, rarityName, RARITY_ORDER, ROLE_CATS, roleCat, unitName } from './meta-model';
import type { Nav } from './nav';
import { unitMeta, cardOf } from './unit-card';
import { unitDefs } from './unit-defs';
import { VirtualGrid } from './virtual-grid';

export function buildUnits(nav: Nav, initial?: string): HTMLElement {
  const f = metaFrame('units', 'units.title', nav);
  void new UnitsScreen(f, initial).load();
  return f.box;
}

type Group = 'rarity' | 'element' | 'role' | 'placement';
const RARITY_DOT: Record<string, string> = { rare: 'var(--rare-b)', epic: 'var(--epic-b)', legendary: 'var(--legendary-b)', mythic: 'var(--mythic-b)', secret: 'var(--secret-b)', exclusive: 'var(--exclusive-b)' };
const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

class UnitsScreen {
  private units: CollectionUnitView[] = [];
  private view: CollectionUnitView[] = [];
  private query: CollectionQuery = { ...DEFAULT_QUERY };
  private selected: string | null;
  private busy = false;
  private crystals = 0;
  private previewStep: number | null = null;
  private readonly defs = unitDefs();
  private readonly filters = h('div', 'unit-filters');
  private readonly detail = h('aside', 'unit-detail');
  private readonly count = h('span', 'unit-count');
  private readonly grid = new VirtualGrid<CollectionUnitView>({ minW: 118, gap: 12, aspect: 4 / 3, make: (u) => this.card(u) });

  constructor(
    private readonly f: MetaFrame,
    initial?: string,
  ) {
    this.selected = initial ?? null;
    this.grid.el.classList.add('unit-grid');
    const main = h('div', 'unit-main');
    main.append(this.filters, this.grid.el);
    const cols = h('div', 'units-cols');
    cols.append(main, this.detail);
    f.body.append(cols);
    f.body.classList.add('no-scroll');
  }

  private readonly nameOf = (id: string): string => unitName(id);

  async load(): Promise<void> {
    const r = await getBackend().collectionView();
    if (!r.ok) {
      this.f.body.replaceChildren(h('p', 'warn', errorText(r)));
      return;
    }
    void this.f.refreshWallet().then((p) => {
      if (p && p.crystals !== this.crystals) {
        this.crystals = p.crystals;
        this.renderDetail();
      }
    });
    this.units = r.units;
    this.count.textContent = t('units.count', { n: r.ownedCount, total: r.total });
    this.renderFilters();
    this.applyQuery(this.view.length === 0);
    if (!this.selected || !this.units.some((u) => u.unitId === this.selected)) this.selected = this.view[0]?.unitId ?? null;
    this.renderDetail();
  }

  private set(patch: Partial<CollectionQuery>): void {
    this.query = { ...this.query, ...patch };
    this.renderFilters();
    this.applyQuery(true);
  }

  private applyQuery(reset: boolean): void {
    this.view = queryCollection(this.units, this.defs, this.nameOf, this.query);
    this.grid.setItems(this.view, reset);
    this.f.box.querySelector('.unit-empty')?.remove();
    if (this.view.length === 0) this.grid.el.after(h('p', 'muted unit-empty', t('units.none')));
  }

  private renderFilters(): void {
    clear(this.filters);
    const top = h('div', 'filter-top');
    const search = h('input', 'unit-search');
    search.type = 'search';
    search.placeholder = t('units.search');
    search.value = this.query.search;
    search.setAttribute('aria-label', t('units.search'));
    search.addEventListener('input', () => {
      this.query = { ...this.query, search: search.value };
      this.applyQuery(true);
    });
    const sortWrap = h('label', 'unit-sortwrap');
    const sort = h('select', 'unit-sort');
    for (const k of SORT_KEYS) {
      const o = h('option', undefined, t(`units.sort.${k}`));
      o.value = k;
      sort.append(o);
    }
    sort.value = this.query.sort;
    sort.addEventListener('change', () => this.set({ sort: sort.value as SortKey }));
    sortWrap.append(icon('sort'), h('span', undefined, t('units.sort')), sort);
    const serWrap = h('label', 'unit-sortwrap unit-serieswrap');
    const ser = h('select', 'unit-sort unit-series');
    ser.setAttribute('aria-label', t('units.filter.series'));
    const all = h('option', undefined, t('units.filter.seriesAll'));
    all.value = '';
    ser.append(all);
    for (const o of seriesOptions(this.units)) {
      const op = h('option', undefined, `${o.series} (${o.count})`);
      op.value = o.series;
      ser.append(op);
    }
    ser.value = this.query.series ?? '';
    ser.addEventListener('change', () => this.set({ series: ser.value || null }));
    serWrap.append(icon('search'), h('span', undefined, t('units.filter.series')), ser);
    const own = chip({ text: t('units.filter.owned'), active: this.query.ownedOnly, cls: 'filter-btn owned-only' });
    own.addEventListener('click', () => this.set({ ownedOnly: !this.query.ownedOnly }));
    const wrap = h('span', 'search-wrap');
    wrap.append(icon('search'), search);
    top.append(wrap, serWrap, sortWrap, own, this.count);
    this.filters.append(top);

    const rows: [Group, string, readonly string[]][] = [
      ['rarity', 'units.filter.rarity', RARITY_ORDER],
      ['element', 'units.filter.element', ELEMENT_IDS],
      ['placement', 'units.filter.placement', PLACEMENT_CATS],
      ['role', 'units.filter.role', ROLE_CATS],
    ];
    for (const [group, label, values] of rows) {
      const row = h('div', 'filter-row');
      row.append(h('span', 'filter-label', t(label)));
      const opts: [string | null, string][] = [[null, t('units.filter.all')], ...values.map((v): [string, string] => [v, group === 'rarity' ? rarityName(v) : group === 'element' ? cap(v) : t(group === 'role' ? `role.cat.${v}` : `placement.${v}`)])];
      for (const [value, text] of opts) {
        const on = (this.query[group] ?? null) === value;
        const b = chip({
          text,
          active: on,
          cls: 'filter-btn',
          dot: group === 'rarity' && value ? RARITY_DOT[value] : undefined,
          icon: group === 'element' && value ? elementIcon(value) : group === 'placement' && value ? icon(value) : undefined,
        });
        b.dataset.group = group;
        b.dataset.value = value ?? '';
        b.addEventListener('click', () => this.set({ [group]: value } as Partial<CollectionQuery>));
        row.append(b);
      }
      this.filters.append(row);
    }
  }

  private card(u: CollectionUnitView): HTMLElement {
    const c = cardOf(u, { selected: u.unitId === this.selected });
    c.addEventListener('click', () => {
      this.selected = u.unitId;
      this.previewStep = null;
      this.grid.el.querySelectorAll('.unit-tile.selected').forEach((e) => e.classList.remove('selected'));
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
    const m = unitMeta(u.unitId, u.rarity);
    const rar = rarityId(u.rarity);
    this.detail.className = `unit-detail r-${rar}${u.owned ? '' : ' unowned'}`;
    this.detail.style.setProperty('--el', elementVar(primaryElement(def)));

    // Kopf: grosses Portraet im Rahmen (laeuft), Name, Seltenheit, Elemente
    const art = h('div', 'ud-art');
    art.append(artLayer(u.unitId, m.elements, m.name.slice(0, 2).toUpperCase()), h('div', 'pc-shade'));
    const frame = rarityFrame(rar, art, { live: true, cls: `ud-card${u.owned ? '' : ' unowned'}` });
    const titles = h('div', 'ud-titles');
    titles.append(h('span', `ud-rarity r-${rar}`, rarityName(rar)), h('h2', 'ud-name', m.name), h('span', 'ud-series', m.series));
    const els = h('div', 'ud-elements');
    for (const e of m.elements.length ? m.elements : ['none']) {
      const pill = h('span', 'tag-pill ud-el');
      pill.append(elementIcon(e), cap(e));
      els.append(pill);
    }
    titles.append(els);
    const head = h('div', 'ud-head');
    head.append(frame, titles);
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
      if (def.flavor) this.detail.append(h('p', 'ud-flavor', def.flavor));
      const dl = h('dl', 'ud-stats');
      const add = (k: string, v: string): void => {
        dl.append(h('dt', undefined, k), h('dd', undefined, v));
      };
      add(t('units.placement'), [t(`placement.${def.placement}`), def.footprint === 2 ? t('team.big') : ''].filter(Boolean).join(', '));
      add(t('units.placeCost'), String(def.placeCost));
      for (const r of statValues(def, 1)) add(t(r.key), r.value);
      add(t('units.col.dps'), unitDps(def) > 0 ? unitDps(def).toFixed(1) : '-');
      this.detail.append(dl);
      this.detail.append(this.slots(u), this.stepsPanel(def));
    } else this.detail.append(this.slots(u));

    if (!u.owned) {
      this.detail.append(h('p', 'ud-notowned muted', t('units.notOwned.long')));
      return;
    }
    const prog = h('div', 'ud-progress');
    prog.append(h('div', 'ud-level', t('units.level', { n: u.level, max: u.maxLevel })), stars(u.stars, u.maxStars), h('div', 'ud-copies muted', copiesLine(u)));
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

  /** Werte je Upgrade-Stufe (Schaden, Tempo, Reichweite, DPS, Kosten) und die Form-Vorschau der gewaehlten Stufe. */
  private stepsPanel(def: UnitDef): HTMLElement {
    const p = panel({ title: t('units.steps'), tone: 'violet', cls: 'ud-steps', tag: 'div' });
    const last = def.levels.length - 1;
    const step = Math.min(this.previewStep ?? last, last);
    const table = h('table', 'ud-levels');
    const head = h('tr');
    for (const k of ['step', 'damage', 'cooldown', 'range', 'dps', 'cost']) head.append(h('th', undefined, t(`units.col.${k}`)));
    const thead = h('thead');
    thead.append(head);
    table.append(thead);
    const body = h('tbody');
    def.levels.forEach((lv, i) => {
      const rows = new Map(statValues(def, i).map((r) => [r.key, r.value]));
      const tr = h('tr', i === step ? 'on' : '');
      const dps = levelDps(lv);
      const cost = i === 0 ? def.placeCost : (def.upgradeCosts[i - 1] ?? 0);
      for (const v of [String(i + 1), rows.get('stat.damage') ?? '-', rows.get('stat.cooldown') ?? '-', rows.get('stat.range') ?? '-', dps > 0 ? dps.toFixed(1) : '-', String(cost)]) tr.append(h('td', undefined, v));
      tr.addEventListener('click', () => {
        this.previewStep = i;
        this.renderDetail();
      });
      body.append(tr);
    });
    table.append(body);
    p.body.append(table);
    const shape = attackShape(def.levels[step]);
    if (shape) {
      const rows = new Map(statValues(def, step).map((r) => [r.key, r.value]));
      const box = h('div', 'ud-shape');
      const cap2 = h('div', 'ud-shape-text');
      cap2.append(h('strong', undefined, t('units.shape')), h('span', undefined, rows.get('stat.form') ?? ''), h('span', 'muted', t('units.step', { n: step + 1 })));
      box.append(attackPreview(shape), cap2);
      p.body.append(box);
    }
    return p;
  }

  /** Trait und Evolution: Kosten sichtbar, Knoepfe sperren mit Grund; Ergebnis kurz animiert, Fehlercodes als Toast. */
  private slots(u: CollectionUnitView): HTMLElement {
    const row = h('div', 'ud-slots');
    row.append(this.traitPanel(u), this.evolvePanel(u));
    return row;
  }

  private traitPanel(u: CollectionUnitView): HTMLElement {
    const trait = panel({ title: t('units.trait'), tone: 'gold', cls: 'ud-slot ud-trait', tag: 'div' });
    const badge = h('div', `ud-trait-badge${u.trait ? ' has' : ''}`);
    badge.append(icon('trait'));
    const text = h('div', 'ud-trait-text');
    text.append(h('strong', 'ud-trait-name', u.trait?.name ?? t('units.trait.none')), h('span', 'muted', u.trait?.text ?? (u.owned ? t('units.trait.hint') : t('units.notOwned'))));
    badge.append(text);
    const reroll = h('button', 'btn small ud-reroll');
    reroll.type = 'button';
    const cost = u.rerollCost;
    reroll.append(icon('reroll'), cost !== null ? t('units.reroll.cost', { n: cost }) : t('units.reroll'));
    const poor = cost !== null && this.crystals < cost;
    reroll.disabled = !u.owned || cost === null || poor || this.busy;
    if (poor && cost !== null) reroll.title = t('units.needCrystals', { n: cost });
    reroll.addEventListener('click', () => void this.reroll(u, badge));
    trait.body.append(badge, reroll);
    if (poor && cost !== null && u.owned) trait.body.append(h('span', 'muted ud-hint', t('units.needCrystals', { n: cost })));
    return trait;
  }

  private evolvePanel(u: CollectionUnitView): HTMLElement {
    const evo = panel({ title: t('units.evolve'), tone: 'aether', cls: 'ud-slot ud-evo', tag: 'div' });
    const e = u.evolution;
    if (u.evolvedFrom) evo.body.append(h('span', 'muted ud-soon', t('units.evolvedFrom', { name: unitName(u.evolvedFrom) })));
    if (!e) {
      if (!u.evolvedFrom) evo.body.append(h('span', 'muted ud-soon', t('units.evolve.none')));
      return evo;
    }
    const to = h('div', 'ud-evo-to');
    for (const x of e.to) to.append(h('span', 'tag-pill', e.to.length > 1 ? `${x.name} ${x.chancePct}%` : x.name));
    evo.body.append(to);
    const needs = h('ul', 'ud-needs');
    for (const n of e.needs) needs.append(h('li', n.owned >= n.amount ? 'ok' : 'short', `${n.name} ${Math.min(n.owned, n.amount)}/${n.amount}`));
    if (e.material) {
      const m = e.material;
      const li = h('li', `ud-material ${m.owned >= m.amount ? 'ok' : 'short'}`, t('units.evolve.material', { name: m.name, have: Math.min(m.owned, m.amount), n: m.amount }));
      li.dataset.material = m.id;
      li.title = t('units.evolve.materialFrom', { stage: m.legendName });
      li.prepend(icon('shard'));
      needs.append(li);
    }
    evo.body.append(needs);
    if (e.material && e.material.owned < e.material.amount) evo.body.append(h('span', 'muted ud-hint ud-matfrom', t('units.evolve.materialFrom', { stage: e.material.legendName })));
    const costs = h('div', 'ud-evo-cost');
    costs.append(icon('crystal'), `${e.cost.crystals}`, icon('coin'), `${e.cost.gold}`);
    evo.body.append(costs);
    const btn = h('button', 'btn small primary ud-evolve');
    btn.type = 'button';
    btn.append(icon('evolve'), t('units.evolve.btn'));
    btn.disabled = !u.owned || !e.ready || this.busy;
    btn.addEventListener('click', () => void this.evolve(u));
    evo.body.append(btn);
    const why = !u.owned ? t('units.notOwned') : e.reason;
    if (why) evo.body.append(h('span', 'muted ud-hint', why));
    return evo;
  }

  private async reroll(u: CollectionUnitView, badge: HTMLElement): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.detail.querySelectorAll<HTMLButtonElement>('.ud-reroll, .ud-evolve, .levelup').forEach((b) => {
      b.disabled = true;
    });
    badge.classList.add('rolling');
    uiSound('summon.rumble', 0.5);
    const r = await getBackend().rerollTrait(u.unitId, newKey());
    await new Promise((res) => setTimeout(res, 650)); // kurzes Wuerfeln, das Ergebnis steht schon fest
    this.busy = false;
    if (!r.ok) {
      notify(errorText(r), 'error');
      badge.classList.remove('rolling');
      this.renderDetail();
      return;
    }
    notify(t('units.rerolled'), 'good', 2800);
    await Promise.all([this.load(), this.f.refreshWallet().then((p) => p && (this.crystals = p.crystals))]);
    this.grid.refresh();
    this.detail.querySelector('.ud-trait-badge')?.classList.add('landed');
  }

  private async evolve(u: CollectionUnitView): Promise<void> {
    if (this.busy || !u.evolution) return;
    const ok = await confirmDialog({
      title: t('units.evolve.confirm.title', { name: unitName(u.unitId) }),
      text: u.evolution.material
        ? t('units.evolve.confirm.textMat', { mat: `${u.evolution.material.amount} x ${u.evolution.material.name}`, crystals: u.evolution.cost.crystals, gold: u.evolution.cost.gold })
        : t('units.evolve.confirm.text', { crystals: u.evolution.cost.crystals, gold: u.evolution.cost.gold }),
      confirm: t('units.evolve.btn'),
    });
    if (!ok) return;
    this.busy = true;
    this.detail.querySelectorAll<HTMLButtonElement>('.ud-reroll, .ud-evolve, .levelup').forEach((b) => {
      b.disabled = true;
    });
    this.detail.querySelector('.ud-card')?.classList.add('evolving');
    const r = await getBackend().evolve(u.unitId, newKey());
    await new Promise((res) => setTimeout(res, 800));
    this.busy = false;
    if (!r.ok) {
      notify(errorText(r), 'error');
      this.renderDetail();
      return;
    }
    notify(t('units.evolved', { from: unitName(r.evolution.from), to: unitName(r.evolution.to) }), 'good', 3200);
    celebrate({ kind: 'evolve', title: t('evolve.title'), sub: `${unitName(r.evolution.from)} → ${unitName(r.evolution.to)}` });
    this.selected = r.evolution.to;
    await Promise.all([this.load(), this.f.refreshWallet().then((p) => p && (this.crystals = p.crystals))]);
    this.grid.refresh();
    const at = this.view.findIndex((x) => x.unitId === this.selected);
    this.grid.reveal(at);
    this.detail.querySelector('.ud-card')?.classList.add('evolved');
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
    else {
      notify(t('units.leveled', { name: unitName(u.unitId), n: r.level.level }), 'good', 2200);
      celebrate({ kind: 'levelup', title: t('levelup.title'), sub: t('levelup.unit', { name: unitName(u.unitId), n: r.level.level }), ms: 1600 });
    }
    await Promise.all([this.load(), this.f.refreshWallet()]);
    this.grid.refresh();
  }
}
