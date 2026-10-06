/**
 * Sprite-Atlas laden (Quelle: `assets/atlas/atlas.png|json`, gebaut von `scripts/build-atlas.mjs`).
 * Die Textur laeuft mit `scaleMode: 'nearest'`; Einzelbilder sind Teil-Texturen. Besitzer: P4 (Grafik).
 */
import { Assets, Rectangle, Texture, type TextureSource } from 'pixi.js';
import atlasData from '../../assets/atlas/atlas.json';
import atlasUrl from '../../assets/atlas/atlas.png?url';

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Atlas {
  private readonly cache = new Map<string, Texture>();
  constructor(
    private readonly source: TextureSource,
    private readonly frames: Record<string, { frame: FrameRect }>,
  ) {}

  has(name: string): boolean {
    return name in this.frames;
  }

  /** Teil-Textur eines Bildes (zwischengespeichert). */
  tex(name: string): Texture {
    let t = this.cache.get(name);
    if (!t) {
      const f = this.frames[name]?.frame;
      if (!f) throw new Error(`Atlas: Bild "${name}" fehlt`);
      t = new Texture({ source: this.source, frame: new Rectangle(f.x, f.y, f.w, f.h) });
      this.cache.set(name, t);
    }
    return t;
  }

  rect(name: string): FrameRect {
    const f = this.frames[name]?.frame;
    if (!f) throw new Error(`Atlas: Bild "${name}" fehlt`);
    return f;
  }

  /** Das Atlasbild selbst (fuer `drawImage` beim Zusammensetzen der Karte). */
  get image(): CanvasImageSource {
    return this.source.resource as CanvasImageSource;
  }
}

let atlas: Atlas | null = null;
let pending: Promise<Atlas> | null = null;

/** Der Atlas, sobald geladen; davor `null` (die Ebenen zeichnen dann noch nichts und bauen sich bei `onAtlas` neu). */
export const getAtlas = (): Atlas | null => atlas;

export function loadAtlas(): Promise<Atlas> {
  pending ??= (async () => {
    const tex = await Assets.load<Texture>({ src: atlasUrl, data: { scaleMode: 'nearest' } });
    tex.source.scaleMode = 'nearest';
    atlas = new Atlas(tex.source, atlasData.frames as Record<string, { frame: FrameRect }>);
    return atlas;
  })();
  return pending;
}
