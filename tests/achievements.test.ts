import assert from 'node:assert/strict';
import test from 'node:test';

import { DAILY_THOUGHTS, getThoughtForDate } from '../src/constants/daily-thoughts';
import type { CompletionRecord, RoutineItem } from '../src/types/routine';
import { calculateAchievements } from '../src/utils/achievements';
import { determineHighlightMilestone } from '../src/utils/achievements/milestones';
import { isPunctual } from '../src/utils/achievements/punctuality';
import { calculateLongestStreak } from '../src/utils/achievements/streak';

const referenceDate = '2026-11-26';

function createHabit(overrides: Partial<RoutineItem> = {}): RoutineItem {
  return {
    id: 'habit-1',
    type: 'habit',
    title: 'Leitura',
    category: null,
    note: null,
    scheduledTime: '08:00',
    durationMinutes: 30,
    recurrence: { kind: 'daily', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    targetDate: null,
    isActive: true,
    createdAt: { seconds: 0, nanoseconds: 0 },
    updatedAt: { seconds: 0, nanoseconds: 0 },
    ...overrides,
  };
}

function createCompletion(overrides: Partial<CompletionRecord> = {}): CompletionRecord {
  const completedAt = new Date(2026, 10, 26, 8, 0, 0).getTime();
  return {
    id: 'habit-1_2026-11-26',
    itemId: 'habit-1',
    itemType: 'habit',
    date: referenceDate,
    scheduledTime: '08:00',
    completedAt: {
      seconds: Math.floor(completedAt / 1000),
      nanoseconds: (completedAt % 1000) * 1_000_000,
      toMillis: () => completedAt,
    },
    ...overrides,
  };
}

test('calculateLongestStreak encontra a maior sequência histórica de dias consecutivos', async (t) => {
  await t.test('seleciona a maior sequência mesmo que não seja a sequência mais recente', () => {
    assert.equal(
      calculateLongestStreak(['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-25', '2026-11-26']),
      3,
    );
  });

  await t.test('deduplica várias conclusões no mesmo dia', () => {
    assert.equal(calculateLongestStreak(['2026-11-25', '2026-11-25', '2026-11-26']), 2);
  });

  await t.test('retorna zero sem conclusões', () => {
    assert.equal(calculateLongestStreak([]), 0);
  });
});

test('isPunctual considera a tolerância inclusiva de 15 minutos', async (t) => {
  await t.test('aceita o limite de 15 minutos', () => {
    const atLimit = new Date(2026, 10, 26, 8, 15).getTime();
    assert.equal(isPunctual('08:00', atLimit), true);
  });

  await t.test('rejeita conclusão fora da tolerância', () => {
    const late = new Date(2026, 10, 26, 8, 16).getTime();
    assert.equal(isPunctual('08:00', late), false);
  });

  await t.test('não considera pontualidade sem horário planejado', () => {
    assert.equal(isPunctual(null, Date.now()), false);
  });
});

test('determineHighlightMilestone seleciona o hábito com maior contador', () => {
  const items = new Map([
    ['habit-1', createHabit()],
    ['habit-2', createHabit({ id: 'habit-2', title: 'Alongamento' })],
  ]);

  const result = determineHighlightMilestone(
    new Map([
      ['habit-1', 9],
      ['habit-2', 10],
    ]),
    items,
  );

  assert.equal(result?.habitId, 'habit-2');
  assert.equal(result?.habitTitle, 'Alongamento');
  assert.equal(result?.badgeLabel, 'Marco Prata');
});

test('calculateAchievements agrega contadores e converte FirestoreTimestampLike para pontualidade', () => {
  const habitCompletion = createCompletion();
  const taskCompletion = createCompletion({
    id: 'task-1_2026-11-26',
    itemId: 'task-1',
    itemType: 'task',
    scheduledTime: null,
  });

  const data = calculateAchievements(
    [habitCompletion, taskCompletion],
    [createHabit()],
    referenceDate,
  );

  assert.equal(data.hasAnyCompletions, true);
  assert.equal(data.totalHabitsCompleted, 1);
  assert.equal(data.totalTasksCompleted, 1);
  assert.equal(data.punctualCompletionsCount, 1);
  assert.equal(data.longestStreakDays, 1);
  assert.equal(data.highlightMilestone?.count, 1);
  assert.equal(data.victories.some((item) => item.type === 'tasks'), true);
  assert.equal(data.victories.some((item) => item.type === 'punctuality'), true);
});

test('calculateAchievements usa seconds e nanoseconds quando toMillis não existe', () => {
  const completedAt = new Date(2026, 10, 26, 8, 10, 0).getTime();
  const data = calculateAchievements(
    [
      createCompletion({
        completedAt: {
          seconds: Math.floor(completedAt / 1000),
          nanoseconds: (completedAt % 1000) * 1_000_000,
        },
      }),
    ],
    [createHabit()],
    referenceDate,
  );

  assert.equal(data.punctualCompletionsCount, 1);
});

test('calculateAchievements retorna estado vazio sem contadores negativos', () => {
  const data = calculateAchievements([], [], referenceDate);

  assert.equal(data.hasAnyCompletions, false);
  assert.equal(data.totalHabitsCompleted, 0);
  assert.equal(data.totalTasksCompleted, 0);
  assert.equal(data.punctualCompletionsCount, 0);
  assert.equal(data.longestStreakDays, 0);
  assert.equal(data.highlightMilestone, null);
  assert.deepEqual(data.victories, []);
});

test('getThoughtForDate é estável e seleciona um pensamento cadastrado', () => {
  const first = getThoughtForDate(referenceDate);
  const second = getThoughtForDate(referenceDate);

  assert.deepEqual(first, second);
  assert.equal(DAILY_THOUGHTS.some((thought) => thought.quote === first.quote), true);
});
