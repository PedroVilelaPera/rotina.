import { getThoughtForDate } from '../../constants/daily-thoughts';
import type {
  AchievementItem,
  AchievementsData,
} from '../../types/achievements';
import type {
  CompletionRecord,
  FirestoreTimestampLike,
  RoutineItem,
} from '../../types/routine';
import { determineHighlightMilestone } from './milestones';
import { isPunctual } from './punctuality';
import { calculateLongestStreak } from './streak';

function timestampToMillis(timestamp: FirestoreTimestampLike): number {
  if (timestamp.toMillis) {
    return timestamp.toMillis();
  }

  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1_000_000);
}

export function calculateAchievements(
  completions: CompletionRecord[],
  items: RoutineItem[],
  referenceDate: string,
): AchievementsData {
  const thoughtOfTheDay = getThoughtForDate(referenceDate);

  if (completions.length === 0) {
    return {
      hasAnyCompletions: false,
      longestStreakDays: 0,
      totalHabitsCompleted: 0,
      totalTasksCompleted: 0,
      punctualCompletionsCount: 0,
      highlightMilestone: null,
      victories: [],
      thoughtOfTheDay,
    };
  }

  const itemsMap = new Map(items.map((item) => [item.id, item]));
  const habitCounts = new Map<string, number>();
  const dates: string[] = [];

  let totalHabits = 0;
  let totalTasks = 0;
  let punctualCount = 0;

  for (const completion of completions) {
    dates.push(completion.date);

    if (completion.itemType === 'habit') {
      totalHabits++;
      habitCounts.set(
        completion.itemId,
        (habitCounts.get(completion.itemId) ?? 0) + 1,
      );
    } else {
      totalTasks++;
    }

    if (
      isPunctual(
        completion.scheduledTime,
        timestampToMillis(completion.completedAt),
      )
    ) {
      punctualCount++;
    }
  }

  const longestStreakDays = calculateLongestStreak(dates);
  const highlightMilestone = determineHighlightMilestone(habitCounts, itemsMap);
  const victories = buildVictoriesList({
    longestStreakDays,
    habitCounts,
    itemsMap,
    totalTasks,
    punctualCount,
  });

  return {
    hasAnyCompletions: true,
    longestStreakDays,
    totalHabitsCompleted: totalHabits,
    totalTasksCompleted: totalTasks,
    punctualCompletionsCount: punctualCount,
    highlightMilestone,
    victories,
    thoughtOfTheDay,
  };
}

function buildVictoriesList(params: {
  longestStreakDays: number;
  habitCounts: Map<string, number>;
  itemsMap: Map<string, RoutineItem>;
  totalTasks: number;
  punctualCount: number;
}): AchievementItem[] {
  const { longestStreakDays, habitCounts, itemsMap, totalTasks, punctualCount } = params;
  const victories: AchievementItem[] = [];

  if (longestStreakDays > 0) {
    victories.push({
      id: 'streak',
      title: `${longestStreakDays} ${longestStreakDays === 1 ? 'dia ativo' : 'dias seguidos de rotina ativa'}`,
      description: 'Sua melhor presença no dia a dia, sem pressão.',
      count: longestStreakDays,
      type: 'streak',
      completed: true,
    });
  }

  for (const [habitId, count] of habitCounts.entries()) {
    const habit = itemsMap.get(habitId);
    if (!habit) continue;

    victories.push({
      id: `habit-${habitId}`,
      title: `${count} ${count === 1 ? 'conclusão de' : 'conclusões de'} ${habit.title.toLowerCase()}`,
      description: 'Constância real construída no seu próprio ritmo.',
      count,
      type: 'habit',
      completed: true,
    });
  }

  if (totalTasks > 0) {
    victories.push({
      id: 'tasks',
      title: `${totalTasks} ${totalTasks === 1 ? 'tarefa concluída' : 'tarefas concluídas no seu tempo'}`,
      description: 'Ritmo saudável e constante, sem ansiedade.',
      count: totalTasks,
      type: 'tasks',
      completed: true,
    });
  }

  if (punctualCount > 0) {
    victories.push({
      id: 'punctuality',
      title: `${punctualCount} ${punctualCount === 1 ? 'conclusão no horário planejado' : 'conclusões no horário planejado'}`,
      description: 'Concluído na janela de tolerância de 15 minutos.',
      count: punctualCount,
      type: 'punctuality',
      completed: true,
    });
  }

  return victories;
}
