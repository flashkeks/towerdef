/**
 * Lobby: Startbildschirm der Runde 7. Kontostaende oben, Starter-Geschenk (nur solange offen), Play / Summon / Units / Team / Shop / Settings.
 * Ladefehler (`profile-corrupt`, `profile-too-new`) zeigen eine Meldung mit Import und Reset statt eines Absturzes.
 * `persistence: 'memory'` -> sichtbare Warnung. Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { PlayerView } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { notify } from './flash';
import { importSaveFlow, newKey, resetFlow, WalletBar } from './meta-ui';
import { errorText, unitName } from './meta-model';
import type { Nav } from './nav';
import { portrait } from './portrait';

/** Kurzer Platzhalter, bis das Backend geantwortet hat (lokal Millisekunden). */
export function buildLobbyLoading(): HTMLElement {
  const box = h('div', 'dialog wide lobby loading');
  box.append(h('h1', 'title', t('game.title')), h('p', 'tagline', t('lobby.loading')));
  return box;
}

/** Ladefehler: kaputter oder zu neuer Stand. Optionen Import und Reset (mit Bestaetigung); nichts wird ohne Zutun ueberschrieben. */
export function buildLoadError(f: { code: string; message: string }, onRecovered: () => void): HTMLElement {
  const box = h('div', 'dialog wide load-error');
  box.dataset.code = f.code;
  const tooNew = f.code === 'profile-too-new';
  box.append(h('h1', 'title small', t(tooNew ? 'loaderr.tooNew.title' : 'loaderr.corrupt.title')), h('p', 'tagline', t(tooNew ? 'loaderr.tooNew.text' : 'loaderr.corrupt.text')));
  box.append(h('p', 'loaderr-detail muted', errorText(f)));
  const row = h('div', 'diff-row');
  const imp = h('button', 'btn primary load-import', t('loaderr.import'));
  imp.addEventListener('click', () => {
    void importSaveFlow(false).then((ok) => ok && onRecovered());
  });
  const reset = h('button', 'btn danger load-reset', t('loaderr.reset'));
  reset.addEventListener('click', () => {
    void resetFlow().then((ok) => ok && onRecovered());
  });
  const retry = h('button', 'btn load-retry', t('loaderr.retry'));
  retry.addEventListener('click', onRecovered);
  row.append(imp, reset, retry);
  box.append(row, h('p', 'set-note', t('loaderr.note')));
  return box;
}

const MENU: { id: string; key: string; go: (n: Nav) => void; primary?: boolean }[] = [
  { id: 'play', key: 'lobby.play', go: (n) => n.stage(), primary: true },
  { id: 'summon', key: 'lobby.summon', go: (n) => n.summon() },
  { id: 'units', key: 'lobby.units', go: (n) => n.units() },
  { id: 'team', key: 'lobby.team', go: (n) => n.team() },
  { id: 'shop', key: 'lobby.shop', go: (n) => n.shop() },
  { id: 'settings', key: 'lobby.settings', go: (n) => n.settings() },
];

/** Die Lobby selbst. `player` ist schon geladen; `persistence` steuert die Warnung. */
export function buildLobby(player: PlayerView, persistence: string, nav: Nav): HTMLElement {
  const box = h('div', 'dialog wide lobby');
  const head = h('header', 'lobby-head');
  const titles = h('div', 'lobby-titles');
  titles.append(h('h1', 'title', t('game.title')), h('p', 'tagline', t('start.tagline')));
  const wallet = new WalletBar();
  wallet.update(player);
  head.append(titles, wallet.el);
  box.append(head);

  if (persistence === 'memory') {
    const w = h('p', 'warn memory-warning', t('lobby.memoryWarning'));
    w.setAttribute('role', 'alert');
    box.append(w);
  }

  const slot = h('div', 'starter-slot');
  box.append(slot);
  if (pendingGift) {
    slot.append(starterDone(pendingGift.crystals, pendingGift.units));
    pendingGift = null;
  } else if (player.starterGiftAvailable) slot.append(starterCard(nav));

  const grid = h('div', 'lobby-grid');
  for (const m of MENU) {
    const b = h('button', `btn lobby-btn lobby-${m.id}${m.primary ? ' primary' : ''}`);
    b.type = 'button';
    b.dataset.go = m.id;
    b.append(h('strong', undefined, t(m.key)), h('span', 'lobby-sub', t(`${m.key}.sub`)));
    if (m.id === 'play' && player.ownedCount === 0) {
      b.disabled = true;
      b.title = t('lobby.play.needUnits');
    }
    b.addEventListener('click', () => m.go(nav));
    grid.append(b);
  }
  box.append(grid);

  if (player.team.length > 0) {
    const strip = h('div', 'team-strip');
    strip.append(h('span', 'muted', t('lobby.teamLabel', { n: player.team.length, max: player.teamTarget })));
    for (const id of player.team) {
      const c = h('span', 'strip-unit');
      c.title = unitName(id);
      c.append(portrait(id, 32));
      strip.append(c);
    }
    box.append(strip);
  } else if (player.ownedCount === 0) {
    box.append(h('p', 'muted lobby-hint', t('lobby.noUnits')));
  }

  const credits = h('button', 'btn link menu-credits', t('menu.credits'));
  credits.type = 'button';
  credits.addEventListener('click', () => nav.credits());
  box.append(credits);
  return box;
}

/** Das Geschenk, das die Lobby nach dem Abholen einmal zeigt (die Lobby baut sich danach neu auf: Play, Team, Kontostaende). */
let pendingGift: { crystals: number; units: string[] } | null = null;

/** Starter-Geschenk: sichtbarer Knopf; danach zeigt die neu gebaute Lobby, was man bekommen hat. */
function starterCard(nav: Nav): HTMLElement {
  const card = h('div', 'starter-card');
  const claim = h('button', 'btn primary starter-claim', t('starter.claim'));
  claim.type = 'button';
  card.append(h('strong', 'starter-title', t('starter.title')), h('span', 'starter-text', t('starter.text')), claim);
  claim.addEventListener('click', async () => {
    claim.disabled = true;
    const r = await getBackend().claimStarterGift(newKey());
    if (!r.ok) {
      claim.disabled = false;
      notify(errorText(r), 'error');
      return;
    }
    pendingGift = { crystals: r.gift.crystals, units: r.gift.units };
    nav.lobby();
  });
  return card;
}

function starterDone(crystals: number, units: readonly string[]): HTMLElement {
  const done = h('div', 'starter-card done');
  done.append(h('strong', 'starter-title', t('starter.done.title')), h('span', 'starter-text', t('starter.done.text', { n: crystals, units: units.length })));
  const row = h('div', 'starter-units');
  for (const u of units) {
    const c = h('span', 'strip-unit');
    c.title = unitName(u);
    c.append(portrait(u, 40));
    row.append(c);
  }
  done.append(row);
  return done;
}
