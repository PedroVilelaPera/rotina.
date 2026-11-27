import type { HighlightMilestone } from "../../types/achievements";
import type { RoutineItem } from "../../types/routine";

export function determineHighlightMilestone(
  habitCounts: Map<string, number>,
  itemsMap: Map<string, RoutineItem>,
): HighlightMilestone | null {
  let topHabitId: string | null = null;
  let maxCount = 0;

  for (const [id, count] of habitCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      topHabitId = id;
    }
  }

  if (!topHabitId || maxCount === 0) return null;

  const habit = itemsMap.get(topHabitId);
  const title = habit ? habit.title : "Hábito";

  const badge =
    maxCount >= 30
      ? "Marco Ouro"
      : maxCount >= 10
        ? "Marco Prata"
        : "Marco Bronze";

  return {
    habitId: topHabitId,
    habitTitle: title,
    count: maxCount,
    badgeLabel: badge,
    supportingText: `Você manteve a constância em “${title}” com dedicação genuína.`,
  };
}
