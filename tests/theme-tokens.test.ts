import assert from 'node:assert/strict';
import test from 'node:test';

import { Colors } from '../src/constants/theme';
import { tokens } from '../src/theme/tokens';

function hexToRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = hexToRelativeLuminance(foregroundHex);
  const l2 = hexToRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test('expõe todos os 9 tokens oficiais da paleta Warm Obsidian Terracotta', () => {
  assert.equal(tokens.colors.bg.root, '#151312');
  assert.equal(tokens.colors.bg.surface, '#1D1B1A');
  assert.equal(tokens.colors.bg.elevated, '#262423');
  assert.equal(tokens.colors.border.subtle, '#2D2927');
  assert.equal(tokens.colors.accent.primary, '#E07A5F');
  assert.equal(tokens.colors.accent.onPrimary, '#151312');
  assert.equal(tokens.colors.text.primary, '#F5F2F0');
  assert.equal(tokens.colors.text.secondary, '#A8A29E');
  assert.equal(tokens.colors.semantic.danger, '#C85A53');
});

test('mantém Colors em src/constants/theme.ts sincronizado com tokens.colors', () => {
  assert.equal(Colors.background, tokens.colors.bg.root);
  assert.equal(Colors.backgroundElement, tokens.colors.bg.surface);
  assert.equal(Colors.backgroundSelected, tokens.colors.bg.elevated);
  assert.equal(Colors.border, tokens.colors.border.subtle);
  assert.equal(Colors.accent, tokens.colors.accent.primary);
  assert.equal(Colors.onAccent, tokens.colors.accent.onPrimary);
  assert.equal(Colors.text, tokens.colors.text.primary);
  assert.equal(Colors.textSecondary, tokens.colors.text.secondary);
  assert.equal(Colors.danger, tokens.colors.semantic.danger);
});

test('respeita relação de contraste WCAG AA (>= 4.5:1) nas combinações principais', () => {
  assert.ok(
    contrastRatio(tokens.colors.accent.onPrimary, tokens.colors.accent.primary) >= 4.5,
    'accent.onPrimary sobre accent.primary deve atingir WCAG AA',
  );
  assert.ok(
    contrastRatio(tokens.colors.text.primary, tokens.colors.bg.root) >= 4.5,
    'text.primary sobre bg.root deve atingir WCAG AA',
  );
  assert.ok(
    contrastRatio(tokens.colors.text.primary, tokens.colors.bg.surface) >= 4.5,
    'text.primary sobre bg.surface deve atingir WCAG AA',
  );
  assert.ok(
    contrastRatio(tokens.colors.text.secondary, tokens.colors.bg.root) >= 4.5,
    'text.secondary sobre bg.root deve atingir WCAG AA',
  );
  assert.ok(
    contrastRatio(tokens.colors.text.secondary, tokens.colors.bg.surface) >= 4.5,
    'text.secondary sobre bg.surface deve atingir WCAG AA',
  );
});

test('define os quatro pesos obrigatórios de Plus Jakarta Sans', () => {
  assert.equal(tokens.fonts.regular, 'PlusJakartaSans_400Regular');
  assert.equal(tokens.fonts.medium, 'PlusJakartaSans_500Medium');
  assert.equal(tokens.fonts.semiBold, 'PlusJakartaSans_600SemiBold');
  assert.equal(tokens.fonts.bold, 'PlusJakartaSans_700Bold');
});
