/**
 * Avalia se o horário real de conclusão está dentro da janela de tolerância de ±15 min do planejado.
 */
export function isPunctual(
  scheduledTime: string | null,
  completedAtTimestamp: number,
  toleranceMinutes = 15,
): boolean {
  if (!scheduledTime) return false;

  const [schedH, schedM] = scheduledTime.split(":").map(Number);
  const completedDate = new Date(completedAtTimestamp);

  const schedTotal = schedH * 60 + schedM;
  const compTotal = completedDate.getHours() * 60 + completedDate.getMinutes();

  return Math.abs(schedTotal - compTotal) <= toleranceMinutes;
}
