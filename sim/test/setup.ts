/**
 * Testkarte `bare`: dieselbe Wiese wie `meadow`, aber ohne Wasser und Blocker. Die Regel-Tests platzieren an festen
 * Koordinaten; die gemalte Karte (P3: Baeume, Haeuser, Bach) soll sie nicht brechen. Bot-Laeufe bleiben auf `meadow`.
 */
import { DATA } from '../src/index';

(DATA.maps as Record<string, unknown>).bare = { ...DATA.maps.meadow, id: 'bare', water: [], blockers: [] };
