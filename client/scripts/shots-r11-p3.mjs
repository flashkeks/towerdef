// Screenshots + kurzes Video fuer Runde 11 / P3 -> client/docs/r11/p3-*.png, p3-match.webm
// Aufruf: npm run build && node scripts/shots-r11-p3.mjs
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r11');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve();
const browser = await launch();
const bot = readFileSync(resolve(root, 'scripts/bot-page.js'), 'utf8');
const VIEW = { width: 1600, height: 900 };

async function open(ctx, qs = '?debug&diff=easy&seed=5') {
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(url + qs);
  await page.waitForSelector('.m-canvas', { timeout: 20000 });
  await page.waitForTimeout(500);
  const rect = await page.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const at = (mx, my) => [rect.x + (mx / 640) * rect.w, rect.y + (my / 360) * rect.h];
  return { page, errors, rect, at };
}

try {
  const ctx = await browser.newContext({ viewport: VIEW });

  // 1) leere Karte (nur das Spielfeld) und die Vollansicht
  {
    const { page, errors } = await open(ctx);
    await page.waitForTimeout(800);
    await page.locator('.m-canvas').screenshot({ path: `${out}/p3-karte-leer.png` });
    await page.screenshot({ path: `${out}/p3-match-leer.png` });
    console.log('karte-leer', errors.length ? errors : 'ok');
    await page.close();
  }

  // 2) Kampf Runde 15 (Bot) + Upgrade-Panel + Held-Panel
  {
    const { page, errors, at } = await open(ctx);
    await page.addScriptTag({ content: bot });
    console.log(await page.evaluate(() => window.__bot(15)));
    await page.evaluate(() => __dw.game.sandbox.setCash(9000));
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/p3-kampf-r15.png` });
    // Upgrade-Panel: einen Ranger mit Stufen waehlen
    const id = await page.evaluate(() => { const t = __dw.game.state.towers.find((q) => q.type === 'ranger'); __dw.match.select(t.id); return t.id; });
    await page.waitForSelector('.m-panel:not(.hidden) .p-tier');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/p3-upgrade-panel.png` });
    // Frostcaller (Crosspath-Sperre sichtbar)
    await page.evaluate(() => { const t = __dw.game.state.towers.find((q) => q.type === 'frostcaller'); __dw.match.select(t.id); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/p3-upgrade-panel-frost.png` });
    await page.evaluate(() => { const t = __dw.game.state.towers.find((q) => q.type === 'wren'); __dw.match.select(t.id); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/p3-held-panel.png` });
    console.log('kampf', errors.length ? errors : 'ok', id);
    await page.close();
  }

  // 3) Platzieren (gueltig und ungueltig)
  {
    const { page, errors, at } = await open(ctx);
    await page.keyboard.press('q');
    await page.mouse.move(...at(170, 150));
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/p3-platzieren.png` });
    await page.mouse.move(...at(120, 150)); // auf dem Weg
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/p3-platzieren-ungueltig.png` });
    await page.mouse.click(...at(120, 150));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/p3-platzieren-toast.png` });
    console.log('platzieren', errors.length ? errors : 'ok');
    await page.close();
  }

  // 3b) Sperren (Turm-XP und Spieler-Level), Pruefhilfe ?lock
  {
    const { page, errors, at } = await open(ctx, '?debug&diff=medium&seed=3&lock');
    await page.keyboard.press('q'); await page.mouse.move(...at(170, 150)); await page.mouse.click(...at(170, 150));
    await page.evaluate(() => __dw.game.sandbox.setCash(5000));
    for (const k of [',', ',', ',', '.', '.', '.']) { await page.keyboard.press(k); await page.waitForTimeout(80); }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/p3-upgrade-gesperrt.png` });
    console.log('gesperrt', errors.length ? errors : 'ok');
    await page.close();
  }

  // 4) Boss-Runde (Sandbox: Leviathan setzen)
  {
    const { page, errors } = await open(ctx);
    await page.addScriptTag({ content: bot });
    await page.evaluate(() => window.__bot(12));
    await page.evaluate(() => { __dw.game.sandbox.spawn('leviathan', 500000); __dw.game.sandbox.spawn('brute', 600000, true); });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${out}/p3-boss.png` });
    console.log('boss', errors.length ? errors : 'ok');
    await page.close();
  }
  await ctx.close();

  // 5) Video: Turme setzen, Runde starten, Upgrade, 2x
  {
    const vctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `${out}/_video`, size: { width: 1280, height: 720 } } });
    const { page, errors, at } = await open(vctx, '?debug&diff=easy&seed=11');
    await page.keyboard.press('q'); await page.mouse.move(...at(150, 140)); await page.waitForTimeout(500); await page.mouse.click(...at(150, 140));
    await page.keyboard.press('w'); await page.mouse.move(...at(85, 200)); await page.waitForTimeout(400); await page.mouse.click(...at(85, 200));
    await page.keyboard.press('Escape');
    await page.keyboard.press(' ');
    await page.waitForTimeout(6000);
    await page.mouse.click(...at(150, 140));
    await page.waitForTimeout(700);
    await page.keyboard.press('.');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.keyboard.press('f');
    await page.waitForTimeout(7000);
    console.log('video', errors.length ? errors : 'ok');
    const vp = await page.video().path();
    await vctx.close();
    copyFileSync(vp, `${out}/p3-match.webm`);
  }
} finally {
  await browser.close();
  stop();
}
