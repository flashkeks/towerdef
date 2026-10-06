/**
 * Bot-Auflösung: eigene Test-Bots (testbot, testfarm) zuerst, danach die Registry `src/bots/index.ts`
 * (`getBot(name)`), die ein anderer Agent pflegt und die per dynamischem Import geladen wird
 * (fehlt sie noch, bleiben nur die Test-Bots verfügbar).
 */
import type { Bot } from '../bots/types.js';
import { TEST_BOTS } from './testbot.js';

type AnyFn = (...a: unknown[]) => unknown;
let registry: Record<string, unknown> | null | undefined;

async function loadRegistry(): Promise<Record<string, unknown> | null> {
  if (registry !== undefined) return registry;
  const spec = '../bots/index.js';
  try {
    registry = (await import(spec)) as Record<string, unknown>;
  } catch {
    registry = null;
  }
  return registry;
}

/** Neue Bot-Instanz je Aufruf (Bots dürfen zustandsbehaftet sein). */
export async function makeBot(name: string): Promise<Bot> {
  const t = TEST_BOTS[name];
  if (t) return t();
  const reg = await loadRegistry();
  if (!reg || typeof reg.getBot !== 'function') throw new Error(`Bot "${name}" unbekannt (Registry src/bots/index.ts fehlt)`);
  const r = (reg.getBot as AnyFn)(name);
  const bot = typeof r === 'function' ? (r as () => Bot)() : (r as Bot | undefined);
  if (!bot || typeof bot.decide !== 'function') throw new Error(`Bot "${name}" unbekannt`);
  return bot;
}

/** Namen aller Registry-Bots (für --matrix); sucht listBots/botNames/BOT_NAMES/bots/BOTS/registry. */
export async function listBotNames(): Promise<string[]> {
  const reg = await loadRegistry();
  if (!reg) return [];
  for (const k of ['listBots', 'botNames', 'getBotNames', 'allBots']) {
    if (typeof reg[k] === 'function') {
      const v = (reg[k] as AnyFn)();
      if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : (x as Bot).name));
    }
  }
  for (const k of ['BOT_NAMES', 'bots', 'BOTS', 'registry', 'REGISTRY', 'botNames']) {
    const v = reg[k];
    if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : (x as Bot).name));
    if (v && typeof v === 'object') return Object.keys(v);
  }
  return [];
}
