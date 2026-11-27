/** Calcula a maior sequência de dias civis consecutivos com ao menos uma conclusão. */
export function calculateLongestStreak(dates: string[]): number {
  const uniqueDates = [...new Set(dates)].sort();
  if (uniqueDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDates.length; index++) {
    const previous = toUtcDay(uniqueDates[index - 1]);
    const currentDay = toUtcDay(uniqueDates[index]);

    if (currentDay - previous === 86_400_000) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function toUtcDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}
