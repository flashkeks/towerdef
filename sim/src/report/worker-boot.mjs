// Startet worker.ts unter tsx (Entwicklung: `npm run sim`); im gebauten dist wird worker.js direkt genutzt.
import { register } from 'tsx/esm/api';

register();
await import('./worker.ts');
