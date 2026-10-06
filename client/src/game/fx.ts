/**
 * Effekte aus Sim-Ereignissen (Haken fuer P5): Muenz-Popup beim Kill, roter Leak-Blitz.
 * Liest NUR Ereignisse vom `GameBus` (`bus.onEvents`) und darf den Sim-Zustand nie veraendern.
 * Neue Effekte (Treffer, Tod, Boss, Schadenszahlen, Ton) kommen als weitere Fall-Zweige in `handle()` oder eigene Module am Bus.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { SimEvent } from '../sim';
import { C } from './palette';
import { WORLD_H, WORLD_W, type RenderContext } from './context';
import type { EntitiesLayer } from './entities-layer';
import type { GameBus } from './events';

interface Pop {
  text: Text;
  vy: number;
  life: number;
}

export class Fx {
  /** Effekte ueber Overlays. */
  readonly container = new Container();
  /** Vollbild-Blitz, liegt ganz oben. */
  readonly flash = new Graphics();
  private pops: Pop[] = [];
  private popPool: Text[] = [];
  private flashAlpha = 0;
  private flashDrawn = false;

  constructor(private readonly ctx: RenderContext, private readonly entities: EntitiesLayer, bus: GameBus) {
    bus.onEvents((events) => {
      for (const e of events) this.handle(e);
    });
  }

  /** Neue Runde: laufende Effekte beenden. */
  reset(): void {
    for (const p of this.pops) {
      p.text.visible = false;
      this.popPool.push(p.text);
    }
    this.pops = [];
  }

  private handle(e: SimEvent): void {
    if (e.type === 'kill') {
      const p = this.entities.enemyPos(e.enemyId);
      if (p && this.pops.length < 40) this.addPop(`+${e.bounty}`, p.x, p.y, C.gold);
    } else if (e.type === 'leak') {
      this.flashAlpha = Math.min(0.6, 0.25 + e.damage * 0.04);
    }
  }

  private addPop(label: string, x: number, y: number, color: number): void {
    // Text-Objekte werden wiederverwendet, nie zerstoert (Zerstoeren/Neuanlegen pro Kill brachte SwiftShader zum Absturz).
    const tile = this.ctx.tile;
    let text = this.popPool.pop();
    if (!text) {
      text = new Text({ text: label, style: { fontFamily: 'monospace', fontSize: Math.round(tile * 0.28), fontWeight: 'bold', fill: C.gold, stroke: { color: C.ink, width: 3 } } });
      text.anchor.set(0.5);
      this.container.addChild(text);
    }
    text.text = label;
    text.style.fill = color;
    text.visible = true;
    text.alpha = 1;
    text.position.set(x, y - tile * 0.3);
    this.pops.push({ text, vy: -tile * 0.9, life: 0.8 });
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    for (const p of this.pops) {
      p.life -= dt;
      p.text.y += p.vy * dt;
      p.text.alpha = Math.max(0, Math.min(1, p.life / 0.4));
    }
    this.pops = this.pops.filter((p) => {
      if (p.life > 0) return true;
      p.text.visible = false;
      this.popPool.push(p.text);
      return false;
    });
    if (this.flashAlpha > 0.01) {
      this.flash.clear();
      this.flash.rect(0, 0, WORLD_W * this.ctx.tile, WORLD_H * this.ctx.tile).fill({ color: C.red, alpha: this.flashAlpha });
      this.flashAlpha *= Math.pow(0.02, dt);
      this.flashDrawn = true;
    } else if (this.flashDrawn) {
      this.flash.clear();
      this.flashDrawn = false;
    }
  }
}
