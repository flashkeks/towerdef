/**
 * Huelle der Meta-Bildschirme: `runApp(root, { startMatch })`.
 * Laedt das Profil, zeigt ggf. den Reset-Hinweis, dann Start -> Match -> Ergebnis -> Start.
 * Das Match selbst (P3) kommt von aussen; hier wird nur Profil -> Optionen und Ergebnis -> Profil uebersetzt.
 */
import type { Difficulty, TowerType } from '../../../sim/src/types';
import { applyMatch, isTowerUnlocked, matchOptions, unlockLevel, MAP_IDS, TOWER_TYPES, type Profile } from '../meta';
import { openStore, type MetaStore } from '../meta/store';
import { startLives, toMetaResult, type MatchStartOptions, type StartMatch } from '../meta/types';
import { h } from '../ui/dom';
import { homeView } from './home';
import { knowledgeView } from './knowledge';
import { noticeView } from './notice';
import { resultView } from './result';
import { setPalette } from './px';
import { settingsView } from './settings';
import { towersView } from './towers';
import type { Ctx, Route, SoundId, View } from './types';
import './screens.css';

export interface AppOptions {
  startMatch: StartMatch;
  /** Eigener Speicher (Tests, Bilder); sonst IndexedDB/localStorage. */
  store?: MetaStore;
  /** Ton der Oberflaeche; fehlt = still. */
  sound?: (id: SoundId) => void;
  /** Lautstaerke 0..100 (Einstellungen und beim Start). */
  setVolume?: (v: number) => void;
  /** Erster Bildschirm (Bilder, Tests). */
  initial?: Route;
  /** Match-ID-Quelle; Standard: Zufall. Doppelt verbuchen verhindert `applyMatch` ueber diese ID. */
  newMatchId?: () => string;
}

export interface AppHandle {
  ctx: Ctx;
  go(r: Route): void;
}

const randomId = (): string => {
  const c = globalThis.crypto;
  return c?.randomUUID ? c.randomUUID() : `m-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
};

export function lockInfo(p: Profile): MatchStartOptions['lockInfo'] {
  const out: MatchStartOptions['lockInfo'] = {};
  for (const id of [...TOWER_TYPES, 'wren'] as (TowerType | 'wren')[]) if (!isTowerUnlocked(p, id)) out[id] = `Unlocks at level ${unlockLevel(id)}`;
  return out;
}

export async function runApp(root: HTMLElement, opts: AppOptions): Promise<AppHandle> {
  const store = opts.store ?? (await openStore());
  const sound = opts.sound ?? ((): void => undefined);
  const setVolume = opts.setVolume ?? ((): void => undefined);
  const newId = opts.newMatchId ?? randomId;
  setVolume(store.profile.settings.volume);

  const shell = h('div', 'dw-screens');
  setPalette(shell);
  let view: View | null = null;
  let playing = false;

  const mount = (v: View): void => {
    view?.dispose?.();
    view = v;
    shell.replaceChildren(v.el);
    shell.scrollTop = 0;
  };

  const ctx: Ctx = {
    root,
    store,
    difficulty: 'medium',
    sound,
    setVolume,
    async update(p) {
      await store.update(p);
    },
    go(r) {
      switch (r.name) {
        case 'home': return mount(homeView(ctx));
        case 'knowledge': return mount(knowledgeView(ctx));
        case 'towers': return mount(towersView(ctx, r.tower));
        case 'settings': return mount(settingsView(ctx));
        case 'notice': return mount(noticeView(ctx));
        case 'result': return mount(resultView(ctx, r.info));
      }
    },
    play(d: Difficulty) {
      if (playing) return;
      playing = true;
      void playMatch(d).finally(() => { playing = false; });
    },
  };

  async function playMatch(difficulty: Difficulty): Promise<void> {
    const map = MAP_IDS[0];
    const before = store.profile;
    const mo = matchOptions(before);
    const startOpts: MatchStartOptions = { map, difficulty, unlocks: mo.unlocks, mods: mo.mods, lockInfo: lockInfo(before) };
    view?.dispose?.();
    view = null;
    let outcome;
    try {
      outcome = await opts.startMatch(root, startOpts);
    } catch (e) {
      console.error('startMatch failed', e);
      root.replaceChildren(shell);
      ctx.go({ name: 'home' });
      return;
    }
    // Das Match darf die Huelle ersetzt haben: wieder einhaengen
    root.replaceChildren(shell);
    const res = toMetaResult(outcome, { matchId: newId(), map, startLives: startLives(difficulty, mo.mods) });
    if (outcome.quit && res.roundsCleared === 0) return ctx.go({ name: 'home' });
    const { profile, report } = applyMatch(store.profile, res);
    await store.update(profile);
    ctx.go({
      name: 'result',
      info: {
        won: outcome.won, quit: !!outcome.quit, round: outcome.round, difficulty, report,
        towerXpBefore: { ...before.towerXp }, towerXpAfter: { ...profile.towerXp }, livesLost: res.livesLost,
      },
    });
  }

  root.replaceChildren(shell);
  ctx.go(opts.initial ?? (store.profile.showResetNotice ? { name: 'notice' } : { name: 'home' }));
  return { ctx, go: (r) => ctx.go(r) };
}
