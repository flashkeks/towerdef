import { expect, it } from 'vitest';
import { SAVE_SCHEMA } from '../src/index';

it('Speicherstand-Schema ist das von Runde 11', () => {
  expect(SAVE_SCHEMA).toBe(11);
});
