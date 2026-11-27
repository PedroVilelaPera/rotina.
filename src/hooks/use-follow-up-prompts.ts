import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAppAlert } from '@/contexts/alert-context';
import { useAuth } from '@/hooks/use-auth';
import { getRoutineRepository } from '@/services/routine-service';
import { findPendingFollowUpHabits, getFollowUpTriggerDate, hasFollowUpTimeArrived } from '@/services/follow-up';
import { getUserProfileSettings } from '@/services/auth-service';

function handledKey(userId: string, date: string): string {
  return '@rotina/follow-up/' + userId + '/' + date;
}

async function getHandledIds(userId: string, date: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(handledKey(userId, date));
  if (!raw) return new Set();

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

async function markHandled(userId: string, date: string, itemId: string): Promise<void> {
  const handled = await getHandledIds(userId, date);
  handled.add(itemId);
  await AsyncStorage.setItem(handledKey(userId, date), JSON.stringify([...handled]));
}

export function useFollowUpPrompts(): void {
  const { userId } = useAuth();
  const { showAlert } = useAppAlert();

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;

      let isActive = true;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let isChecking = false;
      const repository = getRoutineRepository();

      const checkAndPrompt = async () => {
        if (!isActive || isChecking) return;
        isChecking = true;

        try {
          const settings = await getUserProfileSettings(userId);
          if (!isActive || !settings.nextDayFollowUpEnabled) return;

          const now = new Date();
          if (!hasFollowUpTimeArrived(now, settings.followUpTime)) {
            const triggerDate = getFollowUpTriggerDate(now, settings.followUpTime);
            if (triggerDate) {
              timer = setTimeout(
                () => void checkAndPrompt(),
                Math.max(0, triggerDate.getTime() - now.getTime()),
              );
            }
            return;
          }

          const { date, habits } = await findPendingFollowUpHabits(repository, userId, now);
          const handled = await getHandledIds(userId, date);
          const pending = habits.filter((habit) => !handled.has(habit.id));

          const ask = (index: number): void => {
            if (!isActive || index >= pending.length) return;
            const habit = pending[index];
            let actionChosen = false;

            const continueQueue = () => {
              setTimeout(() => ask(index + 1), 250);
            };

            const markAndContinue = async () => {
              if (actionChosen) return;
              actionChosen = true;
              await markHandled(userId, date, habit.id);
              continueQueue();
            };

            const markCompletedAndContinue = async () => {
              if (actionChosen) return;
              actionChosen = true;
              try {
                await repository.toggleCompletion(
                  userId,
                  { id: habit.id, type: 'habit', scheduledTime: habit.scheduledTime },
                  date,
                );
                await markHandled(userId, date, habit.id);
                continueQueue();
              } catch {
                actionChosen = false;
                showAlert(
                  'Não foi possível registrar',
                  'A conclusão de ontem não foi salva. Você pode tentar novamente mais tarde.',
                );
              }
            };

            showAlert(
              'Follow-up da rotina',
              'Você conseguiu realizar ' + habit.title + ' ontem?',
              [
                { text: 'Sim', onPress: () => void markCompletedAndContinue() },
                { text: 'Não', onPress: () => void markAndContinue() },
                { text: 'Agora não', style: 'cancel', onPress: () => void markAndContinue() },
              ],
              () => void markAndContinue(),
            );
          };

          ask(0);
        } catch {
          // Um erro temporário de rede não bloqueia o acesso à rotina.
        } finally {
          isChecking = false;
        }
      };

      void checkAndPrompt();

      return () => {
        isActive = false;
        if (timer) clearTimeout(timer);
      };
    }, [userId, showAlert]),
  );
}
