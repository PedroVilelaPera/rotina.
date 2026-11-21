import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  FirestoreRoutineRepository,
  InMemoryFirestoreAdapter,
  createRoutineRepository,
  getUserCompletionDocPath,
  getUserCompletionsCollectionPath,
  getUserItemDocPath,
  getUserItemsCollectionPath,
} from '../src/repositories/routine-repository';
import type {
  CreateHabitInput,
  CreateTaskInput,
  LocalDateString,
  LocalTimeString,
} from '../src/types/routine';
import {
  buildCompletionId,
  isLeapYear,
  isValidDateString,
  isValidDayOfWeek,
  isValidTimeString,
  parseCompletionId,
} from '../src/utils/routine-validation';

describe('Validação Temporal e Utilitários [Padroes.NF001, Confiabilidade.NF002]', () => {
  it('deve identificar corretamente anos bissextos', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(2026), false);
    assert.equal(isLeapYear(1900), false);
  });

  it('deve validar datas no formato estrito YYYY-MM-DD', () => {
    assert.equal(isValidDateString('2026-11-20'), true);
    assert.equal(isValidDateString('2024-02-29'), true); // Bissexto válido
    assert.equal(isValidDateString('2026-02-29'), false); // Não-bissexto inválido
    assert.equal(isValidDateString('2026-04-31'), false); // Abril tem 30 dias
    assert.equal(isValidDateString('2026-13-01'), false); // Mês inválido
    assert.equal(isValidDateString('2026-00-10'), false);
    assert.equal(isValidDateString('20-11-2026'), false); // Formato invertido
    assert.equal(isValidDateString('2026/11/20'), false);
    assert.equal(isValidDateString(''), false);
    assert.equal(isValidDateString(null), false);
  });

  it('deve validar horários 24h no formato estrito HH:mm', () => {
    assert.equal(isValidTimeString('00:00'), true);
    assert.equal(isValidTimeString('08:30'), true);
    assert.equal(isValidTimeString('23:59'), true);
    assert.equal(isValidTimeString('24:00'), false);
    assert.equal(isValidTimeString('12:60'), false);
    assert.equal(isValidTimeString('8:30'), false);
    assert.equal(isValidTimeString('12:5'), false);
    assert.equal(isValidTimeString(''), false);
    assert.equal(isValidTimeString(undefined), false);
  });

  it('deve validar dias da semana inteiros entre 0 e 6', () => {
    assert.equal(isValidDayOfWeek(0), true);
    assert.equal(isValidDayOfWeek(6), true);
    assert.equal(isValidDayOfWeek(-1), false);
    assert.equal(isValidDayOfWeek(7), false);
    assert.equal(isValidDayOfWeek(1.5), false);
    assert.equal(isValidDayOfWeek('1'), false);
  });

  it('deve construir e decompor IDs determinísticos {itemId}_{YYYY-MM-DD}', () => {
    const id = buildCompletionId('item-123', '2026-11-20');
    assert.equal(id, 'item-123_2026-11-20');

    const parsed = parseCompletionId(id);
    assert.equal(parsed.itemId, 'item-123');
    assert.equal(parsed.date, '2026-11-20');
  });

  it('deve lidar corretamente com itemIds que contenham underscores', () => {
    const id = buildCompletionId('user_task_abc', '2026-11-20');
    assert.equal(id, 'user_task_abc_2026-11-20');

    const parsed = parseCompletionId(id);
    assert.equal(parsed.itemId, 'user_task_abc');
    assert.equal(parsed.date, '2026-11-20');
  });

  it('deve rejeitar buildCompletionId com entradas inválidas', () => {
    assert.throws(() => buildCompletionId('', '2026-11-20'), /não pode ser vazio/);
    assert.throws(() => buildCompletionId('item-1', '2026-02-29'), /Data de conclusão inválida/);
  });
});

describe('Caminhos de Coleções do Firestore [Seguranca.NF001]', () => {
  it('deve montar caminhos isolados sob users/{userId}', () => {
    assert.equal(getUserItemsCollectionPath('user-1'), 'users/user-1/items');
    assert.equal(getUserItemDocPath('user-1', 'item-1'), 'users/user-1/items/item-1');
    assert.equal(getUserCompletionsCollectionPath('user-1'), 'users/user-1/completions');
    assert.equal(
      getUserCompletionDocPath('user-1', 'item-1', '2026-11-20'),
      'users/user-1/completions/item-1_2026-11-20'
    );
  });

  it('deve rejeitar identificadores vazios na geração de caminhos', () => {
    assert.throws(() => getUserItemsCollectionPath('  '), /userId.*obrigatório/);
    assert.throws(() => getUserItemDocPath('user-1', ''), /itemId.*obrigatório/);
  });
});

describe('Repositório Firestore: CRUD de Itens [RF001 a RF006]', () => {
  let adapter: InMemoryFirestoreAdapter;
  let repo: FirestoreRoutineRepository;
  const userId = 'user-test-123';

  beforeEach(() => {
    adapter = new InMemoryFirestoreAdapter();
    repo = new FirestoreRoutineRepository(adapter);
  });

  it('deve criar um hábito com recorrência diária e campos padrão', async () => {
    const input: CreateHabitInput = {
      type: 'habit',
      title: 'Meditação Matinal',
      category: 'Saúde',
      note: 'Focar na respiração consciente por 15 min.',
      scheduledTime: '07:30' as LocalTimeString,
      durationMinutes: 15,
      recurrence: {
        kind: 'daily',
        daysOfWeek: [],
      },
    };

    const item = await repo.createItem(userId, input);

    assert.ok(item.id);
    assert.equal(item.type, 'habit');
    assert.equal(item.title, 'Meditação Matinal');
    assert.equal(item.category, 'Saúde');
    assert.equal(item.note, 'Focar na respiração consciente por 15 min.');
    assert.equal(item.scheduledTime, '07:30');
    assert.equal(item.durationMinutes, 15);
    assert.equal(item.isActive, true);
    assert.deepEqual(item.recurrence?.daysOfWeek, [0, 1, 2, 3, 4, 5, 6]);
    assert.equal(item.targetDate, null);
    assert.ok(item.createdAt);
    assert.ok(item.updatedAt);

    // Verificar se foi persistido no caminho correto do Firestore
    const persisted = await repo.getItem(userId, item.id);
    assert.ok(persisted);
    assert.equal(persisted.id, item.id);
    assert.equal(persisted.title, item.title);
    assert.equal(persisted.category, item.category);
    assert.equal(persisted.note, item.note);
    assert.equal(persisted.scheduledTime, item.scheduledTime);
    assert.equal(persisted.durationMinutes, item.durationMinutes);
    assert.equal(persisted.isActive, item.isActive);
    assert.equal(persisted.createdAt.seconds, item.createdAt.seconds);
    assert.equal(
      persisted.createdAt.toDate?.().toISOString(),
      item.createdAt.toDate?.().toISOString()
    );
  });

  it('deve criar uma tarefa pontual com targetDate obrigatória', async () => {
    const input: CreateTaskInput = {
      type: 'task',
      title: 'Entregar relatório de projeto',
      category: 'Faculdade',
      scheduledTime: '14:00' as LocalTimeString,
      durationMinutes: 45,
      targetDate: '2026-11-20' as LocalDateString,
    };

    const item = await repo.createItem(userId, input);

    assert.ok(item.id);
    assert.equal(item.type, 'task');
    assert.equal(item.title, 'Entregar relatório de projeto');
    assert.equal(item.targetDate, '2026-11-20');
    assert.equal(item.recurrence, null);
    assert.equal(item.isActive, true);
  });

  it('deve rejeitar hábito sem horário ou com recorrência inválida', async () => {
    await assert.rejects(
      async () => {
        await repo.createItem(userId, {
          type: 'habit',
          title: 'Hábito Inválido',
          scheduledTime: 'horario-invalido' as unknown as LocalTimeString,
          recurrence: { kind: 'weekly', daysOfWeek: [] },
        });
      },
      /Horário agendado.*obrigatório para hábitos/
    );

    await assert.rejects(
      async () => {
        await repo.createItem(userId, {
          type: 'habit',
          title: 'Sem dias',
          scheduledTime: '08:00' as LocalTimeString,
          recurrence: { kind: 'weekly', daysOfWeek: [] },
        });
      },
      /Hábitos semanais exigem ao menos um dia/
    );
  });

  it('deve rejeitar título vazio ou excessivamente longo', async () => {
    await assert.rejects(
      async () => {
        await repo.createItem(userId, {
          type: 'task',
          title: '   ',
          targetDate: '2026-11-20' as LocalDateString,
        });
      },
      /O título do item é obrigatório/
    );

    await assert.rejects(
      async () => {
        await repo.createItem(userId, {
          type: 'task',
          title: 'A'.repeat(81),
          targetDate: '2026-11-20' as LocalDateString,
        });
      },
      /entre 1 e 80 caracteres/
    );
  });

  it('deve atualizar atributos de um item e renovar updatedAt [RF004]', async () => {
    const created = await repo.createItem(userId, {
      type: 'habit',
      title: 'Alongamento',
      scheduledTime: '08:00' as LocalTimeString,
      durationMinutes: 15,
      recurrence: { kind: 'daily', daysOfWeek: [] },
    });

    const updated = await repo.updateItem(userId, created.id, {
      title: 'Alongamento Matinal Avançado',
      durationMinutes: 30,
      scheduledTime: '08:15' as LocalTimeString,
    });

    assert.equal(updated.title, 'Alongamento Matinal Avançado');
    assert.equal(updated.durationMinutes, 30);
    assert.equal(updated.scheduledTime, '08:15');
    assert.notDeepEqual(updated.updatedAt, created.updatedAt);

    const reloaded = await repo.getItem(userId, created.id);
    assert.equal(reloaded?.title, 'Alongamento Matinal Avançado');
  });

  it('deve realizar exclusão lógica (archiveItem) setando isActive: false [RF006]', async () => {
    const item = await repo.createItem(userId, {
      type: 'task',
      title: 'Tarefa a ser arquivada',
      targetDate: '2026-11-20' as LocalDateString,
    });

    assert.equal(item.isActive, true);

    const archived = await repo.archiveItem(userId, item.id);
    assert.equal(archived.isActive, false);

    const loaded = await repo.getItem(userId, item.id);
    assert.equal(loaded?.isActive, false);
  });

  it('deve realizar exclusão física com deleteItem', async () => {
    const item = await repo.createItem(userId, {
      type: 'task',
      title: 'Tarefa para exclusão física',
      targetDate: '2026-11-20' as LocalDateString,
    });

    await repo.deleteItem(userId, item.id);
    const loaded = await repo.getItem(userId, item.id);
    assert.equal(loaded, null);
  });

  it('deve listar itens ativos por padrão e permitir listar todos [RF001]', async () => {
    const item1 = await repo.createItem(userId, {
      type: 'task',
      title: 'Item Ativo',
      targetDate: '2026-11-20' as LocalDateString,
    });

    const item2 = await repo.createItem(userId, {
      type: 'task',
      title: 'Item Arquivado',
      targetDate: '2026-11-20' as LocalDateString,
    });

    await repo.archiveItem(userId, item2.id);

    const onlyActive = await repo.listItems(userId);
    assert.equal(onlyActive.length, 1);
    assert.equal(onlyActive[0]?.id, item1.id);

    const all = await repo.listItems(userId, { onlyActive: false });
    assert.equal(all.length, 2);
  });

  it('não deve vazar itens entre usuários diferentes', async () => {
    await repo.createItem('user-A', {
      type: 'task',
      title: 'Tarefa User A',
      targetDate: '2026-11-20' as LocalDateString,
    });

    await repo.createItem('user-B', {
      type: 'task',
      title: 'Tarefa User B',
      targetDate: '2026-11-20' as LocalDateString,
    });

    const itemsA = await repo.listItems('user-A');
    const itemsB = await repo.listItems('user-B');

    assert.equal(itemsA.length, 1);
    assert.equal(itemsA[0]?.title, 'Tarefa User A');
    assert.equal(itemsB.length, 1);
    assert.equal(itemsB[0]?.title, 'Tarefa User B');
  });
});

describe('Conclusões Idempotentes e toggleCompletion [Confiabilidade.NF002, RF005]', () => {
  let adapter: InMemoryFirestoreAdapter;
  let repo: FirestoreRoutineRepository;
  const userId = 'user-completion-test';
  const testDate = '2026-11-20' as LocalDateString;

  beforeEach(() => {
    adapter = new InMemoryFirestoreAdapter();
    repo = new FirestoreRoutineRepository(adapter);
  });

  it('deve marcar conclusão de item gerando ID determinístico {itemId}_{date}', async () => {
    const item = {
      id: 'item-habito-1',
      type: 'habit' as const,
      scheduledTime: '08:00' as LocalTimeString,
    };

    const result = await repo.toggleCompletion(userId, item, testDate);

    assert.equal(result.action, 'completed');
    assert.equal(result.id, 'item-habito-1_2026-11-20');
    assert.ok(result.record);
    assert.equal(result.record?.itemId, 'item-habito-1');
    assert.equal(result.record?.itemType, 'habit');
    assert.equal(result.record?.date, '2026-11-20');
    assert.equal(result.record?.scheduledTime, '08:00');
    assert.ok(result.record?.completedAt);

    // Verificar se o documento foi gravado exatamente no path determinístico
    const stored = await repo.getCompletion(userId, 'item-habito-1', testDate);
    assert.ok(stored);
    assert.equal(stored.id, result.record?.id);
    assert.equal(stored.itemId, result.record?.itemId);
    assert.equal(stored.itemType, result.record?.itemType);
    assert.equal(stored.date, result.record?.date);
    assert.equal(stored.scheduledTime, result.record?.scheduledTime);
    assert.equal(stored.completedAt.seconds, result.record?.completedAt.seconds);
    assert.equal(
      stored.completedAt.toDate?.().toISOString(),
      result.record?.completedAt.toDate?.().toISOString()
    );
  });

  it('deve desmarcar conclusão quando acionado uma segunda vez (toggle)', async () => {
    const item = {
      id: 'item-tarefa-1',
      type: 'task' as const,
      scheduledTime: null,
    };

    // 1º toque: conclui
    const checkResult = await repo.toggleCompletion(userId, item, testDate);
    assert.equal(checkResult.action, 'completed');

    // 2º toque: desfaz
    const uncheckResult = await repo.toggleCompletion(userId, item, testDate);
    assert.equal(uncheckResult.action, 'uncompleted');
    assert.equal(uncheckResult.id, 'item-tarefa-1_2026-11-20');
    assert.equal(uncheckResult.record, undefined);

    // Documento deve ter sido removido do Firestore
    const stored = await repo.getCompletion(userId, 'item-tarefa-1', testDate);
    assert.equal(stored, null);
  });

  it('garante idempotência sob cliques múltiplos ou reconciliação offline [Confiabilidade.NF002]', async () => {
    const item = {
      id: 'item-offline-1',
      type: 'habit' as const,
      scheduledTime: '09:00' as LocalTimeString,
    };

    // Simular que a escrita foi realizada offline com o ID determinístico
    const firstCall = await repo.toggleCompletion(userId, item, testDate);
    assert.equal(firstCall.action, 'completed');

    // Se o cliente tentar salvar novamente o mesmo registro determinístico diretamente
    const docPath = getUserCompletionDocPath(userId, item.id, testDate);
    await adapter.setDoc(docPath, {
      itemId: item.id,
      itemType: item.type,
      date: testDate,
      scheduledTime: item.scheduledTime,
      completedAt: adapter.now(),
    });

    // A coleção continua contendo apenas 1 documento para a combinação (itemId, data)
    const completions = await repo.listCompletionsForDate(userId, testDate);
    assert.equal(completions.length, 1);
    assert.equal(completions[0]?.id, 'item-offline-1_2026-11-20');
  });

  it('deve listar conclusões de uma data específica com listCompletionsForDate', async () => {
    const item1 = { id: 'it-1', type: 'habit' as const, scheduledTime: '07:00' as LocalTimeString };
    const item2 = { id: 'it-2', type: 'task' as const, scheduledTime: '10:00' as LocalTimeString };
    const item3 = { id: 'it-3', type: 'habit' as const, scheduledTime: '18:00' as LocalTimeString };

    await repo.toggleCompletion(userId, item1, '2026-11-20' as LocalDateString);
    await repo.toggleCompletion(userId, item2, '2026-11-20' as LocalDateString);
    await repo.toggleCompletion(userId, item3, '2026-11-21' as LocalDateString); // Outra data

    const resultsToday = await repo.listCompletionsForDate(userId, '2026-11-20' as LocalDateString);
    assert.equal(resultsToday.length, 2);
    const ids = resultsToday.map((r) => r.itemId).sort();
    assert.deepEqual(ids, ['it-1', 'it-2']);

    const resultsTomorrow = await repo.listCompletionsForDate(userId, '2026-11-21' as LocalDateString);
    assert.equal(resultsTomorrow.length, 1);
    assert.equal(resultsTomorrow[0]?.itemId, 'it-3');
  });

  it('deve listar histórico de conclusões de um item com listCompletionsForItem', async () => {
    const item = { id: 'habito-sequencia', type: 'habit' as const, scheduledTime: '06:30' as LocalTimeString };

    await repo.toggleCompletion(userId, item, '2026-11-18' as LocalDateString);
    await repo.toggleCompletion(userId, item, '2026-11-19' as LocalDateString);
    await repo.toggleCompletion(userId, item, '2026-11-20' as LocalDateString);

    const history = await repo.listCompletionsForItem(userId, 'habito-sequencia');
    assert.equal(history.length, 3);
    const dates = history.map((r) => r.date).sort();
    assert.deepEqual(dates, ['2026-11-18', '2026-11-19', '2026-11-20']);
  });

  it('deve funcionar com a fábrica createRoutineRepository', async () => {
    const customRepo = createRoutineRepository(adapter);
    const item = { id: 'habito-factory', type: 'habit' as const, scheduledTime: '12:00' as LocalTimeString };

    const res = await customRepo.toggleCompletion(userId, item, testDate);
    assert.equal(res.action, 'completed');
    assert.equal(res.id, 'habito-factory_2026-11-20');
  });
});
