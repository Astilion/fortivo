export const formatDate = (
  date: string | Date,
  showTime: boolean = true,
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(showTime && { hour: '2-digit', minute: '2-digit' }),
  });
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Dzień dobry';
  if (hour < 18) return 'Dzień dobry';
  return 'Dobry wieczór';
};
