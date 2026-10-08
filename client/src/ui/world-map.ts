/**
 * Weltkarte (Runde 8 / P3): Welten als Reiter, darunter die 6 Acts als Karten (gesperrt / offen / geschafft) und der Infinite-Modus.
 * Runde 9 / P3: Umschalter Story / Legend Stages / Raids (8 + 11 spielbare Eintraege, gleiche Reiter-Zeile und Act-Karten), Raid-Shop-Knopf mit
 * Raid-Marken, Material-Anzeige. Ein Klick auf einen offenen Act oeffnet die Stufen-Auswahl.
 * Daten kommen von `Backend.worldView()`, Texte aus `world-model.ts`. Gestaltung im Kit (Runde 8, P4): Welt-Banner, Act-Medaillons, Infinite-Banner.
 */
import { getBackend } from '../backend';
import { loadBrowserData } from '../sim';
import type { ModeCardView, WorldCardView, WorldView } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { icon } from './kit';
import { metaFrame } from './meta-ui';
import { errorText } from './meta-model';
import type { Nav } from './nav';
import { actCardModel, affinityChips, modeActCardModel, modeTabModel, worldTabModel, type ActCardModel, type MapMode, type WorldTabModel } from './world-model';

/** Welche Welt / Legend Stage / welcher Raid zuletzt offen war und welcher Umschalter (nur diese Sitzung). */
let lastWorld: string | null = null;
let lastMode: MapMode = 'worlds';
const lastCard: Record<'legend' | 'raids', string | null> = { legend: null, raids: null };

function actCard(m: ActCardModel, color: string, nav: Nav, num?: number, extra?: string): HTMLElement {
  const b = h('button', `btn act-card ${m.state}${m.infinite ? ' infinite' : ''}`);
  b.type = 'button';
  b.dataset.stage = m.stageId;
  b.dataset.state = m.state;
  b.disabled = m.state === 'locked';
  b.style.setProperty('--world', color);
  const medal = h('span', 'act-medal');
  medal.append(m.state === 'locked' ? icon('lock') : m.state === 'cleared' ? icon('check') : m.infinite ? icon('crown') : h('span', 'num', String(num ?? '')));
  b.append(medal, h('strong', 'act-title', m.title));
  if (m.bossText) {
    const boss = h('span', 'act-boss');
    boss.append(icon('skull'), m.bossText);
    b.append(boss);
  }
  const waves = h('span', 'act-waves');
  waves.append(icon('flag'), m.wavesText);
  b.append(waves);
  if (m.lockText) {
    const lr = h('span', 'lock-reason');
    lr.append(icon('lock'), m.lockText);
    b.append(lr);
  } else b.append(h('span', 'stage-best', m.bestText));
  if (extra && m.state !== 'locked') b.append(h('span', 'stage-reward', extra));
  if (m.state === 'cleared') b.append(h('span', 'stage-cleared', t('world.cleared')));
  if (m.infinite && m.state !== 'locked') b.append(h('span', 'stage-reward', t('world.infinite.reward')));
  b.addEventListener('click', () => nav.stage(m.stageId));
  return b;
}

/** Kleine Kartenansicht der Welt (Zonenmaske in den Farben der Farbwelt), zeigt Pfadform und Groesse. */
function mapThumb(stageId: string): HTMLElement | null {
  const stage = loadBrowserData().stages[stageId];
  if (!stage) return null;
  const rows = stage.zones.rows;
  const cols = rows[0].length;
  const px = Math.max(4, Math.floor(180 / cols));
  const wrap = h('figure', 'world-thumb');
  const cv = document.createElement('canvas');
  cv.width = cols * px;
  cv.height = rows.length * px;
  const c = cv.getContext('2d');
  if (!c) return null;
  const th = stage.theme;
  const col = { '.': th?.grass.color ?? '#3a6', h: th?.hill?.top ?? '#6a4', '#': th?.hill?.wallDark ?? '#222', p: th?.path.color ?? '#dd8' } as Record<string, string>;
  rows.forEach((row, y) => {
    for (let x = 0; x < cols; x++) {
      c.fillStyle = col[row[x]] ?? col['.'];
      c.fillRect(x * px, y * px, px, px);
    }
  });
  const [sx, sy] = stage.path[0];
  const [bx, by] = stage.path[stage.path.length - 1];
  c.fillStyle = '#4dffb8';
  c.fillRect(sx * px, sy * px, px, px);
  c.fillStyle = '#ff5d6c';
  c.fillRect(bx * px, by * px, px, px);
  cv.setAttribute('role', 'img');
  wrap.append(cv, h('figcaption', undefined, t('world.mapsize', { cols, rows: rows.length })));
  return wrap;
}

function renderWorld(w: WorldCardView, v: WorldView, nav: Nav): HTMLElement {
  const box = h('section', 'world-panel kp corners');
  box.dataset.world = w.id;
  box.style.setProperty('--world', w.palette.grass);
  box.style.setProperty('--world-path', w.palette.path);
  const head = h('div', 'world-head');
  head.append(h('p', 'tagline world-blurb', w.blurb));
  const thumb = mapThumb(w.acts[0].stageId);
  if (thumb) head.append(thumb);
  box.append(head);
  const grid = h('div', 'act-grid');
  for (const a of w.acts) {
    const m = actCardModel(a);
    const c = actCard(m, w.palette.grass, nav, a.act);
    if (a.stageId === v.nextStageId) c.classList.add('next');
    grid.append(c);
  }
  box.append(grid, actCard(actCardModel(w.infinite), w.palette.path, nav));
  return box;
}

/** Legend Stage / Raid: Kopf (Anreisser, Karte, Resistenzen, Material bzw. Garantie) und Act-Karten. */
function renderMode(m: ModeCardView, v: WorldView, nav: Nav): HTMLElement {
  const box = h('section', 'world-panel mode-panel kp corners');
  box.dataset.mode = m.kind;
  box.dataset.id = m.id;
  box.style.setProperty('--world', m.palette.grass);
  box.style.setProperty('--world-path', m.palette.path);
  const head = h('div', 'world-head');
  const info = h('div', 'mode-info');
  info.append(h('p', 'tagline world-blurb', m.blurb), h('p', 'mode-host', t('world.host', { world: m.hostWorldName })));
  const chips = h('div', 'affin-row');
  const ac = affinityChips(m.affinity);
  for (const kind of ['resist', 'weak'] as const) {
    const of = ac.filter((c) => c.kind === kind);
    if (of.length === 0) continue;
    const g = h('span', `affin-group ${kind}`);
    g.append(h('span', 'affin-label', t(kind === 'resist' ? 'world.affin.resist' : 'world.affin.weak')));
    for (const c of of) g.append(h('span', `tag-pill affin ${kind}`, kind === 'resist' ? `${c.label} ${c.value}` : `${c.label} +${c.value}%`));
    chips.append(g);
  }
  if (chips.childElementCount > 0) info.append(chips);
  if (m.material) {
    const mat = h('p', 'mode-drop');
    mat.append(icon('shard'), t('world.drop', { name: m.material.name }));
    info.append(mat);
  }
  if (m.guarantee) {
    const g = m.guarantee;
    const row = h('div', 'guarantee');
    const done = Math.min(g.progress, g.clears);
    row.append(h('span', 'guarantee-text', g.granted ? t('world.guarantee.done', { unit: g.unitName }) : t('world.guarantee', { n: g.clears, unit: g.unitName })));
    const bar = h('span', 'bar guarantee-bar');
    const fill = h('span', 'bar-fill');
    fill.style.width = `${g.granted ? 100 : Math.round((done / g.clears) * 100)}%`;
    bar.append(fill);
    row.append(bar, h('span', 'muted guarantee-count', g.granted ? '' : t('world.guarantee.progress', { done, n: g.clears })));
    row.dataset.progress = String(g.progress);
    info.append(row);
  }
  head.append(info);
  const thumb = mapThumb(m.acts[0].stageId);
  if (thumb) head.append(thumb);
  box.append(head);
  const grid = h('div', `act-grid${m.acts.length === 1 ? ' single' : ''}`);
  for (const a of m.acts) {
    const am = modeActCardModel(a, m);
    const c = actCard(am, m.palette.grass, nav, a.act, am.rewardText);
    if (a.unlocked && !a.cleared && m.acts.every((x) => x.act >= a.act || x.cleared)) c.classList.add('next');
    grid.append(c);
  }
  box.append(grid);
  void v;
  return box;
}

interface StripItem extends WorldTabModel {
  color: string;
  icon: string;
  pct: number;
}

/** Zeile aus Reitern (Welten, Legend Stages oder Raids) mit Pfeilen; `onPick` zeigt den Inhalt. */
function buildStrip(items: StripItem[], activeId: string | undefined, onPick: (id: string) => void): { strip: HTMLElement; activate(id: string): void } {
  const tabs = h('div', 'world-tabs');
  for (const m of items) {
    const b = h('button', `btn world-tab${m.locked ? ' locked' : ''}`);
    b.type = 'button';
    b.dataset.world = m.id;
    b.disabled = m.locked;
    b.style.setProperty('--world', m.color);
    const wi = h('span', 'world-ic');
    wi.append(icon(m.locked ? 'lock' : m.icon));
    const info = h('span', 'world-info');
    info.append(h('strong', undefined, m.name), h('span', m.locked ? 'lock-reason' : 'stage-best', m.lockText ?? m.progress));
    b.append(wi, info);
    if (!m.locked) {
      const bar = h('span', 'bar world-bar');
      const fill = h('span', 'bar-fill');
      fill.style.width = `${m.pct}%`;
      bar.append(fill);
      b.append(bar);
    }
    b.addEventListener('click', () => onPick(m.id));
    tabs.append(b);
  }
  const strip = h('div', 'world-strip');
  const arrow = (dir: -1 | 1): HTMLButtonElement => {
    const b = h('button', `btn world-arrow ${dir < 0 ? 'prev' : 'next'}`);
    b.type = 'button';
    b.setAttribute('aria-label', t(dir < 0 ? 'world.scroll.prev' : 'world.scroll.next'));
    b.append(icon(dir < 0 ? 'back' : 'arrow'));
    b.addEventListener('click', () => tabs.scrollBy({ left: dir * Math.max(240, tabs.clientWidth * 0.8), behavior: 'smooth' }));
    return b;
  };
  strip.append(arrow(-1), tabs, arrow(1));
  const edges = (): void => {
    strip.classList.toggle('at-start', tabs.scrollLeft < 4);
    strip.classList.toggle('at-end', tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4);
  };
  tabs.addEventListener('scroll', edges, { passive: true });
  window.addEventListener('resize', edges);
  const activate = (id: string): void => {
    for (const b of tabs.querySelectorAll('button')) b.classList.toggle('active', (b as HTMLElement).dataset.world === id);
    tabs.querySelector('.world-tab.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };
  if (activeId) for (const b of tabs.querySelectorAll('button')) b.classList.toggle('active', (b as HTMLElement).dataset.world === activeId);
  requestAnimationFrame(() => {
    tabs.querySelector('.world-tab.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    edges();
  });
  return { strip, activate };
}

export function buildWorldMap(nav: Nav, startMode?: MapMode): HTMLElement {
  const f = metaFrame('world', 'world.title', nav);
  void (async () => {
    const r = await getBackend().worldView();
    if (!r.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(r)));
    const v = r.world;
    if (startMode) lastMode = startMode;

    // Kopf: Umschalter Story / Legend / Raids, rechts Raid-Marken, Material und Raid-Shop
    const bar = h('div', 'mode-bar');
    const seg = h('div', 'mode-seg');
    const content = h('div', 'mode-content');
    const modes: { id: MapMode; label: string; count: string }[] = [
      { id: 'worlds', label: t('world.mode.worlds'), count: `${v.worlds.filter((w) => w.unlocked).length}/${v.worlds.length}` },
      { id: 'legend', label: t('world.mode.legend'), count: `${v.legend.filter((m) => m.unlocked).length}/${v.legend.length}` },
      { id: 'raids', label: t('world.mode.raids'), count: `${v.raids.filter((m) => m.unlocked).length}/${v.raids.length}` },
    ];
    const segBtns = new Map<MapMode, HTMLButtonElement>();
    for (const m of modes) {
      const b = h('button', 'btn mode-btn');
      b.type = 'button';
      b.dataset.mode = m.id;
      b.append(icon(m.id === 'worlds' ? 'flag' : m.id === 'legend' ? 'crown' : 'swords'), h('strong', undefined, m.label), h('span', 'mode-count', m.count));
      b.addEventListener('click', () => show(m.id));
      segBtns.set(m.id, b);
      seg.append(b);
    }
    const side = h('div', 'mode-side');
    const marks = h('span', 'w-item mode-marks');
    marks.title = t('wallet.raid');
    const mb = h('span', 'w-icon raid');
    mb.append(icon('mark', 'fill'));
    marks.append(mb, h('span', 'w-val', v.raidMarks.toLocaleString('en-US')));
    const mats = h('span', 'mode-mats');
    mats.title = v.materials.length ? v.materials.map((m) => `${m.name} x${m.count}`).join(', ') : t('world.materials.none');
    const mi = h('span', 'w-icon material');
    mi.append(icon('shard', 'fill'));
    mats.append(mi, h('span', 'w-val', String(v.materials.reduce((n, m) => n + m.count, 0))));
    const shopBtn = h('button', 'btn small mode-shop');
    shopBtn.type = 'button';
    shopBtn.dataset.go = 'raidshop';
    shopBtn.append(icon('bag'), t('world.raidshop'));
    shopBtn.addEventListener('click', () => nav.raidShop());
    side.append(marks, mats, shopBtn);
    bar.append(seg, side);
    f.body.append(bar, content);

    const showWorlds = (): void => {
      const open = v.worlds.filter((w) => w.unlocked);
      const nextWorld = v.worlds.find((w) => w.acts.some((a) => a.stageId === v.nextStageId));
      const current = v.worlds.find((w) => w.id === lastWorld && w.unlocked) ?? nextWorld ?? open[0] ?? v.worlds[0];
      const panelSlot = h('div', 'world-panel-slot');
      const items: StripItem[] = v.worlds.map((w) => ({ ...worldTabModel(w), color: w.palette.grass, icon: 'flag', pct: Math.round((w.actsCleared / Math.max(1, w.acts.length)) * 100) }));
      const st = buildStrip(items, current.id, (id) => pick(id));
      const pick = (id: string): void => {
        const w = v.worlds.find((x) => x.id === id)!;
        lastWorld = w.id;
        st.activate(w.id);
        panelSlot.replaceChildren(renderWorld(w, v, nav));
      };
      content.replaceChildren(h('p', 'tagline', t('world.subtitle')), st.strip, panelSlot);
      lastWorld = current.id;
      panelSlot.replaceChildren(renderWorld(current, v, nav));
    };

    const showModes = (kind: 'legend' | 'raids'): void => {
      const list = kind === 'legend' ? v.legend : v.raids;
      const open = list.filter((m) => m.unlocked);
      const nextCard = list.find((m) => m.unlocked && m.actsCleared < m.acts.length);
      const current = list.find((m) => m.id === lastCard[kind] && m.unlocked) ?? nextCard ?? open[0] ?? list[0];
      const panelSlot = h('div', 'world-panel-slot');
      const items: StripItem[] = list.map((m) => ({ ...modeTabModel(m), color: m.palette.grass, icon: kind === 'legend' ? 'crown' : 'swords', pct: Math.round((m.actsCleared / Math.max(1, m.acts.length)) * 100) }));
      const st = buildStrip(items, current.id, (id) => pick(id));
      const pick = (id: string): void => {
        const m = list.find((x) => x.id === id)!;
        lastCard[kind] = m.id;
        st.activate(m.id);
        panelSlot.replaceChildren(renderMode(m, v, nav));
      };
      content.replaceChildren(h('p', 'tagline', t(kind === 'legend' ? 'world.legend.subtitle' : 'world.raids.subtitle')), st.strip, panelSlot);
      lastCard[kind] = current.id;
      panelSlot.replaceChildren(renderMode(current, v, nav));
    };

    function show(mode: MapMode): void {
      lastMode = mode;
      for (const [id, b] of segBtns) b.classList.toggle('active', id === mode);
      f.box.dataset.mode = mode;
      if (mode === 'worlds') showWorlds();
      else showModes(mode);
    }
    show(lastMode);
  })();
  return f.box;
}
