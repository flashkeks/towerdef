/** Setzt die Karte in einen einzigen Puffer zusammen (Vorschau-PNG, Tests). Im Spiel liegen die Ebenen einzeln in Pixi. */
import { Buf, C } from './buf';
import { MAP_H, MAP_W } from './layout';
import { flagFrame, MILL_STEPS, paintMeadow, windmillBlades, type MeadowArt } from './paint';

let cached: MeadowArt | null = null;
export const meadowArt = (): MeadowArt => (cached ??= paintMeadow());

export function composeMeadow(frame = 0): Buf {
  const art = meadowArt();
  const out = art.ground.clone();
  out.blit(art.water[frame % art.water.length], 0, 0);
  out.blit(art.deco, 0, 0);
  const mill = windmillBlades(frame % MILL_STEPS);
  for (const { prop, art: pa } of art.props) {
    out.blit(pa.buf, prop.x - pa.ax, prop.y - pa.ay);
    if (prop.kind === 'windmill') out.blit(mill, prop.x - 30, prop.y + (pa.hook?.y ?? 0) - 30);
    if (prop.kind === 'gatetower') out.blit(flagFrame(frame % 4), prop.x + 1, prop.y + (pa.hook?.y ?? 0) - 1);
  }
  void MAP_W; void MAP_H; void C;
  return out;
}
