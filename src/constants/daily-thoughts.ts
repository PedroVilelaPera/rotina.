import type { DailyThought } from "../types/achievements";

export const DAILY_THOUGHTS: DailyThought[] = [
  {
    quote: "Rotina boa não é a perfeita; é aquela que te traz paz.",
    author: "rotina.",
  },
  {
    quote: "Pequenos passos diários constroem uma rotina com mais presença.",
    author: "rotina.",
  },
  {
    quote: "Constância é voltar com gentileza sempre que precisar recomeçar.",
    author: "rotina.",
  },
  {
    quote: "Respeite seu ritmo hoje. O progresso não precisa ser apressado.",
    author: "rotina.",
  },
  {
    quote: "Um dia de cada vez, sem cobranças desnecessárias.",
    author: "rotina.",
  },
  {
    quote: "Cuidar de você é o hábito mais importante da sua lista.",
    author: "rotina.",
  },
  {
    quote: "Celebre o que foi possível fazer hoje.",
    author: "rotina.",
  },
];

/**
 * Retorna um pensamento do dia estável baseado na data YYYY-MM-DD.
 */
export function getThoughtForDate(dateString: string): DailyThought {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_THOUGHTS.length;
  return DAILY_THOUGHTS[index];
}
