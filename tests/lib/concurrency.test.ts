import { describe, expect, it } from 'vitest';
import { chunk, mapWithConcurrency } from '../../src/lib/concurrency.js';

describe('mapWithConcurrency', () => {
  it('mantém a ordem e respeita o limite', async () => {
    let running = 0;
    let peak = 0;
    const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5 - value));
      running -= 1;
      return value * 10;
    });
    expect(result).toEqual([10, 20, 30, 40, 50]);
    expect(peak).toBe(2);
  });

  it('lida com lista vazia', async () => {
    expect(await mapWithConcurrency([], 3, async (value) => value)).toEqual([]);
  });
});

describe('chunk', () => {
  it('divide em blocos', () => {
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });
});
