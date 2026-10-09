/**
 * Schlichte App-Huelle (Runde 11 / P3): Startbildschirm (Schwierigkeit waehlen) -> Match -> Ergebnis. P4 ersetzt diese zwei
 * Bildschirme; die Schnittstelle ist klein: `startMatch(root, opts) -> Promise<MatchResult>` (siehe match/match.ts).
 */
import { DATA, MAX_ROUND, type Difficulty } from '../sim';
import { composeMeadow } from '../pixel/map/compose';
import { t } from '../i18n/t';
import { h } from '../ui/dom';
import { startMatch, type MatchResult, type StartOptions } from '../match/match';
import { displayName } from '../match/info';
import { HERO_TYPES, TOWER_TYPES } from '../match/tower-text';
import { audio } from '../audio/engine';
import { heroPortrait, towerPortrait } from '../match/sprites';
import { copyCanvas, uiIcon } from '../match/ui-icons';
import './app.css';

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

function backdrop(): HTMLElement {
  const bg = h('div', 'app-bg');
  const cv = composeMeadow(0).toCanvas();
  cv.className = 'app-bg-cv';
  bg.append(cv);
  return bg;
}

export function startScreen(root: HTMLElement): Promise<Difficulty> {
  return new Promise((resolve) => {
    audio.attach();
    const screen = h('div', 'app-screen');
    const box = h('div', 'app-box pxbox');
    box.append(h('div', 'app-title', t('game.title')), h('div', 'app-map', t('start.map')), h('div', 'app-sub', t('start.sub')));
    // Figuren
    const crew = h('div', 'app-crew');
    for (const ty of [...TOWER_TYPES, ...HERO_TYPES]) {
      const s = ty === 'wren' ? heroPortrait() : towerPortrait(ty);
      const c = h('div', 'app-crew-i');
      c.append(copyCanvas(s.canvas, 3), h('span', '', displayName(ty)));
      crew.append(c);
    }
    box.append(crew, h('div', 'app-h', t('start.title')));
    let pick: Difficulty = 'medium';
    const row = h('div', 'app-diffs');
    const btns = DIFFS.map((d) => {
      const b = h('button', 'app-diff');
      b.dataset.diff = d;
      const lives = h('span', 'app-lives');
      lives.append(uiIcon('heart', 2), h('b', 'num', String(DATA.difficulties[d].lives)));
      b.append(h('b', '', t(`start.${d}`)), lives, h('span', '', t(`start.${d}Text`)));
      b.onclick = () => { pick = d; btns.forEach((x) => x.classList.toggle('on', x === b)); audio.play('click'); };
      if (d === pick) b.classList.add('on');
      row.append(b);
      return b;
    });
    box.append(row);
    const play = h('button', 'm-start app-play');
    play.append(uiIcon('play', 3), h('span', '', t('start.play')));
    play.onclick = () => { screen.remove(); resolve(pick); };
    box.append(play, h('div', 'app-ctl', t('start.controls')));
    screen.append(backdrop(), box);
    root.replaceChildren(screen);
  });
}

export function resultScreen(root: HTMLElement, r: MatchResult): Promise<'again' | 'menu'> {
  return new Promise((resolve) => {
    const screen = h('div', 'app-screen');
    const box = h('div', `app-box pxbox result ${r.won ? 'won' : 'lost'}`);
    box.append(h('div', 'app-title', t(r.won ? 'result.title.won' : 'result.title.lost')), h('div', 'app-map', t('result.round', { n: r.round })));
    const pops = h('div', 'app-pops');
    for (const ty of [...TOWER_TYPES, ...HERO_TYPES]) {
      const s = ty === 'wren' ? heroPortrait() : towerPortrait(ty);
      const c = h('div', 'app-crew-i');
      c.append(copyCanvas(s.canvas, 2), h('span', '', displayName(ty)), h('b', 'num', String(r.pops[ty] ?? 0)));
      pops.append(c);
    }
    box.append(h('div', 'app-h', t('result.pops')), pops);
    box.append(h('div', 'app-h', `${t('result.upgrades')}: ${r.upgrades.length}`));
    const again = h('button', 'm-start app-play', t('result.again'));
    again.onclick = () => resolve('again');
    const menu = h('button', 'm-quit', t('result.menu'));
    menu.onclick = () => resolve('menu');
    box.append(again, menu);
    screen.append(backdrop(), box);
    root.replaceChildren(screen);
  });
}

/** Hauptschleife der Huelle. URL-Parameter fuer Pruefskripte: ?diff=easy|medium|hard (ueberspringt den Startbildschirm), ?seed=N, ?debug */
export async function runApp(root: HTMLElement): Promise<void> {
  const q = new URLSearchParams(location.search);
  let quick = q.get('diff') as Difficulty | null;
  for (;;) {
    const difficulty = quick && DIFFS.includes(quick) ? quick : await startScreen(root);
    const opts: StartOptions = { difficulty, debug: q.has('debug'), seed: q.has('seed') ? Number(q.get('seed')) : undefined };
    // Pruefhilfe: ?lock zeigt die Sperren (P4 liefert im echten Spiel Freischaltungen und Texte)
    if (q.has('lock')) {
      opts.unlocks = { towers: ['ranger'], maxTier: { ranger: [3, 2, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } };
      opts.lockInfo = { bombardier: t('match.unlockLevel', { n: 2 }), frostcaller: t('match.unlockLevel', { n: 4 }), wren: t('match.unlockLevel', { n: 3 }) };
    }
    quick = null;
    const res = await startMatch(root, opts);
    if (res.quit) continue;
    const next = await resultScreen(root, res);
    if (next === 'again') quick = difficulty;
  }
}

void MAX_ROUND;
