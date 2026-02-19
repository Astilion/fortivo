import { parseInteger, parseDecimal } from '@/utils/numbers';

describe('parseInteger', () => {
  test('parses valid integer string', () => {
    expect(parseInteger('42')).toBe(42);
  });
  test('returns 0 for empty string', () => {
    expect(parseInteger('')).toBe(0);
  });
  test('returns 0 for non-numeric string', () => {
    expect(parseInteger('abc')).toBe(0);
  });
  test('trims whitespace', () => {
    expect(parseInteger('   ')).toBe(0);
  });
  test('returns only numeric part of string', () => {
    expect(parseInteger('42abc')).toBe(42);
  });
  test('returns integer part of decimal string', () => {
    expect(parseInteger('3.7')).toBe(3);
  });
});

describe('parseDecimal', () => {
  test('parses valid decimal string', () => {
    expect(parseDecimal('3.14')).toBe(3.14);
  });
  test('parses decimal string with comma', () => {
    expect(parseDecimal('3,14')).toBe(3.14);
  });
  test('returns 0 for empty string', () => {
    expect(parseDecimal('')).toBe(0);
  });
  test('returns 0 for non-numeric string', () => {
    expect(parseDecimal('abc')).toBe(0);
  });
});
