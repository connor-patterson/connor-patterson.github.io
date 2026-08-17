import { describe, expect, it } from 'vitest';

import {
  localDayKey,
  nextRandom,
  readBestScore,
  seedForDay,
  writeBestScore,
} from './arcade-session';

describe('arcade session helpers', () => {
  it('uses the player local calendar day', () => {
    expect(localDayKey(new Date(2026, 7, 16, 23, 59))).toBe('2026-08-16');
  });

  it('creates repeatable game specific seeds', () => {
    expect(seedForDay('snake', '2026-08-16')).toBe(seedForDay('snake', '2026-08-16'));
    expect(seedForDay('snake', '2026-08-16')).not.toBe(seedForDay('memory', '2026-08-16'));
    expect(seedForDay('snake', '2026-08-16')).not.toBe(seedForDay('snake', '2026-08-17'));
  });

  it('advances a deterministic random stream', () => {
    const first = nextRandom(42);
    const repeated = nextRandom(42);
    const second = nextRandom(first[1]);

    expect(first).toEqual(repeated);
    expect(second[0]).not.toBe(first[0]);
    expect(first[0]).toBeGreaterThanOrEqual(0);
    expect(first[0]).toBeLessThan(1);
  });

  it('keeps a high score in this browser', () => {
    localStorage.removeItem('patteros.arcade.snake.test');
    writeBestScore('snake', 'test', 12);
    expect(readBestScore('snake', 'test')).toBe(12);
  });
});
