import type { DayOfWeek, LocalDateString, RoutineItem } from '../types/routine';

/**
 * Retorna a data local atual no formato estrito YYYY-MM-DD [Padroes.NF001].
 * Utiliza as coordenadas locais do relógio do dispositivo para evitar discrepâncias UTC.
 */
export function getTodayLocalDateString(referenceDate: Date = new Date()): LocalDateString {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as LocalDateString;
}

/**
 * Retorna o dia da semana atual conforme convenção JS (0 = Domingo .. 6 = Sábado).
 */
export function getTodayDayOfWeek(referenceDate: Date = new Date()): DayOfWeek {
  return referenceDate.getDay() as DayOfWeek;
}

/**
 * Formata a data por extenso em português do Brasil (ex.: "Sexta-feira, 20 de novembro").
 */
export function formatDateToExtenso(referenceDate: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(referenceDate);

    // Capitaliza a primeira letra (ex: "sexta-feira..." -> "Sexta-feira...")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    // Fallback defensivo em caso de ausência de Intl no ambiente
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const months = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];
    return `${days[referenceDate.getDay()]}, ${referenceDate.getDate()} de ${months[referenceDate.getMonth()]}`;
  }
}

/**
 * Retorna a saudação pessoal baseada no horário do dia.
 */
export function getGreeting(
  referenceDate: Date = new Date(),
  userName?: string | null
): string {
  const hour = referenceDate.getHours();
  let baseGreeting = 'Bom dia';

  if (hour >= 12 && hour < 18) {
    baseGreeting = 'Boa tarde';
  } else if (hour >= 18 || hour < 5) {
    baseGreeting = 'Boa noite';
  }

  const cleanName = userName ? userName.trim() : '';
  if (cleanName) {
    // Primeiro nome do usuário para proximidade acolhedora
    const firstName = cleanName.split(' ')[0];
    return `${baseGreeting}, ${firstName}!`;
  }

  return `${baseGreeting}!`;
}

/**
 * Determina se um item de rotina é aplicável para a data civil e dia da semana informados [RF001].
 */
export function isItemScheduledForDay(
  item: RoutineItem,
  targetDate: LocalDateString,
  dayOfWeek: DayOfWeek
): boolean {
  if (!item.isActive) {
    return false;
  }

  if (item.type === 'habit') {
    if (!item.recurrence) {
      return false;
    }
    if (item.recurrence.kind === 'daily') {
      return true;
    }
    if (item.recurrence.kind === 'weekly') {
      return item.recurrence.daysOfWeek.includes(dayOfWeek);
    }
    return false;
  }

  if (item.type === 'task') {
    return item.targetDate === targetDate;
  }

  return false;
}

/**
 * Filtra e ordena a lista unificada de hábitos e tarefas para o dia atual [RF001].
 * Regra de ordenação: scheduledTime ascendente, itens sem horário ao final.
 */
export function filterAndSortDailyItems(
  items: RoutineItem[],
  targetDate: LocalDateString,
  dayOfWeek: DayOfWeek
): RoutineItem[] {
  const dailyItems = items.filter((item) =>
    isItemScheduledForDay(item, targetDate, dayOfWeek)
  );

  return dailyItems.sort((a, b) => {
    const timeA = a.scheduledTime;
    const timeB = b.scheduledTime;

    // Ambos possuem horário definido: ordenação cronológica direta (HH:mm)
    if (timeA && timeB) {
      return timeA.localeCompare(timeB);
    }

    // Apenas 'a' possui horário: 'a' precede 'b'
    if (timeA && !timeB) {
      return -1;
    }

    // Apenas 'b' possui horário: 'b' precede 'a'
    if (!timeA && timeB) {
      return 1;
    }

    // Nenhum possui horário: ordenação alfabética por título como critério secundário
    return a.title.localeCompare(b.title);
  });
}

/**
 * Calcula o progresso diário consolidado (concluídas vs total).
 */
export function calculateDailyProgress(
  items: RoutineItem[],
  completedItemIds: Set<string>
): {
  completedCount: number;
  totalCount: number;
  progressRatio: number;
  isAllCompleted: boolean;
} {
  const totalCount = items.length;
  if (totalCount === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      progressRatio: 0,
      isAllCompleted: false,
    };
  }

  let completedCount = 0;
  for (const item of items) {
    if (completedItemIds.has(item.id)) {
      completedCount++;
    }
  }

  const progressRatio = completedCount / totalCount;
  const isAllCompleted = completedCount === totalCount;

  return {
    completedCount,
    totalCount,
    progressRatio,
    isAllCompleted,
  };
}
