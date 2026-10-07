/**
 * Gemeinsame Bausteine der Meta-Bildschirme (Runde 7, P4): Rahmen mit Kopfzeile und Kontostaenden, Bestaetigungsdialog, Datei speichern/waehlen.
 * Die Bildschirme sprechen nur mit `getBackend()`, nie direkt mit `meta/`.
 */
import { getBackend } from '../backend';
import type { PlayerView } from '../backend/meta';
import { cryptoUuid } from '../backend/random';
import { t } from '../i18n/t';
import { h } from './dom';
import { walletView } from './meta-model';
import { notify } from './flash';
import type { Nav } from './nav';

/** Neuer Idempotenz-Schluessel je Nutzeraktion (ein Klick = ein Schluessel). */
export const newKey = (): string => cryptoUuid();

/** Kontostaende: Crystals, Gold, Spieler-Level und XP-Balken. */
export class WalletBar {
  readonly el = h('div', 'wallet');
  private readonly crystals = h('span', 'w-val');
  private readonly gold = h('span', 'w-val');
  private readonly level = h('span', 'w-level');
  private readonly xp = h('span', 'w-xp');
  private readonly fill = h('div', 'bar-fill xp');

  constructor() {
    const mk = (cls: string, icon: string, tip: string, val: HTMLElement): HTMLElement => {
      const e = h('span', `w-item ${cls}`);
      e.title = tip;
      e.append(h('span', `w-icon ${cls}`, icon), val);
      return e;
    };
    const xpBar = h('div', 'bar xpbar');
    xpBar.append(this.fill);
    const lv = h('span', 'w-item w-player');
    lv.append(this.level, xpBar, this.xp);
    this.el.append(mk('crystals', '◆', t('wallet.crystals'), this.crystals), mk('gold', '●', t('wallet.gold'), this.gold), lv);
  }

  update(p: PlayerView): void {
    const w = walletView(p);
    this.crystals.textContent = w.crystals;
    this.gold.textContent = w.gold;
    this.level.textContent = w.level;
    this.xp.textContent = w.xp;
    this.fill.style.width = `${w.xpPct}%`;
    this.el.dataset.crystals = String(p.crystals);
    this.el.dataset.gold = String(p.gold);
    this.el.dataset.level = String(p.level);
  }
}

export interface MetaFrame {
  box: HTMLElement;
  body: HTMLElement;
  wallet: WalletBar;
  /** Salden neu laden (nach Zug, Level-Up, Kauf) */
  refreshWallet(): Promise<PlayerView | null>;
}

/** Rahmen eines Meta-Bildschirms: Zurueck-Knopf, Titel, Kontostaende, darunter `body`. */
export function metaFrame(cls: string, titleKey: string, nav: Nav): MetaFrame {
  const box = h('div', `dialog wide meta ${cls}`);
  const head = h('header', 'meta-head');
  const back = h('button', 'btn menu-back', t('meta.toLobby'));
  back.type = 'button';
  back.addEventListener('click', () => nav.lobby());
  const wallet = new WalletBar();
  head.append(back, h('h1', 'title small', t(titleKey)), wallet.el);
  const body = h('div', 'meta-body');
  box.append(head, body);
  const refreshWallet = async (): Promise<PlayerView | null> => {
    const r = await getBackend().playerView();
    if (!r.ok) return null;
    wallet.update(r.player);
    return r.player;
  };
  void refreshWallet();
  return { box, body, wallet, refreshWallet };
}

export interface ConfirmOptions {
  title: string;
  text: string;
  confirm: string;
  cancel?: string;
  /** rote Bestaetigung (Zuruecksetzen) */
  danger?: boolean;
}

/** Bestaetigungsdialog ueber allem; Esc und "Cancel" = `false`. */
export function confirmDialog(o: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const layer = h('div', 'confirm-layer');
    const box = h('div', 'dialog confirm');
    box.setAttribute('role', 'alertdialog');
    const yes = h('button', `btn confirm-yes${o.danger ? ' danger' : ' primary'}`, o.confirm);
    const no = h('button', 'btn confirm-no', o.cancel ?? t('meta.cancel'));
    const row = h('div', 'diff-row');
    row.append(no, yes);
    box.append(h('h2', 'confirm-title', o.title), h('p', 'confirm-text', o.text), row);
    layer.append(box);
    const done = (v: boolean): void => {
      document.removeEventListener('keydown', onKey, true);
      layer.remove();
      resolve(v);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        done(false);
      }
    };
    document.addEventListener('keydown', onKey, true);
    yes.addEventListener('click', () => done(true));
    no.addEventListener('click', () => done(false));
    document.body.append(layer);
    no.focus();
  });
}

/** Text als Datei herunterladen (Blob, kein Server). */
export function saveTextFile(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Dateiauswahl; liefert den Text oder `null` bei Abbruch/Lesefehler. Muss aus einem Klick heraus aufgerufen werden. */
export function pickTextFile(accept = '.json,application/json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.className = 'file-input hidden';
    input.addEventListener('change', async () => {
      const f = input.files?.[0];
      input.remove();
      if (!f) return resolve(null);
      try {
        resolve(await f.text());
      } catch {
        resolve(null);
      }
    });
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });
    document.body.append(input);
    input.click();
  });
}

/** Export-Knopf-Aktion: Sicherung als Datei. */
export async function exportSaveFile(): Promise<boolean> {
  const r = await getBackend().exportSave();
  if (!r.ok) {
    notify(`${t('save.export.failed')} ${r.message}`, 'error');
    return false;
  }
  saveTextFile(r.filename, r.json);
  notify(t('save.export.done', { name: r.filename }), 'good');
  return true;
}

/** Import-Ablauf: Datei waehlen, bei vorhandenem Fortschritt bestaetigen, einspielen. `true` = Profil ersetzt. */
export async function importSaveFlow(confirmReplace: boolean): Promise<boolean> {
  const text = await pickTextFile();
  if (text === null) return false;
  if (confirmReplace && !(await confirmDialog({ title: t('save.import.confirm.title'), text: t('save.import.confirm.text'), confirm: t('save.import.confirm.yes'), danger: true }))) return false;
  const r = await getBackend().importSave(text);
  if (!r.ok) {
    notify(`${t('save.import.failed')} ${r.message}`, 'error', 7000);
    return false;
  }
  notify(t('save.import.done'), 'good');
  return true;
}

/** Zuruecksetzen mit Bestaetigung (der alte Stand wird vom Backend vorher als Sicherung abgelegt). `true` = zurueckgesetzt. */
export async function resetFlow(): Promise<boolean> {
  const ok = await confirmDialog({ title: t('save.reset.confirm.title'), text: t('save.reset.confirm.text'), confirm: t('save.reset.confirm.yes'), danger: true });
  if (!ok) return false;
  const r = await getBackend().resetProfile();
  if (!r.ok) {
    notify(`${t('save.reset.failed')} ${r.message}`, 'error');
    return false;
  }
  notify(t('save.reset.done'), 'good');
  return true;
}
