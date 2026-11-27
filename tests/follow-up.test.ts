import assert from 'node:assert/strict';
import test from 'node:test';

import { createRoutineRepository, InMemoryFirestoreAdapter } from '../src/repositories/routine-repository';
import {
  findPendingFollowUpHabits,
  getFollowUpTriggerDate,
  hasFollowUpTimeArrived,
} from '../src/services/follow-up';
import { getYesterdayLocalDateString } from '../src/utils/routine-daily';

test('follow-up só considera o horário local configurado', () => {
  assert.equal(hasFollowUpTimeArrived(new Date(2026, 10, 27, 8, 59), '09:00'), false);
  assert.equal(hasFollowUpTimeArrived(new Date(2026, 10, 27, 9, 0), '09:00'), true);
  assert.equal(hasFollowUpTimeArrived(new Date(2026, 10, 27, 12, 0), 'inválido'), false);
  assert.equal(getFollowUpTriggerDate(new Date(2026, 10, 27, 8, 0), '09:15')?.getHours(), 9);
  assert.equal(getFollowUpTriggerDate(new Date(), '25:00'), null);
});

test('data de ontem respeita virada de mês e ano no calendário local', () => {
  assert.equal(getYesterdayLocalDateString(new Date(2026, 0, 1, 0, 5)), '2025-12-31');
});

test('busca hábitos ativos agendados ontem que ainda não têm conclusão', async () => {
  const adapter = new InMemoryFirestoreAdapter();
  const repository = createRoutineRepository(adapter);
  const userId = 'follow-up-user';
  const today = new Date(2026, 10, 27, 10, 0); // sexta-feira; ontem foi quinta-feira
  const yesterday = getYesterdayLocalDateString(today);

  const daily = await repository.createItem(userId, {
    type: 'habit', title: 'Leitura', scheduledTime: '20:00',
    recurrence: { kind: 'daily', daysOfWeek: [] },
  });
  const weeklyYesterday = await repository.createItem(userId, {
    type: 'habit', title: 'Alongamento', scheduledTime: '07:00',
    recurrence: { kind: 'weekly', daysOfWeek: [4] },
  });
  await repository.createItem(userId, {
    type: 'habit', title: 'Domingo', scheduledTime: '07:00',
    recurrence: { kind: 'weekly', daysOfWeek: [0] },
  });
  await repository.createItem(userId, {
    type: 'task', title: 'Tarefa pontual', targetDate: yesterday,
  });
  await repository.toggleCompletion(userId, daily, yesterday);

  const result = await findPendingFollowUpHabits(repository, userId, today);
  assert.equal(result.date, yesterday);
  assert.deepEqual(result.habits.map((habit) => habit.id), [weeklyYesterday.id]);
});
