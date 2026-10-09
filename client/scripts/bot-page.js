// Laeuft IM Browser (page.addScriptTag): einfacher Bot fuer Pruefskripte. Braucht die Seite mit ?debug (window.__dw). window.__bot(zielRunde, plan?)
window.__bot = function (target, seedPlan) {
  const { game, match, DATA } = window.__dw;
  const path = DATA.maps.meadow.path;
  const hw = 13;
  const samples = [];
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i];
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 6);
    for (let k = 0; k < n; k++) samples.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  const cover = (x, y, r) => samples.reduce((c, [px, py]) => c + (Math.hypot(px - x, py - y) < r ? 1 : 0), 0);
  const spots = [];
  for (let y = 14; y < 350; y += 6) for (let x = 14; x < 600; x += 6) {
    if (game.canPlace('ranger', x * 1000, y * 1000).ok === false) { const c = game.canPlace('ranger', x * 1000, y * 1000); if (c.reason !== 'no-cash') continue; }
    spots.push({ x, y, c: cover(x, y, 70) });
  }
  spots.sort((a, b) => b.c - a.c);
  const used = [];
  const pick = (r) => { for (const s of spots) { if (used.some((u) => Math.hypot(u.x - s.x, u.y - s.y) < 26)) continue; const ck = game.canPlace('ranger', s.x * 1000, s.y * 1000); if (ck.ok || ck.reason === 'no-cash') { used.push(s); return s; } } return null; };
  const plan = seedPlan ?? ['bombardier', 'ranger', 'frostcaller', 'bombardier', 'ranger', 'wren', 'ranger', 'frostcaller'];
  const upg = [[0, 0], [1, 1], [2, 0], [0, 1], [3, 2], [1, 0], [4, 2], [3, 1]];
  let pi = 0, ui = 0, guard = 0;
  game.apply({ type: 'autoStart', on: true });
  game.apply({ type: 'startRound' });
  while (game.state.round < target && game.state.phase !== 'lost' && guard++ < 4000) {
    match.skip(20);
    const st = game.state;
    if (pi < plan.length) {
      const ty = plan[pi];
      if (st.cash >= game.priceOf(ty)) { const s = pick(); if (s) { const r = game.apply({ type: 'place', tower: ty, x: s.x * 1000, y: s.y * 1000 }); if (r.ok) pi++; } }
    } else {
      const towers = st.towers.filter((t) => t.type !== 'wren');
      for (const t of towers) for (let p = 0; p < 3; p++) { const r = game.apply({ type: 'upgrade', towerId: t.id, path: p }); if (!r.ok && r.reason === 'no-cash') break; }
    }
  }
  return JSON.stringify({ round: game.state.round, phase: game.state.phase, lives: game.state.lives, cash: game.state.cash, towers: game.state.towers.map((t) => t.type + t.tiers.join('')), en: game.state.enemies.length });
};
