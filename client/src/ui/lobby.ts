/**
 * Lobby: Startbildschirm der Runde 7. Kontostaende oben, Starter-Geschenk (nur solange offen), Play / Summon / Units / Team / Shop / Settings.
 * Ladefehler (`profile-corrupt`, `profile-too-new`) zeigen eine Meldung mit Import und Reset statt eines Absturzes.
 * `persistence: 'memory'` -> sichtbare Warnung. Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { CollectionUnitView, PlayerView } from '../backend/meta';
import { t } from '../i18n/t';
import { pickHero } from './collection-model';
import { h } from './dom';
import { notify } from './flash';
import { backdrop, crest, elementIcon, icon, panel, sigil, stars, tile } from './kit';
import { importSaveFlow, newKey, resetFlow, WalletBar } from './meta-ui';
import { errorText, rarityName } from './meta-model';
import type { Nav } from './nav';
import { cardOf, miniOf, unitMeta } from './unit-card';

/** Kurzer Platzhalter, bis das Backend geantwortet hat (lokal Millisekunden). */
export function buildLobbyLoading(): HTMLElement {
  const box = h('div', 'screen lobby loading');
  const mid = h('div', 'lb-loading');
  mid.append(crest(), h('h1', 'title', t('game.title')), h('p', 'tagline', t('lobby.loading')));
  box.append(backdrop('lobby'), mid);
  return box;
}

/** Ladefehler: kaputter oder zu neuer Stand. Optionen Import und Reset (mit Bestaetigung); nichts wird ohne Zutun ueberschrieben. */
export function buildLoadError(f: { code: string; message: string }, onRecovered: () => void): HTMLElement {
  const box = h('div', 'dialog wide load-error');
  box.dataset.code = f.code;
  const tooNew = f.code === 'profile-too-new';
  box.append(crest(), h('h1', 'title small', t(tooNew ? 'loaderr.tooNew.title' : 'loaderr.corrupt.title')), h('p', 'tagline', t(tooNew ? 'loaderr.tooNew.text' : 'loaderr.corrupt.text')));
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

interface MenuItem {
  id: string;
  key: string;
  icon: string;
  tone: string;
  go: (n: Nav) => void;
  cls?: string;
}

const MENU: MenuItem[] = [
  { id: 'play', key: 'lobby.play', icon: 'play', tone: 'var(--gold)', go: (n) => n.world(), cls: 'span6 hero-tile' },
  { id: 'summon', key: 'lobby.summon', icon: 'summon', tone: 'var(--violet)', go: (n) => n.summon(), cls: 'span3' },
  { id: 'units', key: 'lobby.units', icon: 'swords', tone: 'var(--sky)', go: (n) => n.units(), cls: 'span3' },
  { id: 'team', key: 'lobby.team', icon: 'shield', tone: 'var(--aether)', go: (n) => n.team(), cls: 'span2 compact' },
  { id: 'shop', key: 'lobby.shop', icon: 'bag', tone: 'var(--ember)', go: (n) => n.shop(), cls: 'span2 compact' },
  { id: 'settings', key: 'lobby.settings', icon: 'gear', tone: 'var(--el-none)', go: (n) => n.settings(), cls: 'span2 compact' },
];

/** Held im Vordergrund: grosse Karte des Anfuehrers (Rahmen laeuft, Siegel dreht sich dahinter), zwei Mitstreiter als Faecher, Namensschild darunter. */
function heroStage(player: PlayerView, collection: readonly CollectionUnitView[]): HTMLElement {
  const stage = h('div', 'lb-hero');
  const { lead, side } = pickHero(player.team, collection);
  const rays = h('div', 'hero-rays');
  const ring = h('div', 'hero-sigil');
  ring.append(sigil());
  stage.append(rays, ring);
  if (!lead) {
    const empty = h('div', 'hero-empty');
    empty.append(icon('summon', 'big'), h('strong', undefined, t('lobby.hero.empty')), h('span', 'muted', t('lobby.noUnits')));
    stage.append(empty);
    return stage;
  }
  stage.dataset.rarity = unitMeta(lead).rarity;
  const byId = new Map(collection.map((u) => [u.unitId, u]));
  const fan = h('div', 'hero-fan');
  side.forEach((id, i) => {
    const u = byId.get(id);
    if (!u) return;
    const c = cardOf(u, { tag: 'div', cls: `hero-side s${i}` });
    fan.append(c);
  });
  const leadView = byId.get(lead)!;
  const main = cardOf(leadView, { tag: 'div', live: true, cls: 'hero-main' });
  fan.append(main);
  stage.append(fan);
  const m = unitMeta(lead, leadView.rarity);
  const plate = h('div', 'hero-plate');
  plate.dataset.rarity = m.rarity;
  const meta = h('div', 'hero-meta');
  meta.append(h('span', `hero-rarity r-${m.rarity}`, rarityName(m.rarity)), ...m.elements.slice(0, 3).map((e) => elementIcon(e, 'hero-el')), stars(leadView.stars, leadView.maxStars));
  plate.append(h('span', 'eyebrow', t('lobby.hero.leader')), h('h2', 'hero-name', m.name), meta);
  stage.append(plate);
  return stage;
}

/** Die Lobby selbst. `player` ist schon geladen; `persistence` steuert die Warnung, `collection` liefert den Helden im Vordergrund. */
export function buildLobby(player: PlayerView, persistence: string, nav: Nav, collection: readonly CollectionUnitView[] = []): HTMLElement {
  const box = h('div', 'screen lobby');
  box.append(backdrop('lobby'), heroStage(player, collection));

  const top = h('header', 'lb-top');
  const brand = h('div', 'lb-brand');
  const titles = h('div', 'lobby-titles');
  titles.append(h('h1', 'title', t('game.title')), h('p', 'tagline', t('start.tagline')));
  brand.append(crest(), titles);
  const wallet = new WalletBar();
  wallet.update(player);
  top.append(brand, wallet.el);
  box.append(top);

  const left = h('div', 'lb-left');
  if (persistence === 'memory') {
    const w = h('p', 'warn memory-warning', t('lobby.memoryWarning'));
    w.setAttribute('role', 'alert');
    left.append(w);
  }
  const slot = h('div', 'starter-slot');
  left.append(slot);
  if (pendingGift) {
    slot.append(starterDone(pendingGift.crystals, pendingGift.units));
    pendingGift = null;
  } else if (player.starterGiftAvailable) slot.append(starterCard(nav));

  const grid = h('div', 'lobby-grid');
  for (const m of MENU) {
    const b = tile({ id: m.id, title: t(m.key), sub: t(`${m.key}.sub`), icon: m.icon, tone: m.tone, cls: m.cls, onClick: () => m.go(nav) });
    if (m.id === 'play') {
      b.classList.add('primary');
      if (player.ownedCount === 0) {
        b.disabled = true;
        b.title = t('lobby.play.needUnits');
      }
    }
    if (m.cls?.includes('compact')) b.title = t(`${m.key}.sub`);
    grid.append(b);
  }
  left.append(grid);
  box.append(left);

  const bottom = h('footer', 'lb-bottom');
  if (player.team.length > 0) {
    const strip = h('div', 'team-strip');
    strip.append(h('span', 'strip-label', t('lobby.teamLabel', { n: player.team.length, max: player.teamTarget })));
    for (const id of player.team) {
      const c = h('span', 'strip-unit');
      c.append(miniOf(id, 42));
      strip.append(c);
    }
    bottom.append(strip);
  } else if (player.ownedCount === 0) {
    bottom.append(h('p', 'muted lobby-hint', t('lobby.noUnits')));
  }
  const credits = h('button', 'btn link menu-credits', t('menu.credits'));
  credits.type = 'button';
  credits.addEventListener('click', () => nav.credits());
  bottom.append(credits);
  box.append(bottom);
  return box;
}

/** Das Geschenk, das die Lobby nach dem Abholen einmal zeigt (die Lobby baut sich danach neu auf: Play, Team, Kontostaende). */
let pendingGift: { crystals: number; units: string[] } | null = null;

/** Starter-Geschenk: sichtbarer Knopf; danach zeigt die neu gebaute Lobby, was man bekommen hat. */
function starterCard(nav: Nav): HTMLElement {
  const card = panel({ tone: 'ember', cls: 'starter-card', tag: 'div' });
  const gift = h('span', 'starter-icon');
  gift.append(icon('gift'));
  const claim = h('button', 'btn primary starter-claim', t('starter.claim'));
  claim.type = 'button';
  const text = h('div', 'starter-copy');
  text.append(h('strong', 'starter-title', t('starter.title')), h('span', 'starter-text', t('starter.text')));
  card.body.append(gift, text, claim);
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
  const done = panel({ tone: 'aether', cls: 'starter-card done', tag: 'div' });
  const text = h('div', 'starter-copy');
  text.append(h('strong', 'starter-title', t('starter.done.title')), h('span', 'starter-text', t('starter.done.text', { n: crystals, units: units.length })));
  const row = h('div', 'starter-units');
  for (const u of units) {
    const c = h('span', 'strip-unit');
    c.append(miniOf(u, 44));
    row.append(c);
  }
  done.body.append(text, row);
  return done;
}
