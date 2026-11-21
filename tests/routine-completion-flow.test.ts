import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  FirestoreRoutineRepository,
  InMemoryFirestoreAdapter,
  getUserCompletionDocPath,
} from '../src/repositories/routine-repository';
import type {
  LocalDateString,
  LocalTimeString,
  RoutineItem,
  RoutineItemCompletionSummary,
} from '../src/types/routine';
import { calculateDailyProgress } from '../src/utils/routine-daily';

/**
 * Adaptador com simulação de Modo Avião (offline queue e sincronização ao reconectar)
 * para validação de [Confiabilidade.NF001] e [Confiabilidade.NF002].
 */
class OfflineSimulationFirestoreAdapter extends InMemoryFirestoreAdapter {
  private isAirplaneMode = false;
  private pendingOfflineSyncQueue: {
    type: 'set' | 'delete';
    path: string;
    data?: Record<string, unknown>;
  }[] = [];

  setAirplaneMode(enabled: boolean): void {
    this.isAirplaneMode = enabled;
  }

  getIsAirplaneMode(): boolean {
    return this.isAirplaneMode;
  }

  getPendingQueueLength(): number {
    return this.pendingOfflineSyncQueue.length;
  }

  override async setDoc(path: string, data: Record<string, unknown>): Promise<void> {
    if (this.isAirplaneMode) {
      this.pendingOfflineSyncQueue.push({ type: 'set', path, data });
    }
    // No Firestore com offline persistence, a escrita é gravada imediatamente no cache local
    await super.setDoc(path, data);
  }

  override async deleteDoc(path: string): Promise<void> {
    if (this.isAirplaneMode) {
      this.pendingOfflineSyncQueue.push({ type: 'delete', path });
    }
    // No Firestore com offline persistence, a remoção é aplicada imediatamente no cache local
    await super.deleteDoc(path);
  }

  /**
   * Simula a reconexão à internet (desativa modo avião e descarrega a fila de sincronização)
   */
  async reconnectAndSync(): Promise<{ syncedOperations: number }> {
    this.isAirplaneMode = false;
    const count = this.pendingOfflineSyncQueue.length;

    // Descarrega mutações pendentes no servidor garantindo idempotência estrita
    for (const op of this.pendingOfflineSyncQueue) {
      if (op.type === 'set' && op.data) {
        await super.setDoc(op.path, op.data);
      } else if (op.type === 'delete') {
        await super.deleteDoc(op.path);
      }
    }

    this.pendingOfflineSyncQueue = [];
    return { syncedOperations: count };
  }
}

describe('Issue #14 — Fluxo de Conclusão e Desfazimento no Dia [RF005, NF001, NF002]', () => {
  let adapter: OfflineSimulationFirestoreAdapter;
  let repository: FirestoreRoutineRepository;
  const userId = 'user-issue-14';
  const todayDate = '2026-11-20' as LocalDateString;

  const mockHabit: RoutineItem = {
    id: 'habit-meditar-1',
    type: 'habit',
    title: 'Meditação Matinal',
    category: 'Saúde',
    note: 'Focar na respiração',
    scheduledTime: '07:30' as LocalTimeString,
    durationMinutes: 15,
    recurrence: { kind: 'daily', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    targetDate: null,
    isActive: true,
    createdAt: { seconds: 1732147200, nanoseconds: 0 },
    updatedAt: { seconds: 1732147200, nanoseconds: 0 },
  };

  const mockTask: RoutineItem = {
    id: 'task-revisao-1',
    type: 'task',
    title: 'Revisar PR #14',
    category: 'Trabalho',
    note: null,
    scheduledTime: '14:00' as LocalTimeString,
    durationMinutes: 30,
    recurrence: null,
    targetDate: todayDate,
    isActive: true,
    createdAt: { seconds: 1732147200, nanoseconds: 0 },
    updatedAt: { seconds: 1732147200, nanoseconds: 0 },
  };

  beforeEach(() => {
    adapter = new OfflineSimulationFirestoreAdapter();
    repository = new FirestoreRoutineRepository(adapter);
  });

  describe('Critério de Aceite 1 & 2: Gravação ao Concluir e Snapshot de Horário', () => {
    it('ao concluir: grava completions/{itemId}_{YYYY-MM-DD} com completedAt = now() e snapshot de scheduledTime', async () => {
      const summary: RoutineItemCompletionSummary = {
        id: mockHabit.id,
        type: mockHabit.type,
        scheduledTime: mockHabit.scheduledTime,
      };

      const result = await repository.toggleCompletion(userId, summary, todayDate);

      // Validação do resultado retornado
      assert.equal(result.action, 'completed');
      assert.equal(result.id, `${mockHabit.id}_${todayDate}`);
      assert.ok(result.record, 'Registro de conclusão deve estar presente');
      assert.equal(result.record?.itemId, mockHabit.id);
      assert.equal(result.record?.itemType, 'habit');
      assert.equal(result.record?.date, todayDate);
      assert.equal(result.record?.scheduledTime, '07:30');
      assert.ok(result.record?.completedAt, 'completedAt deve ser preenchido automaticamente com now()');

      // Validação física da chave no Firestore
      const docPath = getUserCompletionDocPath(userId, mockHabit.id, todayDate);
      assert.equal(docPath, `users/${userId}/completions/${mockHabit.id}_${todayDate}`);

      const savedSnapshot = await adapter.getDoc(docPath);
      assert.equal(savedSnapshot.exists(), true);
      const data = savedSnapshot.data() as Record<string, unknown>;
      assert.equal(data.itemId, mockHabit.id);
      assert.equal(data.itemType, 'habit');
      assert.equal(data.date, todayDate);
      assert.equal(data.scheduledTime, '07:30');
      assert.ok(data.completedAt);
    });

    it('ao concluir tarefa sem horário agendado: preserva scheduledTime como null no snapshot', async () => {
      const summary: RoutineItemCompletionSummary = {
        id: 'task-sem-hora',
        type: 'task',
        scheduledTime: null,
      };

      const result = await repository.toggleCompletion(userId, summary, todayDate);

      assert.equal(result.action, 'completed');
      assert.equal(result.record?.scheduledTime, null);

      const saved = await repository.getCompletion(userId, 'task-sem-hora', todayDate);
      assert.ok(saved);
      assert.equal(saved.scheduledTime, null);
    });
  });

  describe('Critério de Aceite 3: Desfazer no Mesmo Dia', () => {
    it('ao desfazer no mesmo dia: remove o documento determinístico {itemId}_{YYYY-MM-DD}', async () => {
      const summary: RoutineItemCompletionSummary = {
        id: mockTask.id,
        type: mockTask.type,
        scheduledTime: mockTask.scheduledTime,
      };

      // 1. Marca como concluído
      const firstAction = await repository.toggleCompletion(userId, summary, todayDate);
      assert.equal(firstAction.action, 'completed');

      let saved = await repository.getCompletion(userId, mockTask.id, todayDate);
      assert.ok(saved);

      // 2. Desfaz no mesmo dia
      const secondAction = await repository.toggleCompletion(userId, summary, todayDate);
      assert.equal(secondAction.action, 'uncompleted');
      assert.equal(secondAction.id, `${mockTask.id}_${todayDate}`);
      assert.equal(secondAction.record, undefined);

      // 3. Documento removido do Firestore
      saved = await repository.getCompletion(userId, mockTask.id, todayDate);
      assert.equal(saved, null);

      const listToday = await repository.listCompletionsForDate(userId, todayDate);
      assert.equal(listToday.length, 0);
    });
  });

  describe('Critério de Aceite 4 & DoD: Modo Avião (Offline) e Sincronização Sem Duplicação', () => {
    it('funciona offline (modo avião), sincroniza automaticamente ao reconectar e impede duplicação [NF001, NF002]', async () => {
      const summary1: RoutineItemCompletionSummary = {
        id: mockHabit.id,
        type: mockHabit.type,
        scheduledTime: mockHabit.scheduledTime,
      };
      const summary2: RoutineItemCompletionSummary = {
        id: mockTask.id,
        type: mockTask.type,
        scheduledTime: mockTask.scheduledTime,
      };

      // Ativar Modo Avião
      adapter.setAirplaneMode(true);
      assert.equal(adapter.getIsAirplaneMode(), true);

      // 1. Conclui dois itens enquanto offline (em modo avião)
      const res1 = await repository.toggleCompletion(userId, summary1, todayDate);
      const res2 = await repository.toggleCompletion(userId, summary2, todayDate);

      assert.equal(res1.action, 'completed');
      assert.equal(res2.action, 'completed');
      assert.equal(adapter.getPendingQueueLength(), 2);

      // No cache local, os dois registros já devem estar disponíveis imediatamente
      const offlineCompletions = await repository.listCompletionsForDate(userId, todayDate);
      assert.equal(offlineCompletions.length, 2);

      // 2. Simular múltiplos toques acidentais ou re-execuções offline no mesmo item
      const duplicateDocPath = getUserCompletionDocPath(userId, mockHabit.id, todayDate);
      await adapter.setDoc(duplicateDocPath, {
        itemId: mockHabit.id,
        itemType: mockHabit.type,
        date: todayDate,
        scheduledTime: mockHabit.scheduledTime,
        completedAt: adapter.now(),
      });

      // A coleção NÃO pode duplicar registros devido ao ID determinístico
      const deduplicatedCheck = await repository.listCompletionsForDate(userId, todayDate);
      assert.equal(deduplicatedCheck.length, 2);

      // 3. Reconectar (desativar modo avião) e descarregar fila de sincronização
      const syncResult = await adapter.reconnectAndSync();
      assert.equal(adapter.getIsAirplaneMode(), false);
      assert.equal(adapter.getPendingQueueLength(), 0);
      assert.ok(syncResult.syncedOperations >= 2);

      // 4. Verificar se a base remota sincronizada mantém estritamente 1 registro por item
      const finalCompletions = await repository.listCompletionsForDate(userId, todayDate);
      assert.equal(finalCompletions.length, 2);
      const ids = finalCompletions.map((c) => c.itemId).sort();
      assert.deepEqual(ids, [mockHabit.id, mockTask.id].sort());
    });

    it('ao concluir e desfazer enquanto offline, a reconciliação após reconectar deixa o item pendente', async () => {
      const summary: RoutineItemCompletionSummary = {
        id: mockHabit.id,
        type: mockHabit.type,
        scheduledTime: mockHabit.scheduledTime,
      };

      adapter.setAirplaneMode(true);

      // Conclui e logo desfaz enquanto offline
      await repository.toggleCompletion(userId, summary, todayDate);
      await repository.toggleCompletion(userId, summary, todayDate);

      // Cache offline registra a remoção
      const cacheState = await repository.getCompletion(userId, mockHabit.id, todayDate);
      assert.equal(cacheState, null);

      // Reconectar
      await adapter.reconnectAndSync();

      // Backend deve permanecer sem o registro
      const onlineState = await repository.getCompletion(userId, mockHabit.id, todayDate);
      assert.equal(onlineState, null);
    });
  });

  describe('Critério de Aceite 5 & Desempenho: Atualização Otimista e Recálculo em < 200 ms [NF001]', () => {
    it('atualização visual otimista e recálculo dinâmico da barra de progresso executam em < 200 ms', () => {
      const dailyItems: RoutineItem[] = [mockHabit, mockTask];
      const completedSet = new Set<string>();

      const start = performance.now();

      // 1. Simula a atualização otimista síncrona
      completedSet.add(mockHabit.id);

      // 2. Recálculo da barra de progresso diária
      const progress = calculateDailyProgress(dailyItems, completedSet);

      const elapsedMs = performance.now() - start;

      // Validação estrita do critério < 200 ms [Desempenho.NF001]
      assert.ok(
        elapsedMs < 200,
        `Tempo de recálculo otimista (${elapsedMs.toFixed(2)} ms) deve ser inferior a 200 ms`
      );

      // Validação dos dados do progresso
      assert.equal(progress.completedCount, 1);
      assert.equal(progress.totalCount, 2);
      assert.equal(progress.progressRatio, 0.5);
      assert.equal(progress.isAllCompleted, false);

      // Conclusão total
      completedSet.add(mockTask.id);
      const completedProgress = calculateDailyProgress(dailyItems, completedSet);
      assert.equal(completedProgress.completedCount, 2);
      assert.equal(completedProgress.progressRatio, 1);
      assert.equal(completedProgress.isAllCompleted, true);
    });
  });
});
