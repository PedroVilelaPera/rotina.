export const Colors = {
  text: '#F5F2F0',
  background: '#151312',
  backgroundElement: '#1D1B1A',
  backgroundSelected: '#262423',
  border: '#2D2927',
  accent: '#E07A5F',
  onAccent: '#151312',
  textSecondary: '#A8A29E',
  danger: '#C85A53',
} as const;

export type ThemeColor = keyof typeof Colors;
