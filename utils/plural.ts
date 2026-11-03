// Polish noun form after a count: 1 trening · 2–4, 22–24 treningi · 0, 5–21, 25 treningów.
// 12–14 take the "many" form even though they end in 2–4.
export const polishPlural = (
  count: number,
  one: string,
  few: string,
  many: string,
): string => {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const isFew =
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14);
  return isFew ? few : many;
};
