/**
 * Challenge-Editor (Runde 16 E): eine Seite, kein Scrollen bei 1280 x 720, im Stil der Setup-Seite.
 * Der Code unten ist immer der aktuelle Stand; ungueltige Eingaben zeigen die Meldung der Sim und sperren Test play / Copy code.
 * Eigene Wellen gibt es im Code und in der Sim, im Editor noch nicht (offener Punkt).
 */
import { ChallengeError, DATA, defaultRules, encodeChallenge, normalizeRules, challengeHeroes, challengeTowers, type ChallengeRules, type Tiers } from '../../../sim/src/index';
import { MAPS } from '../meta';
import { heroPortrait, towerPortrait } from '../pixel/sprites';
import { h, setClass } from '../ui/dom';
import { icon } from './icons';
import { topBar } from './knowledge';
import { cv, ptext } from './px';
import { copyButton, linkOf } from './challenge-ui';
import type { Ctx, View } from './types';

const HP_OPTS = [50, 75, 100, 125, 150, 200, 300];
const SPEED_OPTS = [75, 100, 125, 150, 200];

export function challengeEditView(ctx: Ctx, initial?: ChallengeRules): View {
  const el = h('div', 'scr setup ch-edit');
  el.append(topBar(ctx, 'Create challenge'));
  const backBtn = el.querySelector('.subtop button') as HTMLButtonElement;
  backBtn.onclick = () => { ctx.sound('click'); ctx.go({ name: 'challenges' }); };

  // Entwurf: wie ChallengeRules, aber Zahlen duerfen kurz ungueltig sein (Eingabefeld leer)
  const d: ChallengeRules = initial ? { ...initial, maxTier: [...initial.maxTier] as Tiers, towers: initial.towers ? [...initial.towers] : null } : { ...defaultRules(ctx.map || 'meadow', 'medium', Math.floor(Math.random() * 2 ** 31)) };
  const allTowers = challengeTowers();
  const heroes = challengeHeroes();
  const sections: (() => void)[] = [];
  const refresh = (): void => { for (const f of sections) f(); update(); };

  const seg = <T,>(opts: { v: T; label: string; title?: string }[], get: () => T, set: (v: T) => void, cls = ''): HTMLElement => {
    const box = h('div', `seg ${cls}`.trim());
    const bs = opts.map((o) => {
      const b = h('button', '', o.label);
      if (o.title) b.title = o.title;
      b.onclick = () => { ctx.sound('click'); set(o.v); refresh(); };
      box.append(b);
      return [o, b] as const;
    });
    sections.push(() => bs.forEach(([o, b]) => setClass(b, 'sel', o.v === get())));
    return box;
  };
  const card = (title: string, ...kids: HTMLElement[]): HTMLElement => {
    const c = h('section', 'card');
    c.append(h('div', 'h2', title), ...kids);
    return c;
  };
  const row = (label: string, control: HTMLElement): HTMLElement => {
    const r = h('div', 'ed-row');
    r.append(h('span', '', label), control);
    return r;
  };
  const num = (get: () => number | null, set: (v: number | null) => void, ph: string, label: string): HTMLInputElement => {
    const i = h('input', 'ch-input ed-num');
    i.type = 'number';
    i.placeholder = ph;
    i.setAttribute('aria-label', label);
    i.onkeydown = (e) => e.stopPropagation();
    i.oninput = () => { set(i.value === '' ? null : Number(i.value)); update(); };
    sections.push(() => { if (document.activeElement !== i) i.value = get() === null ? '' : String(get()); });
    return i;
  };
  const sw = (label: string, get: () => boolean, set: (v: boolean) => void, title = ''): HTMLElement => {
    const b = h('button', 'ed-sw');
    b.append(h('i'), h('span', '', label));
    b.title = title;
    b.setAttribute('role', 'switch');
    b.onclick = () => { ctx.sound('click'); set(!get()); refresh(); };
    sections.push(() => { setClass(b, 'on', get()); b.setAttribute('aria-checked', String(get())); });
    return b;
  };

  // ---- Spalte 1: Karte, Schwierigkeit, Runden
  const mapSeg = seg(MAPS.map((m) => ({ v: m.id, label: m.name, title: m.name })), () => d.map, (v) => { d.map = v; }, 'maps');
  const diffSeg = seg((['easy', 'medium', 'hard'] as const).map((v) => ({ v, label: v[0].toUpperCase() + v.slice(1) })), () => d.difficulty, (v) => {
    const wasDefault = d.endRound === DATA.difficulties[d.difficulty].endRound;
    d.difficulty = v;
    if (wasDefault && d.startRound === 1) d.endRound = DATA.difficulties[v].endRound;
  });
  const start = num(() => d.startRound, (v) => { d.startRound = v ?? NaN; }, '1', 'Start round');
  const end = num(() => d.endRound, (v) => { d.endRound = v ?? NaN; }, '60', 'End round');
  const hint = h('div', 'ed-hint');
  sections.push(() => { hint.textContent = `Normal game: rounds 1 to ${DATA.difficulties[d.difficulty].endRound}. Up to 120.`; });
  const col1 = h('div', 'ed-col');
  col1.append(card('Map', mapSeg), card('Difficulty', diffSeg), card('Rounds', row('First round', start), row('Last round', end), hint));

  // ---- Spalte 2: Tuerme, Held, Hoechststufe
  const tiles = h('div', 'ed-tiles');
  const on = (t: string): boolean => !d.towers || d.towers.includes(t as never);
  const tileEls = allTowers.map((t) => {
    const b = h('button', 'ed-tile');
    b.dataset.tower = t;
    b.append(cv(towerPortrait(t), 1), h('span', '', DATA.towers[t].name));
    b.onclick = () => {
      const cur = d.towers ? [...d.towers] : [...allTowers];
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      if (next.length === 0) { ctx.sound('error'); return; }
      ctx.sound('click');
      d.towers = next.length === allTowers.length ? null : next;
      refresh();
    };
    tiles.append(b);
    return [t, b] as const;
  });
  sections.push(() => tileEls.forEach(([t, b]) => setClass(b, 'off', !on(t))));
  const allNone = h('div', 'seg');
  const bAll = h('button', '', 'All');
  bAll.onclick = () => { ctx.sound('click'); d.towers = null; refresh(); };
  const bOne = h('button', '', 'First only');
  bOne.title = 'Only the first tower';
  bOne.onclick = () => { ctx.sound('click'); d.towers = [allTowers[0]]; refresh(); };
  allNone.append(bAll, bOne);
  const towersCard = card('Towers', tiles, allNone);

  const heroOpts = [{ v: 'any' as string, label: 'Any' }, { v: 'none', label: 'No hero' }, ...heroes.map((x) => ({ v: x as string, label: DATA.hero[x].name }))];
  const heroSeg = seg(heroOpts, () => d.hero as string, (v) => { d.hero = v as ChallengeRules['hero']; });
  void heroPortrait;
  const tierSeg = seg([0, 1, 2, 3, 4, 5].map((v) => ({ v, label: v === 5 ? 'No cap' : `T${v}` })), () => (d.maxTier[0] === d.maxTier[1] && d.maxTier[1] === d.maxTier[2] ? d.maxTier[0] : -1), (v) => { d.maxTier = [v, v, v]; });
  const col2 = h('div', 'ed-col');
  col2.append(towersCard, card('Hero', heroSeg), card('Highest upgrade tier', tierSeg));

  // ---- Spalte 3: Geld, Leben, Schalter, Gegner
  const cash = num(() => d.startCash, (v) => { d.startCash = v; }, 'Auto', 'Starting gold');
  const lives = num(() => d.lives, (v) => { d.lives = v; }, 'Auto', 'Lives');
  const sws = h('div', 'ed-switches');
  sws.append(
    sw('No selling', () => d.noSell, (v) => { d.noSell = v; }),
    sw('No powers', () => d.noPowers, (v) => { d.noPowers = v; }),
    sw('No knowledge', () => d.noKnowledge, (v) => { d.noKnowledge = v; }, 'Ignore Knowledge Tree bonuses'),
    sw('No income', () => d.incomePct === 0, (v) => { d.incomePct = v ? 0 : 100; }, 'No gold from pops, rounds or markets'),
  );
  const hpSeg = seg((HP_OPTS.includes(d.hpPct) ? HP_OPTS : [...HP_OPTS, d.hpPct].sort((a, b) => a - b)).map((v) => ({ v, label: `${v}%` })), () => d.hpPct, (v) => { d.hpPct = v; });
  const spSeg = seg((SPEED_OPTS.includes(d.speedPct) ? SPEED_OPTS : [...SPEED_OPTS, d.speedPct].sort((a, b) => a - b)).map((v) => ({ v, label: `${v}%` })), () => d.speedPct, (v) => { d.speedPct = v; });
  const col3 = h('div', 'ed-col');
  col3.append(card('Economy', row('Starting gold', cash), row('Lives', lives)), card('Switches', sws), card('Enemies', row('HP', h('span')), hpSeg, row('Speed', h('span')), spSeg));

  const grid = h('div', 'ed-grid');
  grid.append(col1, col2, col3);

  // ---- Fuss: Code, Knoepfe
  const foot = h('div', 'ed-foot');
  const code = h('input', 'ch-input');
  code.readOnly = true;
  code.setAttribute('aria-label', 'Challenge code');
  const msg = h('div', 'ed-err');
  const copyCode = copyButton(ctx, 'Copy code', () => code.value, 'btn-small');
  const copyLink = copyButton(ctx, 'Copy link', () => linkOf(code.value), 'btn-small');
  const test = h('button', 'btn-big play');
  test.dataset.act = 'test-play';
  test.append(ptext('Test play', 3, 'white'), cv(icon('arrow'), 2));
  let good: ChallengeRules | null = null;
  test.onclick = () => { if (!good) { ctx.sound('error'); return; } ctx.sound('click'); ctx.playChallenge(good, { kind: 'custom', key: encodeChallenge(good), title: 'Test play', from: 'editor' }); };
  foot.append(code, copyCode, copyLink, test);

  function update(): void {
    try {
      good = normalizeRules({ ...d, startCash: d.startCash ?? null, lives: d.lives ?? null });
      code.value = encodeChallenge(good);
      msg.textContent = '';
    } catch (e) {
      good = null;
      code.value = '';
      msg.textContent = e instanceof ChallengeError ? e.message : 'These rules do not work.';
    }
    for (const b of [copyCode, copyLink, test]) b.disabled = !good;
  }

  el.append(grid, msg, foot);
  refresh();
  return { el };
}
