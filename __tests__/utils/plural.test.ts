import { describe, test, expect } from '@jest/globals';
import { polishPlural } from '@/utils/plural';

const trening = (n: number) =>
  polishPlural(n, 'trening', 'treningi', 'treningów');

describe('polishPlural', () => {
  test.each([
    [0, 'treningów'],
    [1, 'trening'],
    [2, 'treningi'],
    [4, 'treningi'],
    [5, 'treningów'],
    [11, 'treningów'],
    [12, 'treningów'],
    [14, 'treningów'],
    [21, 'treningów'],
    [22, 'treningi'],
    [24, 'treningi'],
    [25, 'treningów'],
    [101, 'treningów'],
    [102, 'treningi'],
    [112, 'treningów'],
    [122, 'treningi'],
  ])('%i → %s', (count, expected) => {
    expect(trening(count)).toBe(expected);
  });
});
