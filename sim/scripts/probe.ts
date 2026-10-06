import { createSim } from '../src/index.js';
const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3 });
const buy = (u: string, kind: 'ground'|'hill', n=0) => { const f = sim.slots().filter(s=>s.free&&s.kind===kind&&s.size===1).map(s=>s.id); const r = sim.apply(0,{type:'place',unitId:u,slot:f[n]}); return r; };
buy('striker','ground'); buy('gunner','hill');
let w=0;
while(!sim.isOver()){
  if (w===2) buy('blaster','ground');
  if (w===4) buy('banner','ground');
  for (const u of sim.state.units) for(let i=0;i<3;i++) if(sim.upgradeCost(u.id)!==null) sim.apply(0,{type:'upgrade',entityId:u.id});
  sim.runWave(); w++;
  console.log(w, 'baseHp', sim.state.baseHp, 'coins', sim.state.players[0].coins, 'kills', sim.state.stats.kills, 'leaks', sim.state.stats.leaks);
}
console.log(sim.result(), sim.state.tick);
