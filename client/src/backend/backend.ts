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
import type { DifficultyId, UnitMod } from '../sim';
import type { BannerRates, BannerView, CollectionUnitView, EvolveResult, HistoryEntry, MatchReward, PlayerView, Profile, PullBatchResult, RerollResult, ShopProduct, PurchaseResult, StageDifficultyView, StageViewData, StarterResult, WorldView } from './meta';
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
  /**
   * Anzeige-Daten je aktivem Banner (P3): Ratentabelle, Einzelraten, Pity-Regeln im Klartext, Pity-Stand des Profils, effektive Rate, Erwartungswerte,
   * Ratenversion + Hash. Dieselben Daten, aus denen gewuerfelt wird; die UI zeigt sie nur an. Fehlercodes wie `loadProfile`.
   */
  bannerViews(): Promise<BResult<{ views: BannerView[] }>>;
  /** Fehlercodes: `unknown-banner`, `banner-inactive`, `invalid-count`, `banner-limit-reached` (Starter schon benutzt), `not-enough-crystals`, `banner-pool-empty`. */
  pull(bannerId: string, count: 1 | 10, idemKey: string): Promise<BResult<Saved & { pull: PullBatchResult }>>;
  levelUp(unitId: string, idemKey: string): Promise<BResult<Saved & { level: { unitId: string; level: number; cost: number } }>>;
  /** Runde 8: Unit zu ihrer entwickelten Form (Kosten Gold + Crystals). Fehlercodes: `unit-not-owned`, `no-evolution`, `evolution-unavailable`, `evolution-needs-units`, `not-enough-crystals`, `not-enough-gold`. */
  evolve(unitId: string, idemKey: string): Promise<BResult<Saved & { evolution: EvolveResult }>>;
  /** Runde 8: Trait neu wuerfeln (Crystals nach Seltenheit). Fehlercodes: `unit-not-owned`, `not-enough-crystals`. */
  rerollTrait(unitId: string, idemKey: string): Promise<BResult<Saved & { reroll: RerollResult }>>;
  setTeam(unitIds: string[], idemKey: string): Promise<BResult<Saved & { team: string[] }>>;
  /**
   * Meldet ein beendetes Match. `replay` = Objekt des Recorders (`game/recorder.ts`); Belohnung aus dem Replay: P5.
   * P4: das Replay wird ans Profil gebunden: `team-required`, `team-mismatch`, `unit-not-owned`, `unit-mods-mismatch`, `team-invalid` (Unit ausserhalb des Teams platziert).
   */
  reportMatch(replay: ReplayFile, idemKey: string): Promise<BResult<Saved & { reward: MatchReward }>>;
  shopCatalog(): Promise<BResult<{ products: ShopProduct[] }>>;
  /** Mock-Kauf (`order.status`: `paid` oder `pending`). Fehlercodes: `unknown-sku`, `payment-failed`. Immer "Test purchase - no real money". */
  buy(sku: string, idemKey: string): Promise<BResult<Saved & { order: PurchaseResult }>>;
  /** Offene (`pending`) Bestellung beim Anbieter nachfragen und ggf. gutschreiben. Fehlercodes: `unknown-order`, `payment-failed`. */
  refreshOrder(orderId: string, idemKey: string): Promise<BResult<Saved & { order: PurchaseResult }>>;
  /**
   * P4, Sichtmodelle (`meta/src/views.ts`): Kontostaende, Spieler-Level samt XP-Balken, Starter-Geschenk offen?, Team. Die UI rechnet nichts selbst.
   * Fehlercodes wie `loadProfile`.
   */
  playerView(): Promise<BResult<{ player: PlayerView; persistence: Persistence }>>;
  /** P4: alle Units des Katalogs (auch nicht besessene) mit Level, Sternen, Kopien, Kosten fuer den naechsten Level. */
  collectionView(): Promise<BResult<{ units: CollectionUnitView[]; ownedCount: number; total: number }>>;
  /** P4: Stufen einer Stage: freigeschaltet (und ab welchem Spieler-Level), Erst-Clear-Crystals, Bestwelle. */
  stageView(stageId: string): Promise<BResult<StageViewData>>;
  /** Runde 8 / P3: Weltkarte (Welten, Acts mit Sperrgrund und Fortschritt, Infinite, Legend Stages/Raids als Geruest, naechster Act). Fehlercodes wie `loadProfile`. */
  worldView(): Promise<BResult<{ world: WorldView }>>;
  /** P4: die letzten Ziehungen aus dem Profil, neueste zuerst. */
  pullHistory(limit?: number): Promise<BResult<{ history: HistoryEntry[] }>>;
  /**
   * P4: alles, was ein Match braucht: das gespeicherte Team und die Mods dazu (`unitModsFor(profile, team)`). Die UI baut damit
   * `new Session(difficulty, seed, bus, unitMods)` und traegt `team` in den Recorder ein; `reportMatch` prueft spaeter, dass das Replay genau dazu passt.
   * Fehlercodes: `difficulty-locked`, `stage-locked` (Runde 8 / P3, nur mit `stageId`), `team-empty` (keine Units), `team-incomplete` (weniger als `min(6, Besitz)` Units gewaehlt), `unit-not-owned`.
   */
  matchSetup(difficulty: DifficultyId, stageId?: string): Promise<BResult<{ team: string[]; unitMods: UnitMod[] }>>;
  /** Speicherstand als JSON-Text (mit Pruefsumme) zum Herunterladen. */
  exportSave(): Promise<BResult<{ json: string; filename: string }>>;
  /** Ersetzt das Profil durch den Inhalt einer Sicherungsdatei. Fehler: `import-invalid-json`, `import-wrong-format`, `import-bad-checksum`, `profile-corrupt`, `profile-too-new`. */
  importSave(json: string): Promise<BResult<{ profile: Profile; persistence: Persistence }>>;
}
