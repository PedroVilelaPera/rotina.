export interface HighlightMilestone {
  habitId: string;
  habitTitle: string;
  count: number;
  badgeLabel: string; // Ex: "Marco Ouro", "Marco Prata" ou "Maior Consistência"
  supportingText: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  count: number;
  type: "streak" | "habit" | "tasks" | "punctuality";
  completed: boolean;
}

export interface DailyThought {
  quote: string;
  author: string;
}

export interface AchievementsData {
  hasAnyCompletions: boolean;
  longestStreakDays: number;
  totalHabitsCompleted: number;
  totalTasksCompleted: number;
  punctualCompletionsCount: number;
  highlightMilestone: HighlightMilestone | null;
  victories: AchievementItem[];
  thoughtOfTheDay: DailyThought;
}
