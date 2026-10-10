/** Startseite: Spieler-Level, Kartenkachel mit Medaillen, Schwierigkeit, Knoepfe zu Tuermen, Wissen, Einstellungen. */
import type { Difficulty, HeroType, TowerType } from '../../../sim/src/types';
import {
  BRANCH_NAMES, DIFFICULTIES, MAPS, MODE_IDS, TIER_COST, TOWER_TYPES, bestOf, isTowerUnlocked, knowledgePoints,
  levelFromXp, mapLock, mapById, medalsOf, unlockLevel, type MapMeta, type Profile,
} from '../meta';
import { heroPortrait, towerPortrait } from '../pixel/sprites';
import { h } from '../ui/dom';
import { MEDAL_OF, icon, medal } from './icons';
import { bar, cv, ptext } from './px';
import { previewFor } from './previews';
import { embersChip } from './store';
import { S, fmt } from './text';
import type { Ctx, View } from './types';

void BRANCH_NAMES;

/** Wie viele Turm-Stufen koennte der Spieler gerade freischalten? */
export function readyUnlocks(p: Profile): number {
  let n = 0;
  for (const t of TOWER_TYPES) {
    if (!isTowerUnlocked(p, t) || p.settings.unlockAll) continue;
    let xp = p.towerXp[t];
    const tiers = [...p.towerTiers[t]];
    // gierig, billigste zuerst: zaehlt, wie viele Kaeufe der Vorrat hergibt
    for (;;) {
      let best = -1;
      for (let i = 0; i < 3; i++) if (tiers[i] < 5 && (best < 0 || TIER_COST[tiers[i]] < TIER_COST[tiers[best]])) best = i;
      if (best < 0 || xp < TIER_COST[tiers[best]]) break;
      xp -= TIER_COST[tiers[best]];
      tiers[best]++;
      n++;
    }
  }
  return n;
}

export function levelBadge(p: Profile, big = false): HTMLElement {
  const lv = levelFromXp(p.playerXp);
  const box = h('div', `lvl ${big ? 'big' : ''}`);
  const badge = h('div', 'lvl-badge');
  badge.append(h('span', 'lvl-cap', S.home.level), ptext(String(lv.level), big ? 5 : 4, 'yellow'));
  const right = h('div', 'lvl-right');
  const b = bar('xp');
  b.set(lv.into / lv.need);
  right.append(b.el, h('div', 'lvl-xp num', `${fmt(lv.into)} / ${fmt(lv.need)} ${S.home.xp}`));
  box.append(badge, right);
  return box;
}

/** Text im Schloss einer Karte: "Reach level 8 or earn Medium on Lanternfall Meadow". */
export function mapLockText(m: MapMeta): string {
  if (!m.unlock) return '';
  const d = m.unlock.medal.difficulty;
  return S.maps.lockedBy(m.unlock.level, mapById(m.unlock.medal.map)?.name ?? m.unlock.medal.map, d[0].toUpperCase() + d.slice(1));
}

/** Vorschau einer Karte als Leinwand (160 x 90, ganzzahlig vergroessert); bis sie gemalt ist, ein dunkler Platzhalter. */
export function previewCanvas(id: string, scale: number, cls = ''): HTMLElement {
  const box = h('div', `pv-box ${cls}`.trim());
  box.style.width = `${160 * scale}px`;
  box.style.height = `${90 * scale}px`;
  const put = (c: HTMLCanvasElement): void => {
    c.className = 'px pv';
    c.style.width = `${160 * scale}px`;
    c.style.height = `${90 * scale}px`;
    box.replaceChildren(c);
  };
  const now = previewFor(id, put);
  if (now) put(now);
  else box.append(h('div', 'pv-wait', 'Painting\u2026'));
  return box;
}

/** Eine Kachel der Kartenwahl. */
function mapTile(ctx: Ctx, p: Profile, m: MapMeta): HTMLElement {
  const lock = mapLock(p, m.id);
  const medals = medalsOf(p, m.id);
  const all = medals.easy && medals.medium && medals.hard;
  const tile = h('button', `maptile tier-${m.tier} ${lock.unlocked ? '' : 'locked'} ${all ? 'gold' : ''}`.trim());
  tile.dataset.map = m.id;
  tile.disabled = !lock.unlocked;
  const art = h('div', 'mt-art');
  art.append(previewCanvas(m.id, 2, lock.unlocked ? '' : 'dim'));
  art.append(h('div', 'mt-tier', S.maps.tier[m.tier] ?? m.tierName));
  if (all) {
    const tag = h('div', 'mapflag');
    tag.append(cv(icon('star'), 2), h('span', '', S.maps.allMedals));
    art.append(tag);
  }
  if (!lock.unlocked) {
    const l = h('div', 'mt-lock');
    l.append(cv(icon('lock'), 3), h('span', '', mapLockText(m)));
    art.append(l);
  }
  const info = h('div', 'mt-info');
  info.append(h('div', 'map-name', m.name), h('div', 'mt-sub', S.maps.rounds(m.maxRound, m.boss)));
  const row = h('div', 'medals');
  for (const d of DIFFICULTIES) {
    const mm = h('div', `medal ${medals[d] ? 'on' : 'off'}`);
    mm.dataset.diff = d;
    const best = bestOf(p, m.id, d);
    mm.append(cv(medal(MEDAL_OF[d], medals[d]), 2), h('div', 'medal-d', S.home.difficulty[d]), h('div', 'medal-b num', best ? `Best R${best.round}` : '-'));
    mm.title = best ? S.home.best(best.round) : S.home.noBest;
    row.append(mm);
  }
  const modeTotal = (MODE_IDS.length - 1) * 3;
  info.append(row);
  art.append(h('div', 'mt-modes num', S.maps.modeMedals(countModeMedals(p, m.id), modeTotal)));
  tile.append(art, info);
  tile.onclick = () => { if (lock.unlocked) { ctx.sound('click'); ctx.map = m.id; ctx.go({ name: 'setup', map: m.id }); } else ctx.sound('error'); };
  return tile;
}

/** Medaillen der Zusatzmodi auf einer Karte (ohne Standard). */
export function countModeMedals(p: Profile, map: string): number {
  let n = 0;
  for (const mode of MODE_IDS) if (mode !== 'standard') { const m = medalsOf(p, map, mode); n += (m.easy ? 1 : 0) + (m.medium ? 1 : 0) + (m.hard ? 1 : 0); }
  return n;
}

export function homeView(ctx: Ctx): View {
  const p = ctx.store.profile;
  const el = h('div', 'scr home');

  // ---- Kopf
  const top = h('header', 'top');
  const logo = h('div', 'logo');
  logo.append(ptext(S.title, 5, 'amber', 'ink', 'logo-t'), h('div', 'logo-sub', 'Defend the lanterns'));
  const head = levelBadge(p);
  const pts = knowledgePoints(p).free;
  if (pts > 0) {
    const chip = h('button', 'chip good');
    chip.append(cv(icon('star'), 2), h('span', '', S.home.points(pts)));
    chip.onclick = () => { ctx.sound('click'); ctx.go({ name: 'knowledge' }); };
    head.append(chip);
  }
  const embers = embersChip(p.embers);
  embers.el.classList.add('home-embers');
  top.append(logo, embers.el, head);

  // ---- Mitte: Kartenwahl (Runde 15): drei Kacheln mit Vorschau, Stufe, Medaillen und Schloss
  const mid = h('div', 'mid maps');
  mid.append(h('div', 'h2', S.maps.title));
  const grid = h('div', 'maptiles');
  for (const m of MAPS) grid.append(mapTile(ctx, p, m));
  mid.append(grid);

  // ---- Fuss: Navigation und Aufstellung
  const foot = h('footer', 'foot');
  const nav = h('div', 'nav');
  const mk = (label: string, ic: Parameters<typeof icon>[0], badge: number, f: () => void): HTMLButtonElement => {
    const b = h('button', 'navbtn');
    b.append(cv(icon(ic), 3), h('span', '', label));
    if (badge > 0) b.append(h('i', 'badge num', String(badge)));
    b.onclick = () => { ctx.sound('click'); f(); };
    return b;
  };
  nav.append(
    mk(S.home.towers, 'bolt', readyUnlocks(p), () => ctx.go({ name: 'towers' })),
    mk(S.home.knowledge, 'book', pts, () => ctx.go({ name: 'knowledge' })),
    mk(S.home.store, 'tag', 0, () => ctx.go({ name: 'store' })),
    mk(S.home.settings, 'gear', 0, () => ctx.go({ name: 'settings' })),
  );
  const line = h('div', 'lineup');
  line.append(h('div', 'h2', S.home.lineup));
  const crew = h('div', 'crew');
  const names: Record<string, string> = { ranger: 'Ranger', bombardier: 'Bombardier', frostcaller: 'Frostcaller', longshot: 'Longshot', market: 'Lantern Market', thornweaver: 'Thornweaver', alchemist: 'Alchemist', riverkeeper: 'Riverkeeper', bellringer: 'Bellringer', tinker: 'Tinker', wren: 'Wren', bram: 'Bram', sela: 'Sela' };
  for (const id of [...TOWER_TYPES, 'wren'] as (TowerType | HeroType)[]) {
    const ok = isTowerUnlocked(p, id);
    const c = h('div', `crew-i ${ok ? '' : 'locked'}`);
    const port = id === 'wren' || id === 'bram' || id === 'sela' ? heroPortrait() : towerPortrait(id);
    const art = cv(port, 2, ok ? '' : 'dim');
    c.append(art, h('div', 'crew-n', names[id]));
    if (!ok) {
      const lk = h('div', 'crew-lock');
      lk.append(cv(icon('lock'), 2), h('span', '', S.home.lockedAt(unlockLevel(id))));
      c.append(lk);
    }
    crew.append(c);
  }
  line.append(crew);
  foot.append(nav, line);

  el.append(top, mid, foot);
  return { el };
}

export type { Difficulty };
