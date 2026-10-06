/** Misst Ticks/s einer 20-Wave-Stage ohne Bot (godMode). */
import { createSim } from '../src/index.js';

const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, godMode: true });
const t0 = performance.now();
while (!sim.isOver()) sim.step(100);
const dt = (performance.now() - t0) / 1000;
console.log(`ticks=${sim.state.tick} result=${sim.result()} time=${dt.toFixed(3)}s ticks/s=${Math.round(sim.state.tick / dt)} hash=${sim.hash()}`);
