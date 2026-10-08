/**
 * Weltkarte (Runde 8 / P3): Welten als Reiter, darunter die 6 Acts als Karten (gesperrt / offen / geschafft) und der Infinite-Modus;
 * unten Legend Stages und Raids als "Coming later" (Daten-Geruest). Ein Klick auf einen offenen Act oeffnet die Stufen-Auswahl.
 * Daten kommen von `Backend.worldView()`, Texte aus `world-model.ts`. Gestaltung im Kit (Runde 8, P4): Welt-Banner, Act-Medaillons, Infinite-Banner.
 */
import { getBackend } from '../backend';
import { loadBrowserData } from '../sim';
import type { WorldCardView, WorldView } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { icon } from './kit';
import { metaFrame } from './meta-ui';
import { errorText } from './meta-model';
import type { Nav } from './nav';
import { actCardModel, comingSoonText, worldTabModel, type ActCardModel } from './world-model';

/** Welche Welt zuletzt offen war (nur diese Sitzung). */
let lastWorld: string | null = null;

function actCard(m: ActCardModel, color: string, nav: Nav, num?: number): HTMLElement {
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

export function buildWorldMap(nav: Nav): HTMLElement {
  const f = metaFrame('world', 'world.title', nav);
  void (async () => {
    const r = await getBackend().worldView();
    if (!r.ok) return void f.body.replaceChildren(h('p', 'warn', errorText(r)));
    const v = r.world;
    const open = v.worlds.filter((w) => w.unlocked);
    const nextWorld = v.worlds.find((w) => w.acts.some((a) => a.stageId === v.nextStageId));
    let current = v.worlds.find((w) => w.id === lastWorld && w.unlocked) ?? nextWorld ?? open[0] ?? v.worlds[0];

    f.body.append(h('p', 'tagline', t('world.subtitle')));
    const tabs = h('div', 'world-tabs');
    const panel = h('div', 'world-panel-slot');
    const show = (w: WorldCardView): void => {
      current = w;
      lastWorld = w.id;
      for (const b of tabs.querySelectorAll('button')) b.classList.toggle('active', (b as HTMLElement).dataset.world === w.id);
      tabs.querySelector('.world-tab.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      panel.replaceChildren(renderWorld(w, v, nav));
    };
    for (const w of v.worlds) {
      const m = worldTabModel(w);
      const b = h('button', `btn world-tab${m.locked ? ' locked' : ''}`);
      b.type = 'button';
      b.dataset.world = w.id;
      b.disabled = m.locked;
      b.style.setProperty('--world', w.palette.grass);
      const wi = h('span', 'world-ic');
      wi.append(icon(m.locked ? 'lock' : 'flag'));
      const info = h('span', 'world-info');
      info.append(h('strong', undefined, m.name), h('span', m.locked ? 'lock-reason' : 'stage-best', m.lockText ?? m.progress));
      b.append(wi, info);
      if (!m.locked) {
        const bar = h('span', 'bar world-bar');
        const fill = h('span', 'bar-fill');
        fill.style.width = `${Math.round((w.actsCleared / Math.max(1, w.acts.length)) * 100)}%`;
        bar.append(fill);
        b.append(bar);
      }
      b.addEventListener('click', () => show(w));
      tabs.append(b);
    }
    // Zehn Welten: Reiter in einer scrollbaren Zeile mit Pfeilen, der offene Reiter wird ins Bild geholt.
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
    f.body.append(strip, panel);
    const edges = (): void => {
      strip.classList.toggle('at-start', tabs.scrollLeft < 4);
      strip.classList.toggle('at-end', tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4);
    };
    tabs.addEventListener('scroll', edges, { passive: true });
    window.addEventListener('resize', edges);
    requestAnimationFrame(() => {
      tabs.querySelector('.world-tab.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
      edges();
    });

    const soon = h('section', 'world-soon');
    soon.append(h('h3', undefined, t('world.soon.title')));
    const list = h('div', 'soon-list');
    for (const c of [...v.legend, ...v.raids]) {
      const e = h('span', 'soon-item');
      e.title = t('world.soon.note');
      e.append(h('strong', undefined, c.name), h('span', 'muted', comingSoonText(c)));
      list.append(e);
    }
    soon.append(list);
    f.body.append(soon);
    show(current);
  })();
  return f.box;
}
