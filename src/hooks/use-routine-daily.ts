import { useCallback, useEffect, useMemo, useState } from 'react';

import { getRoutineRepository } from '../services/routine-service';
import type { IRoutineRepository, RoutineItem } from '../types/routine';
import {
  calculateDailyProgress,
  filterAndSortDailyItems,
  formatDateToExtenso,
  getGreeting,
  getTodayDayOfWeek,
  getTodayLocalDateString,
} from '../utils/routine-daily';

export interface UseRoutineDailyOptions {
  userId?: string;
  referenceDate?: Date;
  repository?: IRoutineRepository;
  userName?: string | null;
}

export function useRoutineDaily(options?: UseRoutineDailyOptions) {
  const userId = options?.userId ?? 'current-user';
  const repository = options?.repository ?? getRoutineRepository();
  const referenceDate = options?.referenceDate;
  const userName = options?.userName;

  const [allItems, setAllItems] = useState<RoutineItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeDate = useMemo(() => referenceDate ?? new Date(), [referenceDate]);
  const todayDate = useMemo(() => getTodayLocalDateString(activeDate), [activeDate]);
  const dayOfWeek = useMemo(() => getTodayDayOfWeek(activeDate), [activeDate]);
  const dateExtenso = useMemo(() => formatDateToExtenso(activeDate), [activeDate]);
  const greeting = useMemo(() => getGreeting(activeDate, userName), [activeDate, userName]);

  // Carregamento inicial rápido (< 1.5s, Desempenho.NF002)
  useEffect(() => {
    let isMounted = true;

    async function executeLoad() {
      try {
        const [items, completions] = await Promise.all([
          repository.listItems(userId, { onlyActive: true }),
          repository.listCompletionsForDate(userId, todayDate),
        ]);

        if (isMounted) {
          setAllItems(items);
          setCompletedIds(new Set(completions.map((c) => c.itemId)));
          setErrorMessage(null);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar a rotina de hoje.';
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void executeLoad();

    return () => {
      isMounted = false;
    };
  }, [repository, userId, todayDate]);

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [items, completions] = await Promise.all([
        repository.listItems(userId, { onlyActive: true }),
        repository.listCompletionsForDate(userId, todayDate),
      ]);
      setAllItems(items);
      setCompletedIds(new Set(completions.map((c) => c.itemId)));
      setErrorMessage(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar rotina.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [repository, userId, todayDate]);

  // Itens unificados do dia (hábitos de hoje + tarefas com targetDate de hoje)
  const dailyItems = useMemo(() => {
    return filterAndSortDailyItems(allItems, todayDate, dayOfWeek);
  }, [allItems, todayDate, dayOfWeek]);

  // Progresso dinâmico (X de Y concluídas + ratio)
  const progress = useMemo(() => {
    return calculateDailyProgress(dailyItems, completedIds);
  }, [dailyItems, completedIds]);

  // Alternância otimista com resposta visual < 200ms [Desempenho.NF001, Gestao da Rotina.RF005]
  const toggleItem = useCallback(
    async (item: RoutineItem) => {
      const wasCompleted = completedIds.has(item.id);

      // Atualização otimista imediata na UI
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (wasCompleted) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });

      try {
        await repository.toggleCompletion(
          userId,
          {
            id: item.id,
            type: item.type,
            scheduledTime: item.scheduledTime,
          },
          todayDate
        );
      } catch (err) {
        // Rollback do estado otimista caso ocorra erro
        setCompletedIds((prev) => {
          const rollback = new Set(prev);
          if (wasCompleted) {
            rollback.add(item.id);
          } else {
            rollback.delete(item.id);
          }
          return rollback;
        });

        const msg = err instanceof Error ? err.message : 'Erro ao alternar conclusão.';
        setErrorMessage(msg);
      }
    },
    [completedIds, repository, userId, todayDate]
  );

  return {
    allItems,
    dailyItems,
    completedIds,
    progress,
    isLoading,
    isRefreshing,
    errorMessage,
    todayDate,
    dateExtenso,
    greeting,
    toggleItem,
    refresh,
  };
}
