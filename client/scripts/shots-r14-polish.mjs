// Bilder Runde 14b (Wissensbaum-Tafel, Turm-Leiste): npm run build && node scripts/shots-r14-polish.mjs [baum|leiste ...]
// -> docs/r14/polish-*.png. Prueft nebenbei: kein Scrollen im Wissensbaum, Porträts mittig.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r14');
mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);
const want = (k) => only.length === 0 || only.includes(k);
const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4173));
const browser = await launch();
let code = 0;
const errorsAll = [];
const SIZES = [[1920, 1080], [1280, 720]];

async function open(ctx, q = '?debug&seed=7') {
  const page = await ctx.newPage();
  errorsAll.push(watchErrors(page));
  await page.goto(url + q);
  await page.waitForSelector('.app-play', { timeout: 20000 });
  return page;
}

try {
  if (want('baum')) {
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await open(ctx, '?debug&level=40&seed=7');
      await page.click('.navbtn:nth-child(2)');
      await page.waitForSelector('.knode');
      for (let i = 0; i < 16; i++) {
        const n = page.locator('.knode.available').nth(i % 3);
        if (!(await n.count())) break;
        await n.click();
        await page.waitForSelector('.knode');
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(1300);
      const geo = await page.evaluate(() => {
        const sc = document.querySelector('.dw-screens');
        const b = document.querySelector('.kboard').getBoundingClientRect();
        const out = [...document.querySelectorAll('.knode')].filter((n) => { const r = n.getBoundingClientRect(); return r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1; }).length;
        return { sw: sc.scrollWidth, cw: sc.clientWidth, sh: sc.scrollHeight, ch: sc.clientHeight, nodes: document.querySelectorAll('.knode').length, outside: out, cell: getComputedStyle(document.querySelector('.kboard')).getPropertyValue('--cell') };
      });
      console.log('baum', w, JSON.stringify(geo));
      if (geo.sw > geo.cw || geo.sh > geo.ch || geo.outside || geo.nodes !== 40) { console.error('Wissensbaum: Scroll/ausserhalb', w); code = 1; }
      await page.mouse.move(5, 5);
      await page.hover('.knode.available');
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${out}/polish-wissensbaum-${w}.png` });
      await ctx.close();
    }
  }
  if (want('leiste')) {
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await open(ctx);
      await page.click('.diff[data-diff="medium"]');
      await page.click('.app-play');
      await page.waitForSelector('.m-canvas', { timeout: 20000 });
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => [...document.querySelectorAll('.m-card .m-port canvas')].map((c) => { const r = c.getBoundingClientRect(); const p = c.parentElement.getBoundingClientRect(); return { dx: Math.round((r.left + r.width / 2) - (p.left + p.width / 2)), dy: Math.round((r.top + r.height / 2) - (p.top + p.height / 2)), w: Math.round(r.width), h: Math.round(r.height), pw: Math.round(p.width), ph: Math.round(p.height) }; }));
      console.log('leiste', w, JSON.stringify(m));
      await page.screenshot({ path: `${out}/polish-turmleiste-${w}.png` });
      await ctx.close();
    }
  }
  stop();
} catch (e) {
  console.error(e);
  code = 1;
}
const errs = errorsAll.flat();
if (errs.length) { console.error('Konsolenfehler:', errs.slice(0, 8)); code = 1; }
await browser.close();
process.exit(code);
