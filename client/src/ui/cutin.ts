/**
 * Faehigkeits-Ansage (Runde 10 / P2): Wenn der Spieler eine Faehigkeit ausloest, schneidet ein Band in Elementfarbe ueber das Spielfeld,
 * die Karte der Unit faehrt ein und der Name der Faehigkeit steht gross dahinter (Schnitt wie in Gacha-Spielen). Das Spiel laeuft weiter,
 * die Ansage faengt keine Mausklicks ab. Automatisch gerufene Faehigkeiten (Beschwoerer, Auto-Schalter) bleiben leise.
 * Haengt nur am `GameBus` und liest die Unit; die Sim bekommt nichts. Das Bildschirmruckeln selbst macht `game/fx.ts`.
 */
import './cutin.css';
import type { GameBus } from '../game/events';
import type { Session } from '../game/session';
import type { UnitDef } from '../sim';
import { unitLook } from '../view/look';
import { h } from './dom';
import { unitName } from './meta-model';
import { miniOf } from './unit-card';

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;
const SHOW_MS = 1250;
const MAX_QUEUE = 2;

export interface CutInModel {
  unitId: string;
  unitName: string;
  ability: string;
  main: string;
  light: string;
  dark: string;
  element: string;
}

/** Was die Ansage zeigt (rein, getestet). `null` = keine Ansage (automatisch ausgeloest oder Unit weg). */
export function cutInModel(
  units: readonly { id: number; defId: string }[],
  defs: readonly Pick<UnitDef, 'id' | 'elements' | 'damageType'>[],
  ev: { unitId: number; name: string; auto: boolean },
): CutInModel | null {
  if (ev.auto) return null;
  const u = units.find((x) => x.id === ev.unitId);
  const def = u ? defs.find((d) => d.id === u.defId) : undefined;
  if (!u || !def) return null;
  const look = unitLook(def);
  return { unitId: def.id, unitName: unitName(def.id), ability: ev.name, main: hex(look.main), light: hex(look.light), dark: hex(look.dark), element: look.key };
}

export function mountCutIn(bus: GameBus, host: HTMLElement): { play(m: CutInModel): void } {
  let session: Session | null = null;
  let playing = false;
  const queue: CutInModel[] = [];

  const run = (m: CutInModel): void => {
    playing = true;
    const root = h('div', 'cutin');
    root.dataset.unit = m.unitId;
    root.style.setProperty('--ci-main', m.main);
    root.style.setProperty('--ci-light', m.light);
    root.style.setProperty('--ci-dark', m.dark);
    const band = h('div', 'cutin-band');
    const lines = h('div', 'cutin-lines');
    const card = h('div', 'cutin-card');
    card.append(miniOf(m.unitId, 150));
    const text = h('div', 'cutin-text');
    text.append(h('span', 'cutin-unit', m.unitName), h('strong', 'cutin-name', m.ability));
    root.append(band, lines, card, text);
    host.append(root);
    window.setTimeout(() => {
      root.remove();
      playing = false;
      const next = queue.shift();
      if (next) run(next);
    }, SHOW_MS);
  };

  const play = (m: CutInModel): void => {
    if (playing) {
      if (queue.length < MAX_QUEUE) queue.push(m);
      return;
    }
    run(m);
  };

  bus.onRunStart((s) => {
    session = s;
    queue.length = 0;
    host.querySelectorAll('.cutin').forEach((n) => n.remove());
    playing = false;
  });
  bus.onEvents((events) => {
    if (!session) return;
    for (const e of events) {
      if (e.type !== 'ability') continue;
      const m = cutInModel(session.sim.state.units, session.sim.catalog(), e);
      if (m) play(m);
    }
  });
  return { play };
}
