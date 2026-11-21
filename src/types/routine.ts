/**
 * Tipos e contratos TypeScript para o domínio de Rotina (Tarefas e Hábitos) e Conclusões.
 *
 * Referências no Documento de Requisitos:
 * - [Confiabilidade.NF001]: Operação offline com sincronização automática.
 * - [Confiabilidade.NF002]: Idempotência no registro de conclusões ({itemId}_{YYYY-MM-DD}).
 * - [Padroes.NF001]: Padrões de documentação e representação temporal (YYYY-MM-DD e HH:mm).
 * - [Gestao da Rotina.RF001] a [Gestao da Rotina.RF006]
 */

/**
 * Representação de data local no formato estrito YYYY-MM-DD (ISO 8601 calendário civil).
 * Evita bugs de fuso horário na virada do dia [Padroes.NF001].
 */
export type LocalDateString = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

/**
 * Representação de horário local em formato 24 horas estrito HH:mm.
 */
export type LocalTimeString = `${number}${number}:${number}${number}`;

/**
 * Dias da semana de acordo com a convenção JavaScript Date.getDay():
 * 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Duração planejada suportada na v1 (em minutos).
 */
export type DurationMinutes = 15 | 30 | 45 | 60;

/**
 * Tipo discriminador da entidade de rotina: hábito recorrente ou tarefa pontual.
 */
export type ItemType = 'habit' | 'task';

/**
 * Tipo de recorrência para hábitos: diária ou em dias selecionados da semana.
 */
export type RecurrenceKind = 'daily' | 'weekly';

/**
 * Regras de recorrência para hábitos.
 * Obrigatório para 'habit'; nulo para 'task'.
 */
export interface RoutineRecurrence {
  kind: RecurrenceKind;
  /**
   * Lista de dias da semana (0 = Dom .. 6 = Sáb).
   * Se kind === 'weekly', deve conter pelo menos 1 dia selecionado.
   */
  daysOfWeek: DayOfWeek[];
}

/**
 * Abstração de carimbo de data/hora compatível com o Firestore Timestamp,
 * permitindo desacoplamento do SDK e consumo direto na Frente 3 (lembretes-conquistas) e UI.
 */
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate?(): Date;
  toMillis?(): number;
}

/**
 * Entidade unificada para Hábitos e Tarefas sob `users/{userId}/items/{itemId}`.
 */
export interface RoutineItem {
  /** Identificador único do item (documentId no Firestore) */
  id: string;
  /** Discriminador: hábito recorrente ou tarefa pontual */
  type: ItemType;
  /** Título obrigatório (1 a 80 caracteres) */
  title: string;
  /** Categoria opcional (ex.: "Saúde", "Trabalho", "Estudos") */
  category: string | null;
  /** Nota pessoal contextual (opcional, até 280 caracteres) */
  note: string | null;
  /**
   * Horário de início planejado no formato HH:mm (24h).
   * Obrigatório para 'habit'; opcional para 'task'.
   */
  scheduledTime: LocalTimeString | null;
  /** Duração planejada em minutos (15, 30, 45 ou 60) */
  durationMinutes: DurationMinutes;
  /** Recorrência do hábito (somente 'habit'; null para 'task') */
  recurrence: RoutineRecurrence | null;
  /** Data alvo no formato YYYY-MM-DD (somente 'task'; null para 'habit') */
  targetDate: LocalDateString | null;
  /** Indicador de exclusão lógica para preservar histórico de conquistas (RF006) */
  isActive: boolean;
  /** Carimbo de data/hora de criação */
  createdAt: FirestoreTimestampLike;
  /** Carimbo de data/hora da última atualização */
  updatedAt: FirestoreTimestampLike;
}

/**
 * Registro determinístico de conclusão sob `users/{userId}/completions/{itemId}_{YYYY-MM-DD}`.
 * O ID determinístico `{itemId}_{YYYY-MM-DD}` garante idempotência estrita [Confiabilidade.NF002].
 */
export interface CompletionRecord {
  /** Identificador determinístico: `{itemId}_{YYYY-MM-DD}` */
  id: string;
  /** ID do item de rotina referenciado */
  itemId: string;
  /** Snapshot do tipo do item ('habit' | 'task') */
  itemType: ItemType;
  /** Data da conclusão no formato YYYY-MM-DD */
  date: LocalDateString;
  /** Snapshot do horário planejado (HH:mm) para cálculo de pontualidade [RF005/v2] */
  scheduledTime: LocalTimeString | null;
  /** Horário real capturado automaticamente no momento da marcação */
  completedAt: FirestoreTimestampLike;
}

/**
 * Parâmetros para criação de um Hábito recorrente.
 */
export interface CreateHabitInput {
  type: 'habit';
  title: string;
  category?: string | null;
  note?: string | null;
  scheduledTime: LocalTimeString;
  durationMinutes?: DurationMinutes;
  recurrence: RoutineRecurrence;
}

/**
 * Parâmetros para criação de uma Tarefa pontual.
 */
export interface CreateTaskInput {
  type: 'task';
  title: string;
  category?: string | null;
  note?: string | null;
  scheduledTime?: LocalTimeString | null;
  durationMinutes?: DurationMinutes;
  targetDate: LocalDateString;
}

/**
 * Entrada para criação unificada de itens de rotina.
 */
export type CreateRoutineItemInput = CreateHabitInput | CreateTaskInput;

/**
 * Entrada para atualização de um item existente.
 */
export interface UpdateRoutineItemInput {
  title?: string;
  category?: string | null;
  note?: string | null;
  scheduledTime?: LocalTimeString | null;
  durationMinutes?: DurationMinutes;
  recurrence?: RoutineRecurrence | null;
  targetDate?: LocalDateString | null;
  isActive?: boolean;
}

/**
 * Dados mínimos necessários de um item para alternar conclusão.
 */
export interface RoutineItemCompletionSummary {
  id: string;
  type: ItemType;
  scheduledTime: LocalTimeString | null;
}

/**
 * Resultado da operação de alternância de conclusão (toggle).
 */
export interface ToggleCompletionResult {
  /** Ação realizada: 'completed' (marcado) ou 'uncompleted' (desfeito) */
  action: 'completed' | 'uncompleted';
  /** ID determinístico do registro de conclusão `{itemId}_{YYYY-MM-DD}` */
  id: string;
  /** Registro gerado (presente quando action === 'completed') */
  record?: CompletionRecord;
}

/**
 * Opções para listagem de itens de rotina.
 */
export interface ListRoutineItemsOptions {
  /** Se true, filtra apenas itens onde isActive === true (padrão: true) */
  onlyActive?: boolean;
}

/**
 * Contrato do repositório para acesso aos dados de rotina e conclusões.
 */
export interface IRoutineRepository {
  /** Cria um novo item de rotina */
  createItem(userId: string, input: CreateRoutineItemInput): Promise<RoutineItem>;
  /** Busca um item pelo seu ID */
  getItem(userId: string, itemId: string): Promise<RoutineItem | null>;
  /** Atualiza atributos de um item de rotina */
  updateItem(userId: string, itemId: string, input: UpdateRoutineItemInput): Promise<RoutineItem>;
  /** Realiza a exclusão lógica do item (isActive = false), preservando histórico de conclusões */
  archiveItem(userId: string, itemId: string): Promise<RoutineItem>;
  /** Exclui fisicamente um item */
  deleteItem(userId: string, itemId: string): Promise<void>;
  /** Lista os itens de rotina do usuário */
  listItems(userId: string, options?: ListRoutineItemsOptions): Promise<RoutineItem[]>;
  /** Alterna conclusão do item na data informada com idempotência determinística */
  toggleCompletion(
    userId: string,
    item: RoutineItemCompletionSummary,
    date: LocalDateString
  ): Promise<ToggleCompletionResult>;
  /** Busca um registro determinístico de conclusão */
  getCompletion(userId: string, itemId: string, date: LocalDateString): Promise<CompletionRecord | null>;
  /** Lista todas as conclusões registradas para uma data específica */
  listCompletionsForDate(userId: string, date: LocalDateString): Promise<CompletionRecord[]>;
  /** Lista todas as conclusões registradas para um item específico */
  listCompletionsForItem(userId: string, itemId: string): Promise<CompletionRecord[]>;
}
