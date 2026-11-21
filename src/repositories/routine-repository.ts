import type {
  CompletionRecord,
  CreateRoutineItemInput,
  FirestoreTimestampLike,
  IRoutineRepository,
  ItemType,
  LocalDateString,
  ListRoutineItemsOptions,
  LocalTimeString,
  RoutineItem,
  RoutineItemCompletionSummary,
  RoutineRecurrence,
  ToggleCompletionResult,
  UpdateRoutineItemInput,
} from '../types/routine';
import {
  buildCompletionId,
  isValidDateString,
  validateCreateRoutineItemInput,
  validateUpdateRoutineItemInput,
} from '../utils/routine-validation';

/**
 * Interface de leitura de documento do Firestore.
 */
export interface FirestoreDocumentSnapshotLike<T = Record<string, unknown>> {
  id: string;
  exists(): boolean;
  data(): T | undefined;
}

/**
 * Interface de leitura de coleção do Firestore.
 */
export interface FirestoreQuerySnapshotLike<T = Record<string, unknown>> {
  docs: FirestoreDocumentSnapshotLike<T>[];
  empty: boolean;
  size: number;
}

/**
 * Filtro de consulta para listagens no Firestore.
 */
export interface FirestoreWhereFilter {
  field: string;
  op: '==' | '<=' | '>=' | 'in';
  value: unknown;
}

/**
 * Contrato do adaptador de persistência para o Cloud Firestore.
 * Permite desacoplamento estrito do SDK, suportando tanto o Firebase JS SDK
 * em produção quanto implementações determinísticas em memória nos testes unitários.
 */
export interface FirestoreAdapter {
  getDoc(path: string): Promise<FirestoreDocumentSnapshotLike>;
  setDoc(path: string, data: Record<string, unknown>): Promise<void>;
  updateDoc(path: string, data: Record<string, unknown>): Promise<void>;
  deleteDoc(path: string): Promise<void>;
  getDocs(
    collectionPath: string,
    filters?: FirestoreWhereFilter[]
  ): Promise<FirestoreQuerySnapshotLike>;
  generateId(collectionPath: string): string;
  now(): FirestoreTimestampLike;
}

/**
 * Retorna o caminho da coleção de itens de um usuário: `users/{userId}/items`.
 */
export function getUserItemsCollectionPath(userId: string): string {
  const cleanUserId = userId ? userId.trim() : '';
  if (!cleanUserId) {
    throw new Error('Identificador de usuário (userId) é obrigatório.');
  }
  return `users/${cleanUserId}/items`;
}

/**
 * Retorna o caminho do documento de item: `users/{userId}/items/{itemId}`.
 */
export function getUserItemDocPath(userId: string, itemId: string): string {
  const cleanItemId = itemId ? itemId.trim() : '';
  if (!cleanItemId) {
    throw new Error('Identificador de item (itemId) é obrigatório.');
  }
  return `${getUserItemsCollectionPath(userId)}/${cleanItemId}`;
}

/**
 * Retorna o caminho da coleção de conclusões: `users/{userId}/completions`.
 */
export function getUserCompletionsCollectionPath(userId: string): string {
  const cleanUserId = userId ? userId.trim() : '';
  if (!cleanUserId) {
    throw new Error('Identificador de usuário (userId) é obrigatório.');
  }
  return `users/${cleanUserId}/completions`;
}

/**
 * Retorna o caminho do documento determinístico de conclusão [Confiabilidade.NF002]:
 * `users/{userId}/completions/{itemId}_{YYYY-MM-DD}`.
 */
export function getUserCompletionDocPath(
  userId: string,
  itemId: string,
  date: string
): string {
  const completionId = buildCompletionId(itemId, date);
  return `${getUserCompletionsCollectionPath(userId)}/${completionId}`;
}

/**
 * Assegura que um timestamp do Firestore possua seconds, nanoseconds e os métodos toDate/toMillis.
 */
export function ensureFirestoreTimestamp(raw: unknown): FirestoreTimestampLike {
  if (raw && typeof raw === 'object') {
    const candidate = raw as Record<string, unknown>;
    const seconds = Number(candidate.seconds ?? 0);
    const nanoseconds = Number(candidate.nanoseconds ?? 0);

    const toDate =
      typeof candidate.toDate === 'function'
        ? (candidate.toDate as () => Date)
        : () => new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));

    const toMillis =
      typeof candidate.toMillis === 'function'
        ? (candidate.toMillis as () => number)
        : () => seconds * 1000 + Math.floor(nanoseconds / 1_000_000);

    return {
      seconds,
      nanoseconds,
      toDate,
      toMillis,
    };
  }

  const now = new Date();
  return {
    seconds: Math.floor(now.getTime() / 1000),
    nanoseconds: (now.getTime() % 1000) * 1_000_000,
    toDate: () => now,
    toMillis: () => now.getTime(),
  };
}

/**
 * Converte um documento bruto do Firestore na entidade RoutineItem.
 */
function toRoutineItem(id: string, data: Record<string, unknown>): RoutineItem {
  return {
    id,
    type: data.type as ItemType,
    title: String(data.title ?? ''),
    category: data.category !== undefined && data.category !== null ? String(data.category) : null,
    note: data.note !== undefined && data.note !== null ? String(data.note) : null,
    scheduledTime: (data.scheduledTime as LocalTimeString | null) ?? null,
    durationMinutes: Number(data.durationMinutes ?? 30) as RoutineItem['durationMinutes'],
    recurrence: (data.recurrence as RoutineRecurrence | null) ?? null,
    targetDate: (data.targetDate as LocalDateString | null) ?? null,
    isActive: Boolean(data.isActive ?? true),
    createdAt: ensureFirestoreTimestamp(data.createdAt),
    updatedAt: ensureFirestoreTimestamp(data.updatedAt),
  };
}

/**
 * Converte um documento bruto do Firestore na entidade CompletionRecord.
 */
function toCompletionRecord(
  id: string,
  data: Record<string, unknown>
): CompletionRecord {
  return {
    id,
    itemId: String(data.itemId ?? ''),
    itemType: data.itemType as ItemType,
    date: String(data.date ?? '') as LocalDateString,
    scheduledTime: (data.scheduledTime as LocalTimeString | null) ?? null,
    completedAt: ensureFirestoreTimestamp(data.completedAt),
  };
}

/**
 * Repositório Firestore para manipulação de Itens de Rotina e Conclusões Idempotentes.
 */
export class FirestoreRoutineRepository implements IRoutineRepository {
  private readonly adapter: FirestoreAdapter;

  constructor(adapter: FirestoreAdapter) {
    this.adapter = adapter;
  }

  /**
   * Cria um item (hábito ou tarefa) sob `users/{userId}/items/{itemId}`.
   */
  async createItem(
    userId: string,
    input: CreateRoutineItemInput
  ): Promise<RoutineItem> {
    validateCreateRoutineItemInput(input);

    const collectionPath = getUserItemsCollectionPath(userId);
    const itemId = this.adapter.generateId(collectionPath);
    const now = this.adapter.now();

    const cleanTitle = input.title.trim();
    const cleanCategory = input.category ? input.category.trim() : null;
    const cleanNote = input.note ? input.note.trim() : null;
    const durationMinutes = input.durationMinutes ?? 30;

    let recurrence: RoutineRecurrence | null = null;
    let scheduledTime: LocalTimeString | null = null;
    let targetDate: LocalDateString | null = null;

    if (input.type === 'habit') {
      scheduledTime = input.scheduledTime;
      recurrence = {
        kind: input.recurrence.kind,
        daysOfWeek:
          input.recurrence.kind === 'daily'
            ? [0, 1, 2, 3, 4, 5, 6]
            : [...input.recurrence.daysOfWeek].sort((a, b) => a - b),
      };
      targetDate = null;
    } else {
      scheduledTime = input.scheduledTime ?? null;
      recurrence = null;
      targetDate = input.targetDate;
    }

    const item: RoutineItem = {
      id: itemId,
      type: input.type,
      title: cleanTitle,
      category: cleanCategory,
      note: cleanNote,
      scheduledTime,
      durationMinutes,
      recurrence,
      targetDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docPath = getUserItemDocPath(userId, itemId);
    await this.adapter.setDoc(docPath, {
      type: item.type,
      title: item.title,
      category: item.category,
      note: item.note,
      scheduledTime: item.scheduledTime,
      durationMinutes: item.durationMinutes,
      recurrence: item.recurrence,
      targetDate: item.targetDate,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });

    return item;
  }

  /**
   * Busca um item pelo seu ID em `users/{userId}/items/{itemId}`.
   */
  async getItem(userId: string, itemId: string): Promise<RoutineItem | null> {
    const docPath = getUserItemDocPath(userId, itemId);
    const snapshot = await this.adapter.getDoc(docPath);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (!data) {
      return null;
    }

    return toRoutineItem(snapshot.id, data);
  }

  /**
   * Atualiza atributos de um item em `users/{userId}/items/{itemId}`.
   */
  async updateItem(
    userId: string,
    itemId: string,
    input: UpdateRoutineItemInput
  ): Promise<RoutineItem> {
    validateUpdateRoutineItemInput(input);

    const existing = await this.getItem(userId, itemId);
    if (!existing) {
      throw new Error(`Item "${itemId}" não encontrado para atualização.`);
    }

    const now = this.adapter.now();
    const patch: Record<string, unknown> = {
      updatedAt: now,
    };

    if (input.title !== undefined) {
      patch.title = input.title.trim();
    }
    if (input.category !== undefined) {
      patch.category = input.category ? input.category.trim() : null;
    }
    if (input.note !== undefined) {
      patch.note = input.note ? input.note.trim() : null;
    }
    if (input.scheduledTime !== undefined) {
      patch.scheduledTime = input.scheduledTime;
    }
    if (input.durationMinutes !== undefined) {
      patch.durationMinutes = input.durationMinutes;
    }
    if (input.recurrence !== undefined) {
      patch.recurrence = input.recurrence;
    }
    if (input.targetDate !== undefined) {
      patch.targetDate = input.targetDate;
    }
    if (input.isActive !== undefined) {
      patch.isActive = input.isActive;
    }

    const docPath = getUserItemDocPath(userId, itemId);
    await this.adapter.updateDoc(docPath, patch);

    return {
      ...existing,
      ...(patch as unknown as Partial<RoutineItem>),
      updatedAt: now,
    };
  }

  /**
   * Exclusão lógica (arquivamento) sob `users/{userId}/items/{itemId}` [RF006].
   * Preserva intactos os registros de conclusões passadas.
   */
  async archiveItem(userId: string, itemId: string): Promise<RoutineItem> {
    return this.updateItem(userId, itemId, { isActive: false });
  }

  /**
   * Exclusão física definitiva de um item.
   */
  async deleteItem(userId: string, itemId: string): Promise<void> {
    const docPath = getUserItemDocPath(userId, itemId);
    await this.adapter.deleteDoc(docPath);
  }

  /**
   * Lista itens de rotina sob `users/{userId}/items`.
   */
  async listItems(
    userId: string,
    options?: ListRoutineItemsOptions
  ): Promise<RoutineItem[]> {
    const onlyActive = options?.onlyActive ?? true;
    const collectionPath = getUserItemsCollectionPath(userId);

    const filters: FirestoreWhereFilter[] = [];
    if (onlyActive) {
      filters.push({ field: 'isActive', op: '==', value: true });
    }

    const snapshot = await this.adapter.getDocs(collectionPath, filters);
    return snapshot.docs.map((doc) => toRoutineItem(doc.id, doc.data() ?? {}));
  }

  /**
   * Alterna a conclusão de um item de forma estritamente determinística e idempotente [Confiabilidade.NF002].
   * ID determinístico: `{itemId}_{YYYY-MM-DD}`.
   */
  async toggleCompletion(
    userId: string,
    item: RoutineItemCompletionSummary,
    date: LocalDateString
  ): Promise<ToggleCompletionResult> {
    if (!isValidDateString(date)) {
      throw new Error(
        `Data de conclusão inválida ("${date}"). O formato estrito deve ser YYYY-MM-DD.`
      );
    }

    if (!item || !item.id) {
      throw new Error('Resumo do item com ID válido é obrigatório.');
    }

    const completionId = buildCompletionId(item.id, date);
    const docPath = getUserCompletionDocPath(userId, item.id, date);
    const existing = await this.adapter.getDoc(docPath);

    if (existing.exists()) {
      // Já concluído: desfazer a conclusão
      await this.adapter.deleteDoc(docPath);
      return {
        action: 'uncompleted',
        id: completionId,
      };
    }

    // Não concluído: registrar conclusão
    const completedAt = this.adapter.now();
    const record: CompletionRecord = {
      id: completionId,
      itemId: item.id,
      itemType: item.type,
      date,
      scheduledTime: item.scheduledTime ?? null,
      completedAt,
    };

    await this.adapter.setDoc(docPath, {
      itemId: record.itemId,
      itemType: record.itemType,
      date: record.date,
      scheduledTime: record.scheduledTime,
      completedAt: record.completedAt,
    });

    return {
      action: 'completed',
      id: completionId,
      record,
    };
  }

  /**
   * Busca um registro determinístico de conclusão pelo itemId e data civil.
   */
  async getCompletion(
    userId: string,
    itemId: string,
    date: LocalDateString
  ): Promise<CompletionRecord | null> {
    const docPath = getUserCompletionDocPath(userId, itemId, date);
    const snapshot = await this.adapter.getDoc(docPath);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (!data) {
      return null;
    }

    return toCompletionRecord(snapshot.id, data);
  }

  /**
   * Lista todas as conclusões de uma data sob `users/{userId}/completions`.
   */
  async listCompletionsForDate(
    userId: string,
    date: LocalDateString
  ): Promise<CompletionRecord[]> {
    if (!isValidDateString(date)) {
      throw new Error(
        `Data inválida ("${date}"). O formato estrito deve ser YYYY-MM-DD.`
      );
    }

    const collectionPath = getUserCompletionsCollectionPath(userId);
    const snapshot = await this.adapter.getDocs(collectionPath, [
      { field: 'date', op: '==', value: date },
    ]);

    return snapshot.docs.map((doc) =>
      toCompletionRecord(doc.id, doc.data() ?? {})
    );
  }

  /**
   * Lista todas as conclusões de um item específico (para cálculo de conquistas e sequências).
   */
  async listCompletionsForItem(
    userId: string,
    itemId: string
  ): Promise<CompletionRecord[]> {
    const cleanItemId = itemId ? itemId.trim() : '';
    if (!cleanItemId) {
      throw new Error('Identificador de item (itemId) é obrigatório.');
    }

    const collectionPath = getUserCompletionsCollectionPath(userId);
    const snapshot = await this.adapter.getDocs(collectionPath, [
      { field: 'itemId', op: '==', value: cleanItemId },
    ]);

    return snapshot.docs.map((doc) =>
      toCompletionRecord(doc.id, doc.data() ?? {})
    );
  }
}

/**
 * Cria uma instância de FirestoreRoutineRepository associada a um adaptador Firestore.
 */
export function createRoutineRepository(
  adapter: FirestoreAdapter
): IRoutineRepository {
  return new FirestoreRoutineRepository(adapter);
}

/**
 * Implementação in-memory fiel do FirestoreAdapter para uso em testes unitários rápidos e isolados.
 */
export class InMemoryFirestoreAdapter implements FirestoreAdapter {
  private readonly store = new Map<string, Record<string, unknown>>();
  private idCounter = 1;

  async getDoc(path: string): Promise<FirestoreDocumentSnapshotLike> {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    const data = this.store.get(normalized);
    const lastSlash = normalized.lastIndexOf('/');
    const docId = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);

    return {
      id: docId,
      exists: () => data !== undefined,
      data: () => (data ? { ...data } : undefined),
    };
  }

  async setDoc(path: string, data: Record<string, unknown>): Promise<void> {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    this.store.set(normalized, JSON.parse(JSON.stringify(data)) as Record<string, unknown>);
  }

  async updateDoc(
    path: string,
    patch: Record<string, unknown>
  ): Promise<void> {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    const current = this.store.get(normalized);
    if (!current) {
      throw new Error(`Documento não encontrado para atualização em ${path}`);
    }
    const updated = {
      ...current,
      ...(JSON.parse(JSON.stringify(patch)) as Record<string, unknown>),
    };
    this.store.set(normalized, updated);
  }

  async deleteDoc(path: string): Promise<void> {
    const normalized = path.replace(/^\/+|\/+$/g, '');
    this.store.delete(normalized);
  }

  async getDocs(
    collectionPath: string,
    filters?: FirestoreWhereFilter[]
  ): Promise<FirestoreQuerySnapshotLike> {
    const normalizedCollection = collectionPath.replace(/^\/+|\/+$/g, '');
    const prefix = `${normalizedCollection}/`;

    const docs: FirestoreDocumentSnapshotLike[] = [];

    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        const remaining = key.slice(prefix.length);
        // Garante que é documento direto da coleção (sem subcoleções aninhadas no id)
        if (!remaining.includes('/')) {
          let matches = true;

          if (filters && filters.length > 0) {
            for (const filter of filters) {
              const fieldValue = value[filter.field];
              if (filter.op === '==') {
                if (fieldValue !== filter.value) {
                  matches = false;
                  break;
                }
              } else if (filter.op === 'in') {
                const arr = filter.value as unknown[];
                if (!Array.isArray(arr) || !arr.includes(fieldValue)) {
                  matches = false;
                  break;
                }
              }
            }
          }

          if (matches) {
            docs.push({
              id: remaining,
              exists: () => true,
              data: () => ({ ...value }),
            });
          }
        }
      }
    }

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }

  generateId(collectionPath: string): string {
    const cleanCollection = collectionPath.replace(/^\/+|\/+$/g, '');
    const lastSlash = cleanCollection.lastIndexOf('/');
    const collectionName =
      lastSlash === -1 ? cleanCollection : cleanCollection.slice(lastSlash + 1);
    const suffix = `${this.idCounter++}`.padStart(4, '0');
    return `${collectionName}_${Date.now()}_${suffix}`;
  }

  now(): FirestoreTimestampLike {
    const date = new Date();
    const seconds = Math.floor(date.getTime() / 1000);
    const nanoseconds = (date.getTime() % 1000) * 1_000_000;
    return {
      seconds,
      nanoseconds,
      toDate: () => date,
      toMillis: () => date.getTime(),
    };
  }

  /**
   * Retorna o snapshot atual do armazenamento em memória.
   */
  dump(): Map<string, Record<string, unknown>> {
    return new Map(this.store);
  }

  /**
   * Limpa todos os dados armazenados em memória.
   */
  clear(): void {
    this.store.clear();
    this.idCounter = 1;
  }
}
