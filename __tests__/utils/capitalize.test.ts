import { capitalize } from '@/utils/capitalize';

describe('capitalize', () => {
  test('first letter becomes uppercase', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
  test('does not change the rest of the string', () => {
    expect(capitalize('hello world')).toBe('Hello world');
  });
  test('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });
  test('does not change digits', () => {
    expect(capitalize('123abc')).toBe('123abc');
  });
  test('already capitalized string stays the same', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});
