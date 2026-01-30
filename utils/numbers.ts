
export const parseInteger = (text: string): number => {
  if (!text || text.trim() === '') return 0;
  
  const value = parseInt(text, 10);
  return isNaN(value) ? 0 : value;
};

export const parseDecimal = (text: string): number => {
  if (!text || text.trim() === '') return 0;
  const normalized = text.replace(',', '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : value;
};
