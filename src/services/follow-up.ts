import type { IRoutineRepository, LocalDateString, RoutineItem } from '../types/routine';
import {
  getTodayDayOfWeek,
  getYesterdayLocalDateString,
  isItemScheduledForDay,
} from '../utils/routine-daily';
import { isValidTimeString } from '../utils/routine-validation';

export function hasFollowUpTimeArrived(now: Date, followUpTime: string): boolean {
  if (!isValidTimeString(followUpTime)) return false;

  const [hour, minute] = followUpTime.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
}

export function getFollowUpTriggerDate(now: Date, followUpTime: string): Date | null {
  if (!isValidTimeString(followUpTime)) return null;

  const [hour, minute] = followUpTime.split(':').map(Number);
  const triggerDate = new Date(now);
  triggerDate.setHours(hour, minute, 0, 0);
  return triggerDate;
}

export async function findPendingFollowUpHabits(
  repository: IRoutineRepository,
  userId: string,
  referenceDate: Date = new Date(),
): Promise<{ date: LocalDateString; habits: RoutineItem[] }> {
  const yesterday = getYesterdayLocalDateString(referenceDate);
  const yesterdayDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 1,
  );
  const yesterdayWeekday = getTodayDayOfWeek(yesterdayDate);
  const items = await repository.listItems(userId, { onlyActive: true });
  const scheduledHabits = items.filter(
    (item) =>
      item.type === 'habit' &&
      isItemScheduledForDay(item, yesterday, yesterdayWeekday),
  );

  const completionResults = await Promise.all(
    scheduledHabits.map((habit) => repository.getCompletion(userId, habit.id, yesterday)),
  );

  return {
    date: yesterday,
    habits: scheduledHabits.filter((_, index) => completionResults[index] === null),
  };
}
