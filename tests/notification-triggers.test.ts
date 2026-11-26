import test from 'node:test';
import assert from 'node:assert/strict';

import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { buildHabitReminderTriggers } from '../src/services/notifications/build-triggers';
import type { RoutineItem } from '../src/types/routine';

function createMockHabit(overrides: Partial<RoutineItem> = {}): RoutineItem {
  return {
    id: 'habit-test-1',
    type: 'habit',
    title: 'Exercício matinal',
    category: 'Saúde',
    note: null,
    scheduledTime: '07:30',
    durationMinutes: 30,
    recurrence: {
      kind: 'weekly',
      daysOfWeek: [1, 3, 5], // Seg, Qua, Sex (0 = Dom ... 6 = Sab)
    },
    targetDate: null,
    isActive: true,
    createdAt: '2026-11-26T10:00:00.000Z',
    updatedAt: '2026-11-26T10:00:00.000Z',
    ...overrides,
  };
}

test('buildHabitReminderTriggers — Lembretes Semanais e Diários [RF001]', async (t) => {
  await t.test('deve gerar gatilho DAILY com hora e minuto corretos', () => {
    const habit = createMockHabit({
      recurrence: {
        kind: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      scheduledTime: '08:45',
    });

    const triggers = buildHabitReminderTriggers(habit);

    assert.equal(triggers.length, 1);
    assert.deepEqual(triggers[0], {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 45,
    });
  });

  await t.test('deve gerar gatilhos WEEKLY mapeando os dias 0-6 para weekday 1-7 no Expo', () => {
    const habit = createMockHabit({
      recurrence: {
        kind: 'weekly',
        daysOfWeek: [0, 2, 4, 6], // Dom, Ter, Qui, Sab
      },
      scheduledTime: '14:15',
    });

    const triggers = buildHabitReminderTriggers(habit);

    assert.equal(triggers.length, 4);
    assert.deepEqual(triggers, [
      {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Domingo (0 + 1)
        hour: 14,
        minute: 15,
      },
      {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 3, // Terça (2 + 1)
        hour: 14,
        minute: 15,
      },
      {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 5, // Quinta (4 + 1)
        hour: 14,
        minute: 15,
      },
      {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 7, // Sábado (6 + 1)
        hour: 14,
        minute: 15,
      },
    ]);
  });

  await t.test('deve deduplicar dias da semana repetidos na recorrência semanal', () => {
    const habit = createMockHabit({
      recurrence: {
        kind: 'weekly',
        daysOfWeek: [1, 1, 3, 3, 5],
      },
      scheduledTime: '19:00',
    });

    const triggers = buildHabitReminderTriggers(habit);

    assert.equal(triggers.length, 3);
    assert.deepEqual(triggers.map((trig) => ('weekday' in trig ? trig.weekday : null)), [2, 4, 6]);
  });

  await t.test('não deve gerar gatilho para tarefa pontual (type == task)', () => {
    const task: RoutineItem = {
      ...createMockHabit(),
      type: 'task',
      recurrence: null,
      targetDate: '2026-11-26',
    };

    const triggers = buildHabitReminderTriggers(task);
    assert.equal(triggers.length, 0);
  });

  await t.test('não deve gerar gatilho para hábito arquivado/inativo (isActive == false)', () => {
    const habit = createMockHabit({ isActive: false });
    const triggers = buildHabitReminderTriggers(habit);
    assert.equal(triggers.length, 0);
  });

  await t.test('não deve gerar gatilho se scheduledTime estiver ausente ou nulo', () => {
    const habit = createMockHabit({ scheduledTime: null });
    const triggers = buildHabitReminderTriggers(habit);
    assert.equal(triggers.length, 0);
  });
});
