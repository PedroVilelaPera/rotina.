import type {
  CreateRoutineItemInput,
  DayOfWeek,
  DurationMinutes,
  LocalDateString,
  LocalTimeString,
  UpdateRoutineItemInput,
} from '../types/routine';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const ALLOWED_DURATIONS: readonly DurationMinutes[] = [15, 30, 45, 60];

/**
 * Verifica se um ano é bissexto.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Valida se uma string representa uma data civil válida no formato estrito YYYY-MM-DD [Padroes.NF001].
 */
export function isValidDateString(value: unknown): value is LocalDateString {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day <= (daysInMonth[month - 1] ?? 0);
}

/**
 * Valida se uma string representa um horário 24h válido no formato estrito HH:mm [Padroes.NF001].
 */
export function isValidTimeString(value: unknown): value is LocalTimeString {
  return typeof value === 'string' && TIME_REGEX.test(value);
}

/**
 * Gera o identificador determinístico da conclusão: `{itemId}_{YYYY-MM-DD}` [Confiabilidade.NF002].
 */
export function buildCompletionId(itemId: string, date: string): string {
  const cleanId = itemId ? itemId.trim() : '';
  if (!cleanId) {
    throw new Error('Identificador do item (itemId) não pode ser vazio.');
  }

  if (!isValidDateString(date)) {
    throw new Error(
      `Data de conclusão inválida ("${date}"). O formato obrigatório é YYYY-MM-DD.`
    );
  }

  return `${cleanId}_${date}`;
}

/**
 * Decompõe um ID determinístico em itemId e data civil correspondente.
 */
export function parseCompletionId(completionId: string): {
  itemId: string;
  date: LocalDateString;
} {
  if (typeof completionId !== 'string') {
    throw new Error('Identificador de conclusão deve ser uma string.');
  }

  const lastUnderscoreIndex = completionId.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    throw new Error(
      `ID determinístico de conclusão mal formatado: "${completionId}". Esperado "{itemId}_{YYYY-MM-DD}".`
    );
  }

  const itemId = completionId.slice(0, lastUnderscoreIndex).trim();
  const dateCandidate = completionId.slice(lastUnderscoreIndex + 1);

  if (!itemId) {
    throw new Error(
      `ID determinístico com itemId ausente: "${completionId}".`
    );
  }

  if (!isValidDateString(dateCandidate)) {
    throw new Error(
      `ID determinístico com data inválida: "${completionId}". Esperado sufixo YYYY-MM-DD.`
    );
  }

  return { itemId, date: dateCandidate };
}

/**
 * Valida se um número corresponde a um dia da semana válido (0 a 6).
 */
export function isValidDayOfWeek(value: unknown): value is DayOfWeek {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 6
  );
}

/**
 * Valida os dados de entrada na criação de um item de rotina.
 */
export function validateCreateRoutineItemInput(input: CreateRoutineItemInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('Dados de entrada para criação do item são obrigatórios.');
  }

  if (input.type !== 'habit' && input.type !== 'task') {
    throw new Error('Tipo de item inválido. Deve ser "habit" ou "task".');
  }

  const trimmedTitle = input.title ? input.title.trim() : '';
  if (!trimmedTitle || trimmedTitle.length < 1 || trimmedTitle.length > 80) {
    throw new Error('O título do item é obrigatório e deve ter entre 1 e 80 caracteres.');
  }

  if (input.note !== undefined && input.note !== null) {
    if (typeof input.note !== 'string' || input.note.length > 280) {
      throw new Error('A nota pessoal não pode exceder 280 caracteres.');
    }
  }

  if (input.durationMinutes !== undefined) {
    if (!ALLOWED_DURATIONS.includes(input.durationMinutes)) {
      throw new Error(
        `Duração inválida (${input.durationMinutes}). Valores suportados: 15, 30, 45 ou 60 minutos.`
      );
    }
  }

  if (input.type === 'habit') {
    if (!isValidTimeString(input.scheduledTime)) {
      throw new Error(
        'Horário agendado (scheduledTime) é obrigatório para hábitos no formato HH:mm.'
      );
    }

    if (!input.recurrence || typeof input.recurrence !== 'object') {
      throw new Error('Configuração de recorrência é obrigatória para hábitos.');
    }

    if (input.recurrence.kind !== 'daily' && input.recurrence.kind !== 'weekly') {
      throw new Error('Tipo de recorrência inválido. Deve ser "daily" ou "weekly".');
    }

    if (!Array.isArray(input.recurrence.daysOfWeek)) {
      throw new Error('Os dias da semana de recorrência devem ser fornecidos em um array.');
    }

    if (input.recurrence.kind === 'weekly' && input.recurrence.daysOfWeek.length === 0) {
      throw new Error('Hábitos semanais exigem ao menos um dia selecionado em daysOfWeek.');
    }

    for (const day of input.recurrence.daysOfWeek) {
      if (!isValidDayOfWeek(day)) {
        throw new Error(
          `Dia da semana inválido (${day}). Deve ser um número inteiro de 0 (Domingo) a 6 (Sábado).`
        );
      }
    }
  } else {
    // Tipo 'task'
    if (!isValidDateString(input.targetDate)) {
      throw new Error(
        'Data alvo (targetDate) é obrigatória para tarefas no formato YYYY-MM-DD.'
      );
    }

    if (input.scheduledTime !== undefined && input.scheduledTime !== null) {
      if (!isValidTimeString(input.scheduledTime)) {
        throw new Error(
          `Horário de tarefa inválido ("${input.scheduledTime}"). Deve seguir o formato HH:mm.`
        );
      }
    }
  }
}

/**
 * Valida os dados de entrada na atualização de um item de rotina.
 */
export function validateUpdateRoutineItemInput(input: UpdateRoutineItemInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('Dados de atualização são obrigatórios.');
  }

  if (input.title !== undefined) {
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle || trimmedTitle.length < 1 || trimmedTitle.length > 80) {
      throw new Error('O título do item deve ter entre 1 e 80 caracteres.');
    }
  }

  if (input.note !== undefined && input.note !== null) {
    if (typeof input.note !== 'string' || input.note.length > 280) {
      throw new Error('A nota pessoal não pode exceder 280 caracteres.');
    }
  }

  if (input.durationMinutes !== undefined) {
    if (!ALLOWED_DURATIONS.includes(input.durationMinutes)) {
      throw new Error(
        `Duração inválida (${input.durationMinutes}). Valores suportados: 15, 30, 45 ou 60 minutos.`
      );
    }
  }

  if (input.scheduledTime !== undefined && input.scheduledTime !== null) {
    if (!isValidTimeString(input.scheduledTime)) {
      throw new Error(
        `Horário agendado inválido ("${input.scheduledTime}"). Deve seguir o formato HH:mm.`
      );
    }
  }

  if (input.targetDate !== undefined && input.targetDate !== null) {
    if (!isValidDateString(input.targetDate)) {
      throw new Error(
        `Data alvo inválida ("${input.targetDate}"). Deve seguir o formato YYYY-MM-DD.`
      );
    }
  }

  if (input.recurrence !== undefined && input.recurrence !== null) {
    if (input.recurrence.kind !== 'daily' && input.recurrence.kind !== 'weekly') {
      throw new Error('Tipo de recorrência inválido. Deve ser "daily" ou "weekly".');
    }

    if (!Array.isArray(input.recurrence.daysOfWeek)) {
      throw new Error('Os dias da semana de recorrência devem ser uma lista.');
    }

    if (input.recurrence.kind === 'weekly' && input.recurrence.daysOfWeek.length === 0) {
      throw new Error('Hábitos semanais exigem ao menos um dia selecionado em daysOfWeek.');
    }

    for (const day of input.recurrence.daysOfWeek) {
      if (!isValidDayOfWeek(day)) {
        throw new Error(
          `Dia da semana inválido (${day}). Deve ser um número inteiro de 0 a 6.`
        );
      }
    }
  }
}
