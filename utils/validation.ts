/**
 * Validates RPE (Rate of Perceived Exertion) input.
 * Allowed values: 1 to 10, in 0.5 increments (e.g. 6, 7.5, 10)
 * Returns validated & rounded value, or null if invalid.
 */
export const validateRPE = (input: string): number | null => {
  if (!input.trim()) return null;
  const value = parseFloat(input);
  if (isNaN(value)) return null;
  if (value < 1 || value > 10) return null;
  return Math.round(value * 2) / 2;
};

/**
 * Validates Tempo input.
 * Allowed formats: "X-X-X" or "X-X-X-X" where X is a single digit (0-9)
 * Returns the input string if valid, or null if invalid.
 */
export const validateTempo = (input: string): string | null => {
  if (!input.trim()) return null;

  // Auto-format: "312" → "3-1-2", "3120" → "3-1-2-0"
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 3 || digitsOnly.length === 4) {
    input = digitsOnly.split('').join('-');
  }

  const regex = /^\d-\d-\d(-\d)?$/;
  return regex.test(input) ? input : null;
};
