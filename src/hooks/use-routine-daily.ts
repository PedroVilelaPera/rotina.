import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getRoutineRepository } from '../services/routine-service';
import type { IRoutineRepository, RoutineItem } from '../types/routine';
import { useOptionalAuth } from './use-auth';
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
  const auth = useOptionalAuth();
  const userId = options?.userId ?? auth?.userId ?? 'current-user';
  const repository = options?.repository ?? getRoutineRepository();
  const referenceDate = options?.referenceDate;
  const userName = options?.userName;

  const [allItems, setAllItems] = useState<RoutineItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const completedIdsRef = useRef<Set<string>>(completedIds);

  useEffect(() => {
    completedIdsRef.current = completedIds;
  }, [completedIds]);

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
          const initialSet = new Set(completions.map((c) => c.itemId));
          setAllItems(items);
          completedIdsRef.current = initialSet;
          setCompletedIds(initialSet);
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

  // Atualização de dados (suporta modo silencioso sem piscar o indicador do RefreshControl em trocas de tela)
  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent ?? false;
      if (!isSilent) {
        setIsRefreshing(true);
      }
      try {
        const [items, completions] = await Promise.all([
          repository.listItems(userId, { onlyActive: true }),
          repository.listCompletionsForDate(userId, todayDate),
        ]);
        const refreshedSet = new Set(completions.map((c) => c.itemId));
        setAllItems(items);
        completedIdsRef.current = refreshedSet;
        setCompletedIds(refreshedSet);
        setErrorMessage(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao atualizar rotina.';
        setErrorMessage(msg);
      } finally {
        if (!isSilent) {
          setIsRefreshing(false);
        }
      }
    },
    [repository, userId, todayDate]
  );

  const silentRefresh = useCallback(async () => {
    await refresh({ silent: true });
  }, [refresh]);

  // Itens unificados do dia (hábitos de hoje + tarefas com targetDate de hoje)
  const dailyItems = useMemo(() => {
    return filterAndSortDailyItems(allItems, todayDate, dayOfWeek);
  }, [allItems, todayDate, dayOfWeek]);

  // Progresso dinâmico (X de Y concluídas + ratio)
  const progress = useMemo(() => {
    return calculateDailyProgress(dailyItems, completedIds);
  }, [dailyItems, completedIds]);

  // Alternância otimista com resposta visual imediata (< 200ms) [Desempenho.NF001, Gestao da Rotina.RF005]
  const toggleItem = useCallback(
    async (item: RoutineItem) => {
      // Lê e sincroniza atomicamente com o ref para blindagem contra race conditions
      const wasCompleted = completedIdsRef.current.has(item.id);

      const nextSet = new Set(completedIdsRef.current);
      if (wasCompleted) {
        nextSet.delete(item.id);
      } else {
        nextSet.add(item.id);
      }
      completedIdsRef.current = nextSet;
      setCompletedIds(nextSet);

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
        const rollbackSet = new Set(completedIdsRef.current);
        if (wasCompleted) {
          rollbackSet.add(item.id);
        } else {
          rollbackSet.delete(item.id);
        }
        completedIdsRef.current = rollbackSet;
        setCompletedIds(rollbackSet);

        const msg = err instanceof Error ? err.message : 'Erro ao alternar conclusão.';
        setErrorMessage(msg);
      }
    },
    [repository, userId, todayDate]
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
    silentRefresh,
  };
}
