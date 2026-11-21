import { useCallback, useEffect, useState } from 'react';

import { getRoutineRepository } from '../services/routine-service';
import type {
  DayOfWeek,
  DurationMinutes,
  IRoutineRepository,
  ItemType,
  LocalDateString,
  LocalTimeString,
  RecurrenceKind,
  RoutineItem,
} from '../types/routine';
import { getTodayLocalDateString } from '../utils/routine-daily';
import {
  isValidDateString,
  isValidTimeString,
} from '../utils/routine-validation';
import { useReminderSync } from './use-reminder-sync';

export interface UseItemFormOptions {
  userId?: string;
  itemId?: string;
  initialType?: ItemType;
  repository?: IRoutineRepository;
  onSuccess?: (item: RoutineItem) => void;
  referenceDate?: Date;
}

export interface UseItemFormReturn {
  // Estados do formulário
  type: ItemType;
  title: string;
  category: string;
  scheduledTime: string;
  durationMinutes: DurationMinutes;
  recurrenceKind: RecurrenceKind;
  daysOfWeek: DayOfWeek[];
  targetDate: LocalDateString;
  note: string;
  // Estados de controle
  isLoading: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  errors: Record<string, string>;
  generalError: string | null;
  // Ações
  setType: (type: ItemType) => void;
  setTitle: (title: string) => void;
  setCategory: (category: string) => void;
  setScheduledTime: (time: string) => void;
  setDurationMinutes: (duration: DurationMinutes) => void;
  setRecurrenceKind: (kind: RecurrenceKind) => void;
  toggleDayOfWeek: (day: DayOfWeek) => void;
  setDaysOfWeek: (days: DayOfWeek[]) => void;
  setTargetDate: (date: LocalDateString) => void;
  setNote: (note: string) => void;
  validate: () => boolean;
  submit: () => Promise<RoutineItem | null>;
}

export function useItemForm(options?: UseItemFormOptions): UseItemFormReturn {
  const userId = options?.userId ?? 'current-user';
  const itemId = options?.itemId;
  const initialType = options?.initialType ?? 'task';
  const repository = options?.repository ?? getRoutineRepository();
  const onSuccess = options?.onSuccess;
  const referenceDate = options?.referenceDate ?? new Date();

  const defaultToday = getTodayLocalDateString(referenceDate);
  const { syncHabitReminder } = useReminderSync();

  const isEditing = Boolean(itemId);

  const [type, setTypeState] = useState<ItemType>(initialType);
  const [title, setTitleState] = useState<string>('');
  const [category, setCategoryState] = useState<string>('');
  const [scheduledTime, setScheduledTimeState] = useState<string>('');
  const [durationMinutes, setDurationMinutesState] = useState<DurationMinutes>(30);
  const [recurrenceKind, setRecurrenceKindState] = useState<RecurrenceKind>('daily');
  const [daysOfWeek, setDaysOfWeekState] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]); // Padrão: Seg a Sex se semanal
  const [targetDate, setTargetDateState] = useState<LocalDateString>(defaultToday);
  const [note, setNoteState] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(isEditing);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Carrega item para edição quando itemId for fornecido
  useEffect(() => {
    if (!itemId) {
      return;
    }

    let isMounted = true;

    async function loadItem() {
      try {
        const item = await repository.getItem(userId, itemId as string);
        if (isMounted && item) {
          setTypeState(item.type);
          setTitleState(item.title);
          setCategoryState(item.category ?? '');
          setScheduledTimeState(item.scheduledTime ?? '');
          setDurationMinutesState(item.durationMinutes);
          setNoteState(item.note ?? '');

          if (item.type === 'habit' && item.recurrence) {
            setRecurrenceKindState(item.recurrence.kind);
            setDaysOfWeekState(item.recurrence.daysOfWeek ?? []);
          }

          if (item.type === 'task' && item.targetDate) {
            setTargetDateState(item.targetDate);
          }
        } else if (isMounted && !item) {
          setGeneralError('Item não encontrado ou já excluído.');
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar item para edição.';
          setGeneralError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      isMounted = false;
    };
  }, [itemId, repository, userId]);

  // Setters com limpeza reativa de erros do campo
  const setType = useCallback((newType: ItemType) => {
    setTypeState(newType);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.type;
      delete next.scheduledTime;
      delete next.recurrence;
      return next;
    });
  }, []);

  const setTitle = useCallback((val: string) => {
    setTitleState(val);
    setErrors((prev) => {
      if (!prev.title) return prev;
      const next = { ...prev };
      delete next.title;
      return next;
    });
  }, []);

  const setCategory = useCallback((val: string) => {
    setCategoryState(val);
  }, []);

  const setScheduledTime = useCallback((val: string) => {
    setScheduledTimeState(val);
    setErrors((prev) => {
      if (!prev.scheduledTime) return prev;
      const next = { ...prev };
      delete next.scheduledTime;
      return next;
    });
  }, []);

  const setDurationMinutes = useCallback((val: DurationMinutes) => {
    setDurationMinutesState(val);
  }, []);

  const setRecurrenceKind = useCallback((val: RecurrenceKind) => {
    setRecurrenceKindState(val);
    setErrors((prev) => {
      if (!prev.recurrence) return prev;
      const next = { ...prev };
      delete next.recurrence;
      return next;
    });
  }, []);

  const toggleDayOfWeek = useCallback((day: DayOfWeek) => {
    setDaysOfWeekState((prev) => {
      const exists = prev.includes(day);
      let updated: DayOfWeek[];
      if (exists) {
        updated = prev.filter((d) => d !== day);
      } else {
        updated = [...prev, day].sort((a, b) => a - b);
      }
      return updated;
    });
    setErrors((prev) => {
      if (!prev.recurrence) return prev;
      const next = { ...prev };
      delete next.recurrence;
      return next;
    });
  }, []);

  const setDaysOfWeek = useCallback((days: DayOfWeek[]) => {
    setDaysOfWeekState([...days].sort((a, b) => a - b));
    setErrors((prev) => {
      if (!prev.recurrence) return prev;
      const next = { ...prev };
      delete next.recurrence;
      return next;
    });
  }, []);

  const setTargetDate = useCallback((date: LocalDateString) => {
    setTargetDateState(date);
    setErrors((prev) => {
      if (!prev.targetDate) return prev;
      const next = { ...prev };
      delete next.targetDate;
      return next;
    });
  }, []);

  const setNote = useCallback((val: string) => {
    setNoteState(val);
    setErrors((prev) => {
      if (!prev.note) return prev;
      const next = { ...prev };
      delete next.note;
      return next;
    });
  }, []);

  // Validação estrita conforme Documento de Requisitos e Critérios de Aceite
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Título obrigatório (1–80 caracteres)
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'O título é obrigatório.';
    } else if (trimmedTitle.length > 80) {
      newErrors.title = 'O título não pode exceder 80 caracteres.';
    }

    // 2. Nota pessoal opcional (até 280 caracteres)
    if (note && note.length > 280) {
      newErrors.note = 'A nota pessoal não pode exceder 280 caracteres.';
    }

    // 3. Regras específicas para Hábito vs Tarefa
    if (type === 'habit') {
      const cleanTime = scheduledTime.trim();
      if (!cleanTime) {
        newErrors.scheduledTime = 'Horário agendado (HH:mm) é obrigatório para hábitos.';
      } else if (!isValidTimeString(cleanTime)) {
        newErrors.scheduledTime = 'Horário inválido. Utilize o formato 24h HH:mm (ex.: 08:30).';
      }

      if (recurrenceKind === 'weekly' && daysOfWeek.length === 0) {
        newErrors.recurrence = 'Selecione ao menos 1 dia da semana para o hábito semanal.';
      }
    } else {
      // Tarefa
      if (!isValidDateString(targetDate)) {
        newErrors.targetDate = 'Data alvo inválida. Formato obrigatório: YYYY-MM-DD.';
      }

      if (scheduledTime.trim() && !isValidTimeString(scheduledTime.trim())) {
        newErrors.scheduledTime = 'Horário inválido. Utilize o formato 24h HH:mm (ex.: 14:00).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [type, title, note, scheduledTime, recurrenceKind, daysOfWeek, targetDate]);

  // Submissão com persistência no Firestore e emissão de hook de sincronização
  const submit = useCallback(async (): Promise<RoutineItem | null> => {
    setGeneralError(null);

    if (!validate()) {
      return null;
    }

    setIsSubmitting(true);

    try {
      const cleanTitle = title.trim();
      const cleanCategory = category.trim() ? category.trim() : null;
      const cleanNote = note.trim() ? note.trim() : null;
      const cleanScheduledTime = scheduledTime.trim()
        ? (scheduledTime.trim() as LocalTimeString)
        : null;

      let savedItem: RoutineItem;

      if (isEditing && itemId) {
        // Atualização de item existente
        if (type === 'habit') {
          savedItem = await repository.updateItem(userId, itemId, {
            title: cleanTitle,
            category: cleanCategory,
            note: cleanNote,
            scheduledTime: cleanScheduledTime as LocalTimeString,
            durationMinutes,
            recurrence: {
              kind: recurrenceKind,
              daysOfWeek: recurrenceKind === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
            },
          });
        } else {
          savedItem = await repository.updateItem(userId, itemId, {
            title: cleanTitle,
            category: cleanCategory,
            note: cleanNote,
            scheduledTime: cleanScheduledTime,
            durationMinutes,
            targetDate,
          });
        }
      } else {
        // Criação de novo item
        if (type === 'habit') {
          savedItem = await repository.createItem(userId, {
            type: 'habit',
            title: cleanTitle,
            category: cleanCategory,
            note: cleanNote,
            scheduledTime: cleanScheduledTime as LocalTimeString,
            durationMinutes,
            recurrence: {
              kind: recurrenceKind,
              daysOfWeek: recurrenceKind === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
            },
          });
        } else {
          savedItem = await repository.createItem(userId, {
            type: 'task',
            title: cleanTitle,
            category: cleanCategory,
            note: cleanNote,
            scheduledTime: cleanScheduledTime,
            durationMinutes,
            targetDate,
          });
        }
      }

      // Critério de Aceite 4: emitir/invocar hook de sincronização de lembrete (Frente 3) ao salvar hábito
      if (savedItem.type === 'habit') {
        try {
          await syncHabitReminder(savedItem);
        } catch {
          // Erro de lembrete não impede o sucesso da persistência [RF001]
        }
      }

      onSuccess?.(savedItem);
      return savedItem;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar item.';
      setGeneralError(msg);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate,
    title,
    category,
    note,
    scheduledTime,
    isEditing,
    itemId,
    type,
    repository,
    userId,
    durationMinutes,
    recurrenceKind,
    daysOfWeek,
    targetDate,
    syncHabitReminder,
    onSuccess,
  ]);

  return {
    type,
    title,
    category,
    scheduledTime,
    durationMinutes,
    recurrenceKind,
    daysOfWeek,
    targetDate,
    note,
    isLoading,
    isSubmitting,
    isEditing,
    errors,
    generalError,
    setType,
    setTitle,
    setCategory,
    setScheduledTime,
    setDurationMinutes,
    setRecurrenceKind,
    toggleDayOfWeek,
    setDaysOfWeek,
    setTargetDate,
    setNote,
    validate,
    submit,
  };
}
