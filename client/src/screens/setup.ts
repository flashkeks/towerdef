/**
 * Start eines Matches (Runde 15 C): gewaehlte Karte gross, daneben Schwierigkeit, Modus (gesperrte mit Bedingung) und Play.
 * Medaillen je Schwierigkeit stehen an der Karte und an jedem Modus; die Belohnungsfaktoren aendern sich mit Karte und Modus.
 */
import type { Difficulty, ModeId } from '../../../sim/src/types';
import { END_ROUND, DIFFICULTIES, MODE_IDS, MODE_META, heroStore, selectHero, isDifficultyUnlocked, mapById, mapLock, medalsOf, modeLock, rewardFactors, unlockLevel, bestOf } from '../meta';
import { heroPortrait } from '../pixel/sprites';
import { h, setClass } from '../ui/dom';
import { MEDAL_OF, icon, medal } from './icons';
import { previewCanvas } from './home';
import { topBar } from './knowledge';
import { cv, ptext } from './px';
import { S } from './text';
import type { Ctx, View } from './types';

const pct = (bp: number): string => (bp / 10000).toFixed(2).replace(/0$/, '');

export function setupView(ctx: Ctx, mapId: string): View {
  const p = ctx.store.profile;
  const m = mapById(mapId) ?? mapById('meadow')!;
  // Karte gesperrt (z. B. per Link): zurueck zur Wahl
  if (!mapLock(p, m.id).unlocked) { queueMicrotask(() => ctx.go({ name: 'home' })); return { el: h('div', 'scr setup') }; }
  ctx.map = m.id;
  if (!modeLock(p, m.id, ctx.mode).unlocked) ctx.mode = 'standard';
  if (!isDifficultyUnlocked(p, ctx.difficulty)) ctx.difficulty = 'medium';

  const el = h('div', 'scr setup');
  el.append(topBar(ctx, m.name));
  const body = h('div', 'setup-body');

  // ---- links: die Karte
  const card = h('div', 'mapcard setup-map');
  const art = h('div', 'mt-art');
  art.append(previewCanvas(m.id, 3), h('div', 'mt-tier', S.maps.tier[m.tier] ?? m.tierName));
  const info = h('div', 'mt-info');
  const stdMedals = medalsOf(p, m.id);
  const row = h('div', 'medals');
  for (const d of DIFFICULTIES) {
    const mm = h('div', `medal ${stdMedals[d] ? 'on' : 'off'}`);
    const best = bestOf(p, m.id, d);
    mm.append(cv(medal(MEDAL_OF[d], stdMedals[d]), 2), h('div', 'medal-d', S.home.difficulty[d]), h('div', 'medal-b num', best ? `Best R${best.round}` : 'Not played'));
    row.append(mm);
  }
  info.append(h('div', 'mt-sub', S.maps.rounds(END_ROUND.easy, END_ROUND.medium, END_ROUND.hard)), h('div', 'setup-desc', m.desc), row);
  const fpBest = p.freeplayBest[m.id] ?? 0;
  info.append(h('div', `mt-free num ${fpBest ? 'on' : ''}`.trim(), fpBest ? S.maps.freeplayBest(fpBest) : S.maps.freeplayNone));
  card.append(art, info);

  // ---- rechts: Schwierigkeit, Modus, Play
  const side = h('div', 'setup-side');
  const reward = h('div', 'setup-reward num');
  const refreshReward = (): void => {
    const f = rewardFactors(m.id, ctx.mode);
    reward.textContent = S.setup.reward(pct(f.xpBp), pct(f.embersBp), Math.round(f.modeBp / 100));
  };

  side.append(h('div', 'h2', S.setup.difficulty));
  const diffs = h('div', 'diffs row');
  const dbtns: Record<string, HTMLButtonElement> = {};
  const std = medalsOf(p, m.id);
  for (const d of DIFFICULTIES) {
    const ok = isDifficultyUnlocked(p, d);
    const b = h('button', 'diff');
    b.dataset.diff = d;
    b.disabled = !ok;
    const best = bestOf(p, m.id, d);
    b.append(cv(medal(MEDAL_OF[d], std[d]), 2), h('div', 'diff-t', S.home.difficulty[d]), h('div', 'diff-r num', S.setup.rounds(END_ROUND[d])), h('div', 'diff-s', ok ? (best ? S.setup.best(best.round) : S.home.diffText[d]) : ''));
    if (!ok) {
      const lock = h('div', 'diff-lock');
      lock.append(cv(icon('lock'), 2), h('span', '', S.home.lockedAt(unlockLevel(d))));
      b.append(lock);
    }
    b.title = S.home.diffText[d];
    b.onclick = () => { ctx.difficulty = d; ctx.sound('click'); Object.entries(dbtns).forEach(([k, e]) => setClass(e, 'sel', k === d)); };
    dbtns[d] = b;
    diffs.append(b);
  }
  setClass(dbtns[ctx.difficulty], 'sel', true);
  side.append(diffs);

  side.append(h('div', 'h2', S.setup.mode));
  const modes = h('div', 'modes');
  const mbtns: Partial<Record<ModeId, HTMLButtonElement>> = {};
  for (const id of MODE_IDS) {
    const lock = modeLock(p, m.id, id);
    const meta = MODE_META[id];
    const b = h('button', `mode ${lock.unlocked ? '' : 'locked'}`.trim());
    b.dataset.mode = id;
    b.disabled = !lock.unlocked;
    const head = h('div', 'mode-h');
    head.append(h('span', 'mode-n', meta.name));
    const pips = h('span', 'mode-pips');
    const mm = medalsOf(p, m.id, id);
    for (const d of DIFFICULTIES) { const pip = cv(medal(MEDAL_OF[d], mm[d]), 1); pip.title = `${S.home.difficulty[d]}${mm[d] ? '' : ' (not earned)'}`; pips.append(pip); }
    head.append(pips);
    b.append(head, h('div', 'mode-d', meta.desc));
    if (id !== 'standard') b.append(h('span', 'mode-bonus', '+20%'));
    if (!lock.unlocked) {
      const l = h('div', 'mode-lock');
      l.append(cv(icon('lock'), 2), h('span', '', lock.text));
      b.append(l);
    }
    b.onclick = () => { ctx.mode = id; ctx.sound('click'); for (const [k, e] of Object.entries(mbtns)) setClass(e!, 'sel', k === id); refreshReward(); };
    mbtns[id] = b;
    modes.append(b);
  }
  setClass(mbtns[ctx.mode]!, 'sel', true);
  side.append(modes);

  // ---- Runde 16 TP: Held fuer dieses Match (Wren, Bram, Sela); gesperrte mit Bedingung, Auswahl bleibt im Profil
  const heroCol = h('div', 'setup-heroes');
  heroCol.append(h('div', 'h2', S.setup.hero));
  const heroes = h('div', 'heroes row');
  const hbtns = new Map<string, HTMLButtonElement>();
  const drawHeroes = (): void => {
    const list = heroStore(ctx.store.profile);
    for (const e of list) {
      const b = hbtns.get(e.meta.id) ?? h('button', 'hero-pick');
      b.replaceChildren();
      b.dataset.hero = e.meta.id;
      b.className = `hero-pick ${e.lock.owned ? '' : 'locked'} ${e.selected ? 'sel' : ''}`.replace(/\s+/g, ' ').trim();
      b.disabled = !e.lock.owned;
      const txt = h('div', 'hp-t');
      txt.append(h('div', 'hp-n', e.meta.short), h('div', 'hp-r', e.lock.owned ? e.meta.role : e.lock.embers === null ? `Level ${e.lock.unlockLevel}` : `Level ${e.lock.unlockLevel} or ${e.lock.embers.toLocaleString('en-US')} Embers`));
      b.append(cv(heroPortrait(), 2, 'hp-ic'), txt);
      b.title = e.lock.owned ? `${e.meta.name}: ${e.meta.desc}` : e.lock.text;
      if (!hbtns.has(e.meta.id)) {
        b.onclick = () => {
          const res = selectHero(ctx.store.profile, e.meta.id);
          if (!res.ok) { ctx.sound('error'); return; }
          ctx.sound('click');
          void ctx.update(res.profile).then(drawHeroes);
        };
        hbtns.set(e.meta.id, b);
        heroes.append(b);
      }
    }
  };
  drawHeroes();
  heroCol.append(heroes);

  const play = h('button', 'btn-big play app-play');
  play.append(ptext(S.home.play, 4, 'white'), cv(icon('arrow'), 3));
  play.onclick = () => { ctx.sound('click'); ctx.play(ctx.difficulty); };
  refreshReward();
  side.append(play, reward);

  const left = h('div', 'setup-left');
  left.append(card, heroCol);
  body.append(left, side);
  el.append(body);
  return { el };
}

export type { Difficulty };
