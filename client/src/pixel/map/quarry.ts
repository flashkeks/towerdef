import { Buf } from './buf';
import type { MapArt } from './types';
export function paintQuarry(): MapArt {
  return { id: 'quarry', name: 'Ember Quarry', ground: new Buf(640, 360), anim: [new Buf(640, 360)], animMs: 140, deco: new Buf(640, 360), props: [], lights: [], smoke: [] };
}
