import {
  SchedulableTriggerInputTypes,
  type SchedulableNotificationTriggerInput,
} from "expo-notifications";

import type { RoutineItem } from "../../types/routine";

export function buildHabitReminderTriggers(
  habit: RoutineItem,
): SchedulableNotificationTriggerInput[] {
  if (
    habit.type !== "habit" ||
    !habit.isActive ||
    !habit.scheduledTime ||
    !habit.recurrence
  ) {
    return [];
  }

  const [hour, minute] = habit.scheduledTime.split(":").map(Number);

  if (habit.recurrence.kind === "daily") {
    return [
      {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    ];
  }

  return [...new Set(habit.recurrence.daysOfWeek)].map((day) => ({
    type: SchedulableTriggerInputTypes.WEEKLY,
    weekday: day + 1,
    hour,
    minute,
  }));
}
