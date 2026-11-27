import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { getRoutineRepository } from '@/services/routine-service';
import type { AchievementsData } from '@/types/achievements';
import type { CompletionRecord, RoutineItem } from '@/types/routine';
import { calculateAchievements } from '@/utils/achievements';
import { getTodayLocalDateString } from '@/utils/routine-daily';

export function useAchievements() {
  const { userId } = useAuth();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const repository = getRoutineRepository();
      const effectiveUserId = userId ?? 'current-user';
      const items: RoutineItem[] = await repository.listItems(effectiveUserId, {
        onlyActive: false,
      });
      const completionGroups = await Promise.all(
        items.map((item) => repository.listCompletionsForItem(effectiveUserId, item.id)),
      );
      const completions: CompletionRecord[] = completionGroups.flat();

      setData(
        calculateAchievements(
          completions,
          items,
          getTodayLocalDateString(new Date()),
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar suas conquistas. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  return { data, isLoading, isRefreshing, errorMessage, refresh };
}
