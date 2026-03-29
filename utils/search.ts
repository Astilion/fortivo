const DIACRITICS_MAP: Record<string, string> = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
  'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
};

export const normalize = (text: string): string => {
  return text
    .toLowerCase()
    .split('')
    .map((char) => DIACRITICS_MAP[char] || char)
    .join('');
};

export const matchesSearch = (query: string, ...fields: (string | undefined)[]): boolean => {
  if (!query.trim()) return true;

  const normalizedFields = fields
    .filter(Boolean)
    .map((f) => normalize(f!))
    .join(' ');

  const words = normalize(query).split(/\s+/);

  return words.every((word) => normalizedFields.includes(word));
};