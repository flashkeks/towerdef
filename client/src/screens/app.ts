/**
 * Huelle der Meta-Bildschirme: `runApp(root, { startMatch })`.
 * Laedt das Profil, zeigt ggf. den Reset-Hinweis, dann Start -> Match -> Ergebnis -> Start.
 * Das Match selbst (P3) kommt von aussen; hier wird nur Profil -> Optionen und Ergebnis -> Profil uebersetzt.
 */
import type { Difficulty, TowerType } from '../../../sim/src/types';
import { applyChallenge, utcDay, applyMatch, isTowerUnlocked, matchOptions, unlockLevel, TOWER_TYPES, type Profile } from '../meta';
import type { ModeId } from '../../../sim/src/types';
import { openStore, type MetaStore } from '../meta/store';
import { startLives, toMetaResult, type MatchStartOptions, type StartMatch } from '../meta/types';
import { h } from '../ui/dom';
import { volumeButton } from '../ui/volume';
import { uiIcon } from '../match/ui-icons';
import { encodeChallenge, type ChallengeRules } from '../../../sim/src/index';
import { challengesView } from './challenges';
import { challengeEditView } from './challenge-edit';
import { challengeResultView } from './challenge-result';
import { homeView } from './home';
import { knowledgeView } from './knowledge';
import { noticeView } from './notice';
import { resultView } from './result';
import { setPalette } from './px';
import { settingsView } from './settings';
import { setupView } from './setup';
import { warmPreviews } from './previews';
import { storeView } from './store';
import { towersView } from './towers';
import type { ChallengeSource, Ctx, MenuTheme, Route, SoundId, View } from './types';
import type { VolumeApi } from '../audio/settings';
import './screens.css';

export interface AppOptions {
  startMatch: StartMatch;
  /** Eigener Speicher (Tests, Bilder); sonst IndexedDB/localStorage. */
  store?: MetaStore;
  /** Ton der Oberflaeche; fehlt = still. */
  sound?: (id: SoundId) => void;
  /** Lautstaerke-Regler (Musik/Effekte getrennt); fehlt = Attrappe im Arbeitsspeicher. */
  audio?: VolumeApi;
  /** Altes Profil-Volume (0..100) als Vorgabe, falls noch keine Lautstaerke gespeichert ist. */
  adoptLegacyVolume?: (pct: number) => void;
  /** Menue-Musik: Stimmung je Bildschirm (null = aus). */
  theme?: (t: MenuTheme | null) => void;
  /** Erster Bildschirm (Bilder, Tests). */
  initial?: Route;
  /** Match-ID-Quelle; Standard: Zufall. Doppelt verbuchen verhindert `applyMatch` ueber diese ID. */
  newMatchId?: () => string;
}

export interface AppHandle {
  ctx: Ctx;
  go(r: Route): void;
}

/** Attrappe ohne Ton (Tests, Bilder ohne Engine). */
function memoryVolume(): VolumeApi {
  const v = { music: 50, sfx: 70 };
  let quiet = false;
  return { get: () => ({ ...v }), set: (k, p) => { v[k] = p; }, toggleQuiet: () => (quiet = !quiet), get quiet() { return quiet; } };
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
  const audio = opts.audio ?? memoryVolume();
  const theme = opts.theme ?? ((): void => undefined);
  const newId = opts.newMatchId ?? randomId;
  opts.adoptLegacyVolume?.(store.profile.settings.volume);

  const shell = h('div', 'dw-screens');
  setPalette(shell);
  // Lautsprecher mit Pop-over (Musik/Effekte getrennt), auf allen Menue-Bildschirmen oben rechts
  const speaker = volumeButton(audio, (m) => uiIcon(m ? 'mute' : 'sound', 2), 'scr-vol');
  let view: View | null = null;
  let playing = false;

  const mount = (v: View, th: MenuTheme = 'dusk'): void => {
    theme(th);
    view?.dispose?.();
    view = v;
    speaker.close();
    shell.replaceChildren(v.el, speaker.el);
    shell.scrollTop = 0;
  };

  const ctx: Ctx = {
    root,
    store,
    difficulty: 'medium',
    map: 'meadow',
    mode: 'standard' as ModeId,
    sound,
    audio,
    async update(p) {
      await store.update(p);
    },
    go(r) {
      switch (r.name) {
        case 'home': return mount(homeView(ctx));
        case 'setup': return mount(setupView(ctx, r.map));
        case 'knowledge': return mount(knowledgeView(ctx));
        case 'towers': return mount(towersView(ctx, r.tower), 'march');
        case 'store': return mount(storeView(ctx), 'bazaar');
        case 'settings': return mount(settingsView(ctx));
        case 'notice': return mount(noticeView(ctx));
        case 'result': return mount(resultView(ctx, r.info));
        case 'challenges': return mount(challengesView(ctx, r.code));
        case 'challenge-edit': return mount(challengeEditView(ctx, r.rules));
        case 'challenge-result': return mount(challengeResultView(ctx, r.info));
      }
    },
    play(d: Difficulty) {
      if (playing) return;
      playing = true;
      void playMatch(d).finally(() => { playing = false; });
    },
    playChallenge(rules, source) {
      if (playing) return;
      playing = true;
      void playChallengeMatch(rules, source).finally(() => { playing = false; });
    },
  };

  async function playMatch(difficulty: Difficulty): Promise<void> {
    const map = ctx.map, mode = ctx.mode;
    const before = store.profile;
    const mo = matchOptions(before, mode);
    const startOpts: MatchStartOptions = { map, mode, difficulty, unlocks: mo.unlocks, towerXp: mo.towerXp, mods: mo.mods, powers: mo.powers, hero: mo.hero, lockInfo: lockInfo(before) };
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
    const res = toMetaResult(outcome, { matchId: newId(), map, mode, startLives: startLives(difficulty, mo.mods) });
    const usedAny = Object.values(outcome.powersUsed ?? {}).some((n) => (n ?? 0) > 0);
    // Verlassen in Runde 0 zaehlt nicht - ausser, es wurde eine Power eingesetzt (sonst gaebe es Gratis-Powers durch Verlassen)
    if (outcome.quit && res.roundsCleared === 0 && !usedAny) return ctx.go({ name: 'home' });
    const { profile, report } = applyMatch(store.profile, res);
    await store.update(profile);
    ctx.go({
      name: 'result',
      info: {
        won: outcome.won, quit: !!outcome.quit, round: outcome.round, difficulty, map, mode, report,
        towerXpBefore: { ...before.towerXp }, towerXpAfter: { ...profile.towerXp }, livesLost: res.livesLost, powersUsed: outcome.powersUsed, embersBefore: before.embers, embersAfter: profile.embers,
      },
    });
  }

  /** Runde 16 E: Challenge spielen. Kein Turm-XP, keine Medaillen; Powers werden aus dem Profil verbraucht, Bestwerte und Tagesbelohnung verbucht. */
  async function playChallengeMatch(rules: ChallengeRules, source: ChallengeSource): Promise<void> {
    const before = store.profile;
    const mo = matchOptions(before);
    const code = encodeChallenge(rules);
    const startOpts: MatchStartOptions = { map: rules.map, mode: 'standard', difficulty: rules.difficulty, rules, unlocks: undefined, towerXp: undefined, mods: mo.mods, powers: rules.noPowers ? {} : mo.powers, hero: mo.hero, lockInfo: {} };
    const back = (): void => ctx.go(source.from === 'editor' ? { name: 'challenge-edit', rules } : { name: 'challenges', code: source.kind === 'custom' ? code : undefined });
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
    root.replaceChildren(shell);
    const usedAny = Object.values(outcome.powersUsed ?? {}).some((n) => (n ?? 0) > 0);
    const cleared = Math.max(0, outcome.roundsCleared ?? 0);
    if (outcome.quit && cleared === 0 && !usedAny) return back();
    const spent = Math.max(0, Math.round(outcome.spent ?? 0)), livesLost = Math.max(0, Math.round(outcome.livesLost ?? 0)), ticks = Math.max(0, Math.round(outcome.ticks ?? 0));
    // Der Tag zaehlt, an dem die Challenge gestartet wurde (Lauf ueber Mitternacht verliert die Belohnung nicht)
    const { profile, report } = applyChallenge(before, { matchId: newId(), kind: source.kind, key: source.key, won: outcome.won, roundsCleared: cleared, spent, livesLost, ticks }, source.kind === 'daily' ? source.key : utcDay());
    // verbrauchte Powers vom Inventar abziehen
    const inventory = { ...profile.inventory };
    for (const [k, n] of Object.entries(outcome.powersUsed ?? {})) inventory[k as keyof typeof inventory] = Math.max(0, (inventory[k as keyof typeof inventory] ?? 0) - (n ?? 0));
    await store.update({ ...profile, inventory });
    ctx.go({ name: 'challenge-result', info: { rules, source, code, won: outcome.won, quit: !!outcome.quit, roundsCleared: cleared, spent, livesLost, ticks, best: report.best, improved: report.improved, embersGained: report.embersGained, duplicate: report.duplicate } });
  }

  root.replaceChildren(shell);
  warmPreviews();
  ctx.go(opts.initial ?? (store.profile.showResetNotice ? { name: 'notice' } : { name: 'home' }));
  return { ctx, go: (r) => ctx.go(r) };
}
