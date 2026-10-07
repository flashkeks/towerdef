/**
 * Schnittstelle zwischen Client und Meta-Schicht. Besitzer: P1 (Signaturen aendern nur nach Absprache; neue Methoden additiv).
 *
 * - Alles `async`, Rueckgabe immer ein Ergebnis-Objekt (`ok: true | false`); Spielfehler sind Werte, keine Exceptions.
 * - `idemKey` erzeugt der AUFRUFER je Nutzeraktion (`crypto.randomUUID()`), bei Wiederholung desselben Klicks gleich lassen.
 * - Der Client schickt nur Absichten (Banner, Anzahl, Unit-ID, SKU), nie Preise, Raten oder Ergebnisse.
 * - `LocalBackend` (diese Runde) nutzt `meta/` direkt im Browser. `ServerBackend` (M2, HTTP) setzt dieselben Methoden 1:1 um;
 *   die Antwortformen sind absichtlich reines JSON.
 */
import type { ReplayFile } from '../game/recorder';
import type { BannerRates, MatchReward, Profile, PullBatchResult, ShopProduct, PurchaseResult, StarterResult } from './meta';
import type { Persistence } from './storage';

export interface BFail {
  ok: false;
  /** maschinenlesbar, z. B. `not-enough-crystals`, `profile-corrupt`, `profile-too-new`, `import-bad-checksum` */
  code: string;
  /** Englisch, direkt anzeigbar */
  message: string;
}

export type BResult<T> = ({ ok: true } & T) | BFail;

/** Gemeinsamer Teil jeder Mutation: der neue Profilstand. `replayed` = Wiederholung mit bekanntem `idemKey`, nichts neu gebucht. */
export interface Saved {
  profile: Profile;
  /** wohin gespeichert wurde; `memory` = geht beim Neuladen verloren (Hinweis anzeigen) */
  persistence: Persistence;
  replayed: boolean;
}

/** Fehlercodes von `loadProfile`: `profile-corrupt` (kaputt), `profile-too-new` (aus neuerer Version). Der Stand wird dann NICHT ueberschrieben. */
export interface Backend {
  /** Laedt das Profil (legt beim allerersten Start ein neues an: `created: true`). Kaputte/zu neue Daten -> Fehler, kein Absturz, nichts wird ueberschrieben. */
  loadProfile(): Promise<BResult<{ profile: Profile; created: boolean; persistence: Persistence }>>;
  /** Startet ein leeres Profil. Der bisherige (auch kaputte) Stand wird vorher als Sicherung abgelegt. Immer nur auf ausdruecklichen Wunsch des Spielers. */
  resetProfile(): Promise<BResult<{ profile: Profile; persistence: Persistence }>>;
  claimStarterGift(idemKey: string): Promise<BResult<Saved & { gift: StarterResult }>>;
  /** Banner-Daten, aus denen die Anzeige liest (dieselben, aus denen gewuerfelt wird). */
  listBanners(): Promise<BResult<{ banners: BannerRates[] }>>;
  pull(bannerId: string, count: 1 | 10, idemKey: string): Promise<BResult<Saved & { pull: PullBatchResult }>>;
  levelUp(unitId: string, idemKey: string): Promise<BResult<Saved & { level: { unitId: string; level: number; cost: number } }>>;
  setTeam(unitIds: string[], idemKey: string): Promise<BResult<Saved & { team: string[] }>>;
  /** Meldet ein beendetes Match. `replay` = Objekt des Recorders (`game/recorder.ts`); Belohnung aus dem Replay: P5. */
  reportMatch(replay: ReplayFile, idemKey: string): Promise<BResult<Saved & { reward: MatchReward }>>;
  shopCatalog(): Promise<BResult<{ products: ShopProduct[] }>>;
  buy(sku: string, idemKey: string): Promise<BResult<Saved & { order: PurchaseResult }>>;
  /** Speicherstand als JSON-Text (mit Pruefsumme) zum Herunterladen. */
  exportSave(): Promise<BResult<{ json: string; filename: string }>>;
  /** Ersetzt das Profil durch den Inhalt einer Sicherungsdatei. Fehler: `import-invalid-json`, `import-wrong-format`, `import-bad-checksum`, `profile-corrupt`, `profile-too-new`. */
  importSave(json: string): Promise<BResult<{ profile: Profile; persistence: Persistence }>>;
}
