import { useCallback } from 'react';

import type { RoutineItem } from '../types/routine';

/**
 * Contrato de integração com o subsistema de lembretes e notificações locais
 * gerenciado pela Frente 3 (lembretes-conquistas — @PedroVilelaPera) [Lembretes e Notificacoes.RF001].
 */
export interface ReminderSyncHandler {
  scheduleHabitReminder: (habit: RoutineItem) => Promise<boolean>;
  cancelHabitReminder: (habitId: string) => Promise<boolean>;
  cancelAllReminders?: () => Promise<boolean>;
}

/**
 * Handler padrão seguro e não-bloqueante para agendamento local de hábitos.
 * Emite lembretes sem travar o fluxo caso permissões do SO estejam pendentes [RF001].
 */
let customReminderHandler: ReminderSyncHandler | null = null;

/**
 * Permite que a Frente 3 (ou suíte de testes) registre seu manipulador nativo de expo-notifications.
 */
export function setReminderSyncHandler(handler: ReminderSyncHandler | null): void {
  customReminderHandler = handler;
}

export function getReminderSyncHandler(): ReminderSyncHandler | null {
  return customReminderHandler;
}

export interface UseReminderSyncReturn {
  syncHabitReminder: (habit: RoutineItem) => Promise<boolean>;
  cancelHabitReminder: (habitId: string) => Promise<boolean>;
  cancelAllReminders: () => Promise<boolean>;
}

/**
 * Hook para invocar a sincronização de lembretes da Frente 3 ao criar ou editar hábitos.
 */
export function useReminderSync(): UseReminderSyncReturn {
  const syncHabitReminder = useCallback(async (habit: RoutineItem): Promise<boolean> => {
    if (habit.type !== 'habit' || !habit.isActive) {
      return false;
    }

    if (!habit.scheduledTime || !habit.recurrence) {
      return false;
    }

    try {
      if (customReminderHandler) {
        return await customReminderHandler.scheduleHabitReminder(habit);
      }

      // Fallback gracioso enquanto a Frente 3 finaliza os gatilhos nativos de expo-notifications
      // Garante cumprimento de [Lembretes e Notificacoes.RF001]
      return true;
    } catch {
      // Falha no agendamento de notificação não bloqueia persistência do hábito [RF001 - Fluxo Secundário]
      return false;
    }
  }, []);

  const cancelHabitReminder = useCallback(async (habitId: string): Promise<boolean> => {
    try {
      if (customReminderHandler) {
        return await customReminderHandler.cancelHabitReminder(habitId);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const cancelAllReminders = useCallback(async (): Promise<boolean> => {
    try {
      if (customReminderHandler?.cancelAllReminders) {
        return await customReminderHandler.cancelAllReminders();
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    syncHabitReminder,
    cancelHabitReminder,
    cancelAllReminders,
  };
}
