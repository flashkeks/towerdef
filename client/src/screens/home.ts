/** Startseite: Spieler-Level, Kartenkachel mit Medaillen, Schwierigkeit, Knoepfe zu Tuermen, Wissen, Einstellungen. */
import type { Difficulty, HeroType, TowerType } from '../../../sim/src/types';
import {
  BRANCH_NAMES, DIFFICULTIES, MAP_IDS, MAP_NAMES, TIER_COST, TOWER_TYPES, isDifficultyUnlocked, isTowerUnlocked, knowledgePoints,
  levelFromXp, unlockLevel, type Profile,
} from '../meta';
import { heroPortrait, towerPortrait } from '../pixel/sprites';
import { h, setClass } from '../ui/dom';
import { MEDAL_OF, icon, medal } from './icons';
import { bar, cv, ptext } from './px';
import { meadowScene } from './scene';
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

  // ---- Mitte: Karte links, Schwierigkeit rechts
  const mid = h('div', 'mid');
  const mapId = MAP_IDS[0];
  const medals = p.medals[mapId] ?? { easy: false, medium: false, hard: false };
  const all = medals.easy && medals.medium && medals.hard;
  const card = h('div', `mapcard ${all ? 'gold' : ''}`);
  const scene = h('div', 'mapscene');
  scene.append(cv(meadowScene(), 4, 'scene'));
  if (all) {
    const tag = h('div', 'mapflag');
    tag.append(cv(icon('star'), 2), h('span', '', S.home.medalsDone));
    scene.append(tag);
  }
  const info = h('div', 'mapinfo');
  info.append(h('div', 'map-name', MAP_NAMES[mapId]));
  const row = h('div', 'medals');
  for (const d of DIFFICULTIES) {
    const m = h('div', `medal ${medals[d] ? 'on' : 'off'}`);
    const best = p.best[mapId]?.[d];
    m.append(cv(medal(MEDAL_OF[d], medals[d]), 3), h('div', 'medal-d', S.home.difficulty[d]), h('div', 'medal-b num', best ? S.home.best(best.round) : S.home.noBest));
    row.append(m);
  }
  info.append(row);
  card.append(scene, info);

  const side = h('aside', 'side');
  side.append(h('div', 'h2', S.home.pickDifficulty));
  const list = h('div', 'diffs');
  const btns: Record<string, HTMLButtonElement> = {};
  for (const d of DIFFICULTIES) {
    const ok = isDifficultyUnlocked(p, d);
    const b = h('button', 'diff');
    b.dataset.diff = d;
    b.disabled = !ok;
    b.append(cv(medal(MEDAL_OF[d], medals[d]), 2), h('div', 'diff-t', S.home.difficulty[d]), h('div', 'diff-s', ok ? S.home.diffText[d] : ''));
    if (!ok) {
      const lock = h('div', 'diff-lock');
      lock.append(cv(icon('lock'), 2), h('span', '', S.home.lockedAt(unlockLevel(d))));
      b.append(lock);
    }
    b.onclick = () => { ctx.difficulty = d; ctx.sound('click'); Object.entries(btns).forEach(([k, e]) => setClass(e, 'sel', k === d)); };
    btns[d] = b;
    list.append(b);
  }
  if (!isDifficultyUnlocked(p, ctx.difficulty)) ctx.difficulty = 'medium';
  setClass(btns[ctx.difficulty], 'sel', true);
  const play = h('button', 'btn-big play app-play');
  play.append(ptext(S.home.play, 4, 'white'), cv(icon('arrow'), 3));
  play.onclick = () => { ctx.sound('click'); ctx.play(ctx.difficulty); };
  side.append(list, play);
  mid.append(card, side);

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
  const names: Record<string, string> = { ranger: 'Ranger', bombardier: 'Bombardier', frostcaller: 'Frostcaller', longshot: 'Longshot', market: 'Lantern Market', thornweaver: 'Thornweaver', alchemist: 'Alchemist', wren: 'Wren' };
  for (const id of [...TOWER_TYPES, 'wren'] as (TowerType | HeroType)[]) {
    const ok = isTowerUnlocked(p, id);
    const c = h('div', `crew-i ${ok ? '' : 'locked'}`);
    const port = id === 'wren' ? heroPortrait() : towerPortrait(id);
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
