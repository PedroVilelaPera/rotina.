import type {
  DayOfWeek,
  LocalDateString,
  LocalTimeString,
  RoutineItem,
} from "../types/routine";
import { isValidTimeString } from "./routine-validation";

/**
 * Retorna a data local atual no formato estrito YYYY-MM-DD [Padroes.NF001].
 * Utiliza as coordenadas locais do relógio do dispositivo para evitar discrepâncias UTC.
 */
export function getTodayLocalDateString(
  referenceDate: Date = new Date(),
): LocalDateString {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as LocalDateString;
}

export function getYesterdayLocalDateString(
  referenceDate: Date = new Date(),
): LocalDateString {
  const yesterday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 1,
  );

  return getTodayLocalDateString(yesterday);
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
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(referenceDate);

    // Capitaliza a primeira letra (ex: "sexta-feira..." -> "Sexta-feira...")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    // Fallback defensivo em caso de ausência de Intl no ambiente
    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    return `${days[referenceDate.getDay()]}, ${referenceDate.getDate()} de ${months[referenceDate.getMonth()]}`;
  }
}

/**
 * Retorna a saudação pessoal baseada no horário do dia.
 */
export function getGreeting(
  referenceDate: Date = new Date(),
  userName?: string | null,
): string {
  const hour = referenceDate.getHours();
  let baseGreeting = "Bom dia";

  if (hour >= 12 && hour < 18) {
    baseGreeting = "Boa tarde";
  } else if (hour >= 18 || hour < 5) {
    baseGreeting = "Boa noite";
  }

  const cleanName = userName ? userName.trim() : "";
  if (cleanName) {
    // Primeiro nome do usuário para proximidade acolhedora
    const firstName = cleanName.split(" ")[0];
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
  dayOfWeek: DayOfWeek,
): boolean {
  if (!item.isActive) {
    return false;
  }

  if (item.type === "habit") {
    if (!item.recurrence) {
      return false;
    }
    if (item.recurrence.kind === "daily") {
      return true;
    }
    if (item.recurrence.kind === "weekly") {
      return item.recurrence.daysOfWeek.includes(dayOfWeek);
    }
    return false;
  }

  if (item.type === "task") {
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
  dayOfWeek: DayOfWeek,
): RoutineItem[] {
  const dailyItems = items.filter((item) =>
    isItemScheduledForDay(item, targetDate, dayOfWeek),
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
  completedItemIds: Set<string>,
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

const DAY_ABBREVIATIONS: Record<DayOfWeek, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

/**
 * Ajusta o horário em incrementos ou decrementos de 15 minutos com wrap limpo entre 00:00 e 23:45 [IF04, RF004].
 * Exemplo: 00:00 - 15m => 23:45 | 23:45 + 15m => 00:00.
 */
export function adjustTimeBy15Minutes(
  currentTime: string | null | undefined,
  delta: 15 | -15,
  fallbackTime: LocalTimeString = "08:00",
): LocalTimeString {
  let totalMinutes: number;

  if (!currentTime || !isValidTimeString(currentTime)) {
    const [fH, fM] = fallbackTime.split(":").map(Number);
    totalMinutes = fH * 60 + fM;
  } else {
    const [h, m] = currentTime.split(":").map(Number);
    totalMinutes = h * 60 + m;
  }

  const nextMinutes = (((totalMinutes + delta) % 1440) + 1440) % 1440;
  const nextH = Math.floor(nextMinutes / 60);
  const nextM = nextMinutes % 60;

  return `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}` as LocalTimeString;
}

/**
 * Formata o badge legível de recorrência para a interface de detalhes [IF04].
 */
export function formatRecurrenceBadge(item: RoutineItem): string {
  if (item.type === "task") {
    return "Tarefa do dia";
  }

  if (!item.recurrence) {
    return "Hábito";
  }

  if (item.recurrence.kind === "daily") {
    return "Diário";
  }

  const days = item.recurrence.daysOfWeek;
  if (!days || days.length === 0) {
    return "Hábito semanal";
  }

  if (days.length === 7) {
    return "Diário";
  }

  const sortedDays = [...days].sort((a, b) => a - b);

  // Segunda a Sexta [1, 2, 3, 4, 5]
  if (
    sortedDays.length === 5 &&
    sortedDays[0] === 1 &&
    sortedDays[1] === 2 &&
    sortedDays[2] === 3 &&
    sortedDays[3] === 4 &&
    sortedDays[4] === 5
  ) {
    return "Seg a Sex";
  }

  // Fim de semana [0, 6]
  if (sortedDays.length === 2 && sortedDays[0] === 0 && sortedDays[1] === 6) {
    return "Fim de semana";
  }

  return sortedDays.map((d) => DAY_ABBREVIATIONS[d]).join(", ");
}
