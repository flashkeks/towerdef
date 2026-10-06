/**
 * Platzieren: welcher Slot passt zu welcher Unit, und warum ein Versuch scheitert. Reine Darstellungslogik (kein DOM, kein Pixi).
 * Die Sim entscheidet verbindlich (`apply` -> `{ok:false, reason}`); hier steht nur, was der Spieler vorab sehen und im
 * Fehlerfall lesen soll. Ein Test haelt `slotFit` gegen die Sim-Gruende (`slot-kind`, `slot-size`, `slot-occupied`).
 */
import { t } from '../i18n/t';
import type { Command } from '../sim';

export type SlotType = 'ground' | 'hill' | 'large';

export interface SlotLike {
  kind: 'ground' | 'hill';
  size: 1 | 2;
}

export interface PlaceDef {
  id: string;
  placement: 'ground' | 'hill' | 'hybrid';
  footprint: 1 | 2;
}

/** Darstellungs-Typ eines Slots: grosse (2x2) Slots haben eine eigene Optik, egal ob Boden oder Huegel. */
export const slotType = (s: SlotLike): SlotType => (s.size === 2 ? 'large' : s.kind);

export type SlotFit = { ok: true } | { ok: false; reason: 'occupied' | 'kind' | 'size'; need: SlotType };

/** Spiegelt die Reihenfolge der Sim: belegt, Typ, Groesse. `need` = was die Unit braucht (fuer den Hinweistext). */
export function slotFit(def: PlaceDef, slot: SlotLike, free: boolean): SlotFit {
  if (!free) return { ok: false, reason: 'occupied', need: needOf(def) };
  if (def.placement !== 'hybrid' && def.placement !== slot.kind) return { ok: false, reason: 'kind', need: needOf(def) };
  if (def.footprint > slot.size) return { ok: false, reason: 'size', need: 'large' };
  return { ok: true };
}

/** Slot-Typ, den die Unit verlangt (hybride Units passen auf kleine Slots beider Arten, Anzeige: Boden). */
export function needOf(def: PlaceDef): SlotType {
  if (def.footprint === 2) return 'large';
  return def.placement === 'hill' ? 'hill' : 'ground';
}

/** Grund-Text (i18n) fuer einen nicht passenden Slot, z. B. "Gunner needs a hill slot." */
export function mismatchText(unitName: string, fit: Exclude<SlotFit, { ok: true }>): string {
  if (fit.reason === 'occupied') return t('toast.occupied');
  return t(`toast.need.${fit.need}`, { name: unitName });
}

/** Slot unter einem Punkt (Tiles) oder null. Slot-Mitte x/y in Tiles, Kantenlaenge = size Tiles. */
export function slotAt(slots: readonly { id: number; x: number; y: number; size: number }[], tx: number, ty: number): number | null {
  for (const s of slots) {
    const half = s.size / 2;
    if (Math.abs(tx - s.x) <= half && Math.abs(ty - s.y) <= half) return s.id;
  }
  return null;
}

export interface FailureContext {
  /** Anzeigename der betroffenen Unit (schon uebersetzt) */
  name?: string;
  def?: PlaceDef;
  cost?: number;
  coins: number;
  cap?: number;
  teamUnits: number;
  teamSlots: number;
}

export interface ToastSpec {
  key: string;
  params?: Record<string, string | number>;
}

/**
 * Ablehnung der Sim -> Toast mit Grund (Schluessel + Parameter). Unbekannte Gruende fallen auf `error.generic`.
 * `place`/`upgrade` bekommen konkrete Zahlen und Namen, alles andere den allgemeinen `error.*`-Text.
 */
export function failureToast(cmd: Command, reason: string, c: FailureContext): ToastSpec {
  const name = c.name ?? '';
  if (cmd.type === 'place') {
    switch (reason) {
      case 'not-enough-coins':
        return { key: 'toast.poor', params: { name, cost: c.cost ?? 0, coins: c.coins } };
      case 'slot-kind':
        return { key: `toast.need.${c.def ? needOf(c.def) : 'ground'}`, params: { name } };
      case 'slot-size':
        return { key: 'toast.need.large', params: { name } };
      case 'slot-occupied':
        return { key: 'toast.occupied' };
      case 'cap-reached':
        return { key: 'toast.cap', params: { name, cap: c.cap ?? 0 } };
      case 'team-limit':
        return { key: 'toast.team', params: { n: c.teamUnits } };
      case 'team-slots':
        return { key: 'toast.team-slots', params: { n: c.teamSlots } };
      default:
        return { key: `error.${reason}` };
    }
  }
  if (cmd.type === 'upgrade' && reason === 'not-enough-coins') return { key: 'toast.upgrade.poor', params: { cost: c.cost ?? 0, coins: c.coins } };
  return { key: `error.${reason}` };
}
