/**
 * Ergebnis nach dem Match: XP-Balken fuellt sich animiert, Level-Up mit Freischalt-Karten, neue Medaille,
 * Turm-XP je Turm (Balken bis zur naechsten Freischaltung), Knoepfe Again / Home.
 */
import type { TowerType } from '../../../sim/src/types';
import { MAP_NAMES, MODE_META, TIER_COST, TOWER_TYPES, levelFromXp, maxRoundOf, rewardFactors, type LevelUnlock } from '../meta';
import { heroPortrait, towerPortrait } from '../pixel/sprites';
import { h, setText } from '../ui/dom';
import { MEDAL_OF, icon, medal } from './icons';
import { emberIcon, iconPower, type PowerIconId } from '../pixel/sprites';
import { baseOf, type PowerKey } from '../powers/info';
import { embersChip } from './store';
import { bar, cv, ptext, reducedMotion } from './px';
import { S, fmt } from './text';
import type { Ctx, ResultInfo, View } from './types';

const NAMES: Record<TowerType, string> = { ranger: 'Ranger', bombardier: 'Bombardier', frostcaller: 'Frostcaller', longshot: 'Longshot', market: 'Lantern Market', thornweaver: 'Thornweaver', alchemist: 'Alchemist' };
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Kosten der billigsten noch offenen Stufe eines Turms (null = alles frei). */
function nextCost(tiers: readonly number[]): number | null {
  const open = tiers.filter((t) => t < 5).map((t) => TIER_COST[t]);
  return open.length ? Math.min(...open) : null;
}

export function resultView(ctx: Ctx, info: ResultInfo): View {
  const r = info.report;
  const p = ctx.store.profile;
  const el = h('div', `scr result ${info.won ? 'won' : 'lost'}`);
  let skip = false;
  let dead = false;

  // ---- Kopf
  const head = h('header', 'res-head');
  head.append(
    ptext(info.quit ? S.result.left : info.won ? S.result.victory : S.result.defeat, 7, info.won ? 'leaf' : info.quit ? 'silver' : 'red', 'ink', 'res-title'),
    h('div', 'res-sub', [MAP_NAMES[info.map] ?? info.map, info.mode === 'standard' ? '' : MODE_META[info.mode].name, S.home.difficulty[info.difficulty], S.result.round(Math.min(info.round, maxRoundOf(info.map)), maxRoundOf(info.map))].filter(Boolean).join(' \u00b7 ')),
  );
  if (r.newMedal) {
    const m = h('div', 'res-medal');
    m.append(cv(medal(MEDAL_OF[r.newMedal], true), 4, 'pop'), h('span', '', S.result.newMedal(S.home.difficulty[r.newMedal])));
    head.append(m);
  } else if (r.newBest && !r.duplicate) {
    head.append(h('div', 'res-best', S.result.newBest));
  }

  // ---- Spieler-XP
  const xpCard = h('section', 'card xp-card');
  xpCard.append(h('div', 'h2', 'Player XP'));
  const lvRow = h('div', 'xp-row');
  const badge = h('div', 'lvl-badge big');
  const lvNum = h('span', 'lvl-num');
  badge.append(h('span', 'lvl-cap', S.home.level), lvNum);
  const xpb = bar('xp tall');
  const xpText = h('div', 'lvl-xp num');
  const gain = h('div', 'xp-gain num', S.result.xpGained(0));
  const mid = h('div', 'xp-mid');
  mid.append(gain, xpb.el, xpText);
  lvRow.append(badge, mid);
  const banner = h('div', 'levelup hidden');
  banner.append(ptext(S.result.levelUp, 6, 'yellow', 'ink'));
  const cards = h('div', 'unlock-cards');
  xpCard.append(lvRow, banner, cards);
  if (r.duplicate) xpCard.append(h('div', 'muted', S.result.duplicate));
  // Faktoren der Karte und des Modus (Runde 15), damit man sieht, woher der Zuschlag kommt
  const rf = rewardFactors(info.map, info.mode);
  if (rf.xpBp !== 10000 || rf.embersBp !== 10000 || rf.modeBp) {
    xpCard.append(h('div', 'res-factors num', S.setup.reward((rf.xpBp / 10000).toFixed(2).replace(/0$/, ''), (rf.embersBp / 10000).toFixed(2).replace(/0$/, ''), Math.round(rf.modeBp / 100))));
  }

  const setLevelNum = (lv: number): void => {
    lvNum.replaceChildren(ptext(String(lv), 5, 'yellow'));
  };

  const addCard = (u: LevelUnlock): void => {
    const c = h('div', `ucard ${u.kind}`);
    const art = u.kind === 'tower' ? cv(towerPortrait(u.id as TowerType), 2) : u.kind === 'hero' ? cv(heroPortrait(), 2) : cv(medal('gold', true), 3);
    c.append(art, h('div', 'ucard-k', S.result.unlocked), h('div', 'ucard-t', u.title), h('div', 'ucard-d', u.text));
    cards.append(c);
  };
  /** Neu geoeffnete Karten und Modi (Runde 15) */
  const addMapCard = (kind: 'map' | 'mode', title: string, text: string): void => {
    const c = h('div', `ucard ${kind}`);
    c.append(cv(icon('flag'), 4), h('div', 'ucard-k', S.result.unlocked), h('div', 'ucard-t', title), h('div', 'ucard-d', text));
    cards.append(c);
  };
  const addPoints = (n: number): void => {
    const c = h('div', 'ucard points');
    c.append(cv(icon('star'), 4), h('div', 'ucard-k', S.result.unlocked), h('div', 'ucard-t', S.result.points(n)), h('div', 'ucard-d', 'Spend them in Knowledge.'));
    cards.append(c);
  };

  // ---- Turm-XP
  const tCard = h('section', 'card txp-card');
  tCard.append(h('div', 'h2', S.result.towerXp));
  const rows: { t: TowerType; gain: HTMLElement; b: ReturnType<typeof bar>; txt: HTMLElement; row: HTMLElement }[] = [];
  const list = h('div', 'txp-list');
  for (const t of TOWER_TYPES) {
    const row = h('div', 'txp-row');
    const g = h('span', 'txp-gain num', '+0');
    const b = bar('txp');
    const txt = h('div', 'txp-txt num');
    const name = h('div', 'txp-name');
    name.append(h('span', '', NAMES[t]), g);
    const mid2 = h('div', 'txp-mid');
    mid2.append(name, b.el, txt);
    row.append(cv(towerPortrait(t), 2), mid2);
    list.append(row);
    rows.push({ t, gain: g, b, txt, row });
  }
  tCard.append(list);
  if (!Object.keys(r.towerXpGained).length) tCard.append(h('div', 'muted', S.result.noTowerXp));

  const showTower = (k: (typeof rows)[number], f: number): void => {
    const gained = r.towerXpGained[k.t] ?? 0;
    // Die Sim fuehrt das Konto im Match (Freischalten zieht XP ab): Balken laufen vom Stand vor den Rundengewinnen zum Endkonto.
    const end = info.towerXpAfter[k.t];
    const start = Math.max(0, end - gained);
    const xp = Math.round(start + (end - start) * f);
    setText(k.gain, gained ? `+${fmt(Math.round(gained * f))}` : '');
    const cost = nextCost(p.towerTiers[k.t]);
    if (p.settings.unlockAll || cost === null) {
      k.b.set(1);
      setText(k.txt, `${fmt(xp)} XP · ${S.result.allDone}`);
      k.row.classList.remove('ready');
    } else {
      k.b.set(Math.min(1, xp / cost));
      const ready = xp >= cost;
      setText(k.txt, ready ? `${fmt(xp)} XP · ${S.result.ready}` : `${fmt(xp)} XP · ${S.result.nextAt(cost)}`);
      k.row.classList.toggle('ready', ready);
    }
  };

  // ---- Embers und verbrauchte Powers (Runde 12)
  const eCard = h('section', 'card embers-card');
  eCard.append(h('div', 'h2', S.result.embers));
  const eTotal = h('div', 'em-total');
  const eGain = h('div', 'em-gain num', '+0');
  const eChip = embersChip(info.embersBefore);
  eTotal.append(cv(emberIcon(0), 4), eGain, eChip.el);
  const eLines = h('div', 'em-lines');
  const parts: [string, number][] = [[S.result.embersFrom.rounds, r.embers?.rounds ?? 0], [S.result.embersFrom.win, r.embers?.win ?? 0], [S.result.embersFrom.medal, r.embers?.medal ?? 0], [S.result.embersFrom.levelUp, r.embers?.levelUp ?? 0]];
  for (const [label, n] of parts) { const z = n === 0 ? ' zero' : ''; eLines.append(h('span', z.trim(), label), h('span', `num${z}`, `+${n}`)); }
  eCard.append(eTotal, eLines);
  const used = Object.entries(info.powersUsed ?? {}).filter(([, n]) => (n ?? 0) > 0) as [PowerKey, number][];
  const usedBox = h('div', 'pw-used');
  usedBox.dataset.used = String(r.powersUsed ?? 0);
  usedBox.append(h('span', '', used.length ? S.result.powersUsed : S.result.powersNone));
  if (used.length) {
    usedBox.append(h('span', 'num', String(r.powersUsed ?? used.reduce((a, [, n]) => a + n, 0))));
    const ic = h('div', 'pw-icons');
    for (const [k, n] of used) { const w = h('span', 'pw-ic1'); w.title = `${k} x${n}`; w.append(cv(iconPower(baseOf(k) as PowerIconId), 2)); ic.append(w); }
    usedBox.append(ic);
  }
  eCard.append(usedBox);
  const rightCol = h('div', 'res-col');
  rightCol.append(tCard, eCard);

  // ---- Knoepfe
  const btns = h('div', 'res-btns');
  const again = h('button', 'btn-big play');
  again.append(ptext(S.result.again, 4, 'white'), cv(icon('arrow'), 3));
  again.onclick = () => { ctx.sound('click'); ctx.play(info.difficulty); };
  const home = h('button', 'btn-big alt', S.result.home);
  home.onclick = () => { ctx.sound('click'); ctx.go({ name: 'home' }); };
  const skipBtn = h('button', 'btn-link', S.result.skip);
  skipBtn.onclick = () => { skip = true; };
  btns.append(home, again);
  const ready = TOWER_TYPES.some((t) => { const c = nextCost(p.towerTiers[t]); return c !== null && !p.settings.unlockAll && p.towerXp[t] >= c; });
  if (ready) {
    const tw = h('button', 'btn-big alt gold', S.result.toTower);
    tw.onclick = () => { ctx.sound('click'); ctx.go({ name: 'towers' }); };
    btns.prepend(tw);
  }

  const body = h('div', 'res-body');
  body.append(xpCard, rightCol);
  el.append(head, body, btns, skipBtn);
  el.onclick = (e) => { if (e.target === el) skip = true; };

  // ---- Ablauf
  setLevelNum(r.levelBefore);
  const l0 = levelFromXp(r.xpBefore);
  xpb.set(l0.into / l0.need);
  setText(xpText, `${fmt(l0.into)} / ${fmt(l0.need)} ${S.home.xp}`);
  rows.forEach((k) => showTower(k, 0));

  const run = async (): Promise<void> => {
    const fast = reducedMotion();
    await wait(fast ? 0 : 350);
    const dur = fast ? 1 : Math.min(3600, 900 + r.xpGained * 1.1);
    const t0 = performance.now();
    let shownLevel = r.levelBefore;
    const nextUnlocks = [...r.unlocks];
    for (;;) {
      if (dead) return;
      const f = skip ? 1 : Math.min(1, (performance.now() - t0) / dur);
      const ef = f >= 1 ? 1 : 1 - Math.pow(1 - f, 1.7);
      const xp = Math.round(r.xpBefore + r.xpGained * ef);
      const lv = levelFromXp(xp);
      setText(gain, S.result.xpGained(Math.round(r.xpGained * ef)));
      xpb.set(lv.into / lv.need);
      setText(xpText, `${fmt(lv.into)} / ${fmt(lv.need)} ${S.home.xp}`);
      while (shownLevel < lv.level) {
        shownLevel++;
        setLevelNum(shownLevel);
        badge.classList.remove('pulse');
        void badge.offsetWidth;
        badge.classList.add('pulse');
        banner.classList.remove('hidden');
        ctx.sound('levelup');
        for (const u of nextUnlocks.filter((x) => x.level === shownLevel)) { addCard(u); ctx.sound('unlock'); }
        if (!fast && !skip) await wait(420);
      }
      for (const k of rows) showTower(k, Math.max(0, Math.min(1, (f * dur - 250) / Math.max(1, dur - 250))));
      if (f >= 1) break;
      await new Promise<void>((res) => requestAnimationFrame(() => res()));
    }
    for (const k of rows) showTower(k, 1);
    // Embers zaehlen hoch (animiert, mit Tick-Ton)
    const gained = r.embersGained ?? 0;
    if (gained > 0) {
      const steps = fast || skip ? 1 : Math.min(24, gained);
      for (let i = 1; i <= steps; i++) {
        if (dead) return;
        const v = Math.round((gained * i) / steps);
        eGain.textContent = `+${fmt(v)}`;
        eChip.set(info.embersBefore + v, false);
        if (steps > 1) { ctx.sound('ember'); await wait(36); }
      }
    }
    eGain.textContent = `+${fmt(gained)}`;
    eChip.set(info.embersAfter, false);
    for (const id of r.unlockedMaps) { addMapCard('map', MAP_NAMES[id] ?? id, 'New map'); ctx.sound('unlock'); }
    for (const u of r.unlockedModes) { addMapCard('mode', MODE_META[u.mode].name, `New mode on ${MAP_NAMES[u.map] ?? u.map}`); ctx.sound('unlock'); }
    if (r.pointsGained > 0) { addPoints(r.pointsGained); }
    el.dataset.done = '1';
  };
  void run();

  return { el, dispose: () => { dead = true; } };
}
