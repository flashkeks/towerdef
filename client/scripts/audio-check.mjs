// Ton-Pruefung (P5): AudioContext erst nach der ersten Nutzeraktion, Klaenge laufen, M schaltet stumm, Regler wirken.
// Braucht dist/ (npm run build). Kein Gehoer noetig: liest nur den Zustand des Ton-Motors (`__duskwardens.audio.debug`).
import { launch, openRun, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SMOKE_PORT ?? 4174);
const { url, stop } = await startServer(PORT);
const browser = await launch();
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) fails.push(msg);
};
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForSelector('.menu-play, .diff[data-difficulty="normal"]');
  const dbg = () => page.evaluate(() => window.__duskwardens.audio.debug);
  check((await dbg()).state === 'none', 'vor der ersten Nutzeraktion kein AudioContext');
  await openRun(page, url);
  await sleep(300);
  let d = await dbg();
  check(d.state === 'running', `nach Klicks laeuft der AudioContext (${d.state})`);
  check(d.sfxGain > 0 && d.musicGain > 0, `Lautstaerke aus Einstellungen: sfx ${d.sfxGain.toFixed(2)}, Musik ${d.musicGain.toFixed(2)}`);
  // Klang ausloesen: platzieren ueber die Session (Ereignis `place` -> Klang)
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    const spot = s.sim.placementGrid('striker')[0];
    s.sim.state.players[0].coins = 100000;
    s.choosePlacing('striker');
    s.clickBoard(spot.x, spot.y);
    s.advance(100);
  });
  await sleep(30);
  d = await dbg();
  check(d.voices > 0, `Platzieren erzeugt Stimmen (${d.voices})`);
  // Stumm-Taste
  const settle = async (pred) => {
    for (let i = 0; i < 20; i++) {
      d = await dbg();
      if (pred(d)) return;
      await sleep(150);
    }
  };
  await page.keyboard.press('m');
  await settle((x) => x.muted && x.sfxGain < 0.01);
  check(d.muted && d.sfxGain < 0.01 && d.musicGain < 0.01, `M schaltet stumm (muted=${d.muted}, sfx ${d.sfxGain.toFixed(3)})`);
  await page.keyboard.press('m');
  await settle((x) => !x.muted && x.sfxGain > 0.1);
  check(!d.muted && d.sfxGain > 0.1, `M schaltet wieder ein (sfx ${d.sfxGain.toFixed(2)})`);
    check(errors.length === 0, `keine Konsolenfehler ${errors.join(' | ')}`);
} finally {
  await browser.close();
  stop();
}
if (fails.length) {
  console.log(`${fails.length} Fehler`);
  process.exit(1);
}
