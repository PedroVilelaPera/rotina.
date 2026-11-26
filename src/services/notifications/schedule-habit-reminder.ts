import * as Notifications from "expo-notifications";

import type { RoutineItem } from "../../types/routine";
import { buildHabitReminderTriggers } from "./build-triggers";
import { ensureNotificationPermission } from "./permissions";

export async function scheduleHabitReminder(
  habit: RoutineItem,
): Promise<boolean> {
  const triggers = buildHabitReminderTriggers(habit);

  // Tarefas, hábitos inativos ou sem recorrência não geram lembretes.
  if (triggers.length === 0) return false;

  const hasPermission = await ensureNotificationPermission();

  // Sem permissão, não agenda; o fluxo de salvar o hábito pode continuar.
  if (!hasPermission) return false;

  const existing = await Notifications.getAllScheduledNotificationsAsync();

  // Encontra apenas os lembretes que pertencem a este hábito.
  const oldReminders = existing.filter(
    (notification) => notification.content.data?.itemId === habit.id,
  );

  const newIds: string[] = [];

  try {
    // Agenda os novos horários antes de cancelar os antigos.
    for (const trigger of triggers) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hora da sua rotina",
          body: `Que tal realizar “${habit.title}”?`,
          data: {
            itemId: habit.id,
            url: `/item-details?id=${encodeURIComponent(habit.id)}`,
          },
        },
        trigger: {
          ...trigger,
        },
      });

      newIds.push(id);
    }
  } catch {
    // Se algum agendamento falhar, tenta remover os novos que já foram criados.
    await Promise.allSettled(
      newIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );

    // Os lembretes antigos ainda não foram cancelados.
    return false;
  }

  // Só remove os antigos depois que todos os novos foram agendados.
  await Promise.all(
    oldReminders.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );

  return true;
}

export async function cancelHabitReminder(habitId: string): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const remindersToCancel = scheduled.filter(
    (notification) => notification.content.data?.itemId === habitId,
  );

  await Promise.all(
    remindersToCancel.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );

  return true;
}

export async function cancelAllReminders(): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  return true;
}
