/**
 * Platzieren (Runde 6, freie Platzierung): Bildschirm <-> Welt, Geist-Status, Treffer auf gesetzte Units, Fehlertexte.
 * Reine Darstellungslogik (kein DOM, kein Pixi). Die Sim entscheidet verbindlich (`apply` -> `{ok:false, reason}`,
 * `canPlace` liefert denselben Grund vorab); hier steht nur, was der Spieler vorab sehen und im Fehlerfall lesen soll.
 */
import type { Command } from '../sim';

/** Welt: 1000 Milli-Tiles = eine Kachel. Die Kachel (x, y) ist um die Sim-Koordinate (x, y) zentriert, daher der Versatz um 0,5. */
export function pxToMilli(px: number, tile: number): number {
  return Math.round((px / tile - 0.5) * 1000);
}

export function milliToPx(milli: number, tile: number): number {
  return (milli / 1000 + 0.5) * tile;
}

/** Mausposition (Canvas-Pixel) -> Sim-Koordinate (ganze Milli-Tiles). */
export function pointerToWorld(p: { x: number; y: number }, tile: number): { x: number; y: number } {
  return { x: pxToMilli(p.x, tile), y: pxToMilli(p.y, tile) };
}

export interface PlaceDef {
  id: string;
  placement: 'ground' | 'hill' | 'hybrid';
  footprint: 1 | 2;
  radiusMilli?: number;
}

/** Darstellungs-Typ der Flaeche, die eine Unit verlangt (Shop-Marke): Farm = gross, sonst Boden/Huegel; Hybride siehe Shop. */
export type NeedType = 'ground' | 'hill' | 'large';

export function needOf(def: PlaceDef): NeedType {
  if (def.footprint === 2) return 'large';
  return def.placement === 'hill' ? 'hill' : 'ground';
}

/** Passt eine Zone (`sim.zoneAt`/`map().cells`) zur Platzierungsart der Unit? Grundlage der Hervorhebung. */
export function zoneFits(placement: PlaceDef['placement'], zone: string | null): boolean {
  if (zone === 'ground') return placement === 'ground' || placement === 'hybrid';
  if (zone === 'hill') return placement === 'hill' || placement === 'hybrid';
  return false;
}

export interface GhostStatus {
  ok: boolean;
  /** Ablehnungsgrund der Sim (`canPlace`), `null` = erlaubt. */
  reason: string | null;
}

/** Geist-Status aus dem Ergebnis von `sim.canPlace`: gruen bei `null`, sonst rot mit Grund. */
export function ghostStatus(reason: string | null): GhostStatus {
  return { ok: reason === null, reason };
}

/** i18n-Schluessel der kurzen Beschriftung am Geist. */
export function ghostLabelKey(reason: string): string {
  switch (reason) {
    case 'out-of-bounds':
    case 'on-path':
    case 'blocked':
    case 'wrong-zone':
    case 'overlap':
    case 'not-enough-coins':
    case 'team-limit':
    case 'team-slots':
      return `ghost.${reason}`;
    default:
      return 'ghost.invalid';
  }
}

/** Gesetzte Unit unter einem Punkt (Milli-Tiles): die naechste, deren Kreis (mindestens eine halbe Kachel) den Punkt enthaelt. */
export function unitAt(
  units: readonly { id: number; defId: string; x: number; y: number }[],
  radiusOf: (defId: string) => number,
  x: number,
  y: number,
): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  for (const u of units) {
    const r = Math.max(radiusOf(u.defId), 500);
    const d = Math.hypot(u.x - x, u.y - y);
    if (d <= r && d < bestD) {
      best = u.id;
      bestD = d;
    }
  }
  return best;
}

/** Bleibt die Unit nach einem Klick gewaehlt? Nur nach erfolgreichem Setzen mit Shift (dieselbe Unit nochmal); Fehlversuch behaelt die Wahl. */
export function placingAfterClick(current: string | null, ok: boolean, shift: boolean): string | null {
  return ok && !shift ? null : current;
}

export interface FailureContext {
  /** Anzeigename der betroffenen Unit (schon uebersetzt) */
  name?: string;
  def?: PlaceDef;
  cost?: number;
  coins: number;
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
      case 'wrong-zone':
        return { key: c.def?.placement === 'hill' ? 'toast.place.wrong-zone.hill' : 'toast.place.wrong-zone.ground', params: { name } };
      case 'on-path':
      case 'out-of-bounds':
      case 'blocked':
      case 'overlap':
        return { key: `toast.place.${reason}`, params: { name } };
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
