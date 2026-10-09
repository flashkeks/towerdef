/** Turm-Detail: Turm gross (animiert), 3 Pfade x 5 Stufen mit Effekt, Turm-XP, Freischalten per Klick, Vorschau beim Ueberfahren. */
import type { Tiers, TowerType } from '../../../sim/src/types';
import { DATA } from '../../../sim/src/data';
import { TOWER_TYPES, isTowerUnlocked, tierCost, unlockLevel, unlockTier } from '../meta';
import { PAL } from '../pixel/palette';
import { PATH_ACCENT, iconUpgrade, towerSprite, TOWER_FRAMES } from '../pixel/sprites';
import { h, setClass } from '../ui/dom';
import { icon } from './icons';
import { topBar } from './knowledge';
import { blit, cv, ptext, reducedMotion } from './px';
import { S, fmt } from './text';
import type { Ctx, View } from './types';

const NAMES: Record<TowerType, string> = { ranger: 'Ranger', bombardier: 'Bombardier', frostcaller: 'Frostcaller' };
const FACING = 6;

let lastUnlocked: string | null = null;
let selected: TowerType = 'ranger';

/** Spielbare Kombination: Hauptpfad voll, ein Nebenpfad bis 2, der dritte 0 (Crosspath-Regel). */
export function legalTiers(t: readonly number[]): Tiers {
  const idx = [0, 1, 2].sort((a, b) => t[b] - t[a]);
  const out: Tiers = [0, 0, 0];
  out[idx[0]] = t[idx[0]];
  out[idx[1]] = Math.min(2, t[idx[1]]);
  return out;
}

export function towersView(ctx: Ctx, tower?: TowerType): View {
  if (tower) selected = tower;
  const p = ctx.store.profile;
  const el = h('div', 'scr towers');
  const t = selected;
  const data = DATA.towers[t];
  const unlockedTower = isTowerUnlocked(p, t);
  const all = p.settings.unlockAll;
  const tiers: Tiers = all ? [5, 5, 5] : [...p.towerTiers[t]] as Tiers;

  const xpChip = h('div', 'chip');
  xpChip.append(cv(icon('bolt'), 2), h('span', 'num', `${S.towers.xp}: ${fmt(p.towerXp[t])}`));
  el.append(topBar(ctx, S.towers.title, xpChip));

  // ---- Reiter
  const tabs = h('div', 'tabs');
  for (const id of TOWER_TYPES) {
    const ok = isTowerUnlocked(p, id);
    const b = h('button', `tab ${id === t ? 'sel' : ''}`);
    b.append(cv(iconUpgrade(id, 0, 1), 2, ok ? '' : 'dim'), h('span', '', NAMES[id]));
    if (!ok) b.append(cv(icon('lock'), 2));
    b.onclick = () => { ctx.sound('click'); ctx.go({ name: 'towers', tower: id }); };
    tabs.append(b);
  }
  el.append(tabs);

  const body = h('div', 'tbody');

  // ---- links: Turm gross
  const left = h('aside', 'tleft card');
  const stage = h('div', 'tstage');
  const art = document.createElement('canvas');
  art.className = 'px tower-art';
  stage.append(art);
  const shadow = h('div', 'tshadow');
  stage.append(shadow);
  left.append(stage, h('div', 'tname', NAMES[t]), h('div', 'tdesc', data.desc));
  const tierLine = h('div', 'tierline');
  left.append(h('div', 'tprev', S.towers.preview), tierLine);
  if (!unlockedTower) left.append(h('div', 'twarn', S.towers.lockedTower(unlockLevel(t))));
  if (all) left.append(h('div', 'tdev', S.towers.unlockedAll));
  left.append(h('div', 'thow', S.towers.howto));

  let shown: Tiers = legalTiers(tiers);
  let frame = 0;
  let hoverLabel: string | null = null;
  const draw = (): void => {
    const f = TOWER_FRAMES[frame % 4];
    blit(art, towerSprite(t, shown, FACING, f), 5);
    tierLine.textContent = hoverLabel ?? S.towers.best;
  };
  draw();
  const timer = reducedMotion() ? 0 : window.setInterval(() => { frame++; draw(); }, 170);

  // ---- rechts: drei Pfade
  const paths = h('div', 'tpaths');
  data.paths.forEach((path, pi) => {
    const col = h('section', `tpath card p${pi}`);
    const accent = PAL[PATH_ACCENT[pi]];
    col.style.setProperty('--accent', accent);
    col.append(h('div', 'tpath-n', S.towers.paths[t][pi] ?? path.name));
    path.tiers.forEach((tier, ti) => {
      const n = ti + 1;
      const done = tiers[pi] >= n;
      const isNext = tiers[pi] === ti;
      const cost = tierCost(n);
      const afford = p.towerXp[t] >= cost;
      const can = unlockedTower && isNext && afford && !all;
      const cell = h('div', `ttier ${done ? 'done' : isNext ? 'next' : 'later'} ${can ? 'can' : ''} ${lastUnlocked === `${t}${pi}${n}` ? 'fresh' : ''}`);
      cell.tabIndex = 0;
      cell.append(cv(iconUpgrade(t, pi as 0 | 1 | 2, n), 3, done || isNext ? '' : 'dim'));
      const txt = h('div', 'ttier-txt');
      txt.append(h('div', 'ttier-n', tier.name), h('div', 'ttier-d', tier.desc));
      const meta = h('div', 'ttier-m num');
      meta.append(h('span', 'tier-tag', S.towers.tier(n)), h('span', 'muted', S.towers.price(tier.price)));
      txt.append(meta);
      cell.append(txt);
      if (done) {
        const ck = h('div', 'ttier-ck');
        ck.append(cv(icon('check'), 2));
        ck.title = S.towers.unlocked;
        cell.append(ck);
      } else if (isNext && unlockedTower) {
        const act = h('div', 'ttier-a');
        const b = h('button', `unlock ${can ? '' : 'off'}`);
        b.append(cv(icon('bolt'), 2), h('span', 'num', `${S.towers.unlock} ${fmt(cost)}`));
        b.disabled = !can;
        b.onclick = (e) => {
          e.stopPropagation();
          const r = unlockTier(ctx.store.profile, t, pi as 0 | 1 | 2);
          if (!r.ok) { ctx.sound('error'); return; }
          ctx.sound('unlock');
          lastUnlocked = `${t}${pi}${r.tier}`;
          void ctx.update(r.profile).then(() => ctx.go({ name: 'towers', tower: t }));
        };
        act.append(b);
        if (!afford) act.append(h('div', 'need num', S.towers.needXp(cost - p.towerXp[t])));
        cell.append(act);
      }
      const preview = (): void => {
        const hi = [...tiers] as Tiers;
        hi[pi] = n;
        shown = n > 2 ? ([0, 0, 0].map((_, i) => (i === pi ? n : 0)) as Tiers) : legalTiers(hi);
        hoverLabel = `${S.towers.paths[t][pi] ?? path.name} · ${S.towers.tier(n)}`;
        draw();
        setClass(cell, 'hover', true);
      };
      const restore = (): void => { shown = legalTiers(tiers); hoverLabel = null; draw(); setClass(cell, 'hover', false); };
      cell.addEventListener('pointerenter', preview);
      cell.addEventListener('pointerleave', restore);
      cell.addEventListener('focus', preview);
      cell.addEventListener('blur', restore);
      col.append(cell);
    });
    paths.append(col);
  });

  body.append(left, paths);
  el.append(body);
  setTimeout(() => { lastUnlocked = null; }, 0);
  return { el, dispose: () => { if (timer) clearInterval(timer); } };
}
