import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';
import type { RoutineItem } from '../../types/routine';

export interface RoutineItemCardProps {
  item: RoutineItem;
  isCompleted: boolean;
  onToggle: (item: RoutineItem) => void;
  onPressDetails?: (item: RoutineItem) => void;
}

export function RoutineItemCard({
  item,
  isCompleted,
  onToggle,
  onPressDetails,
}: RoutineItemCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Item: ${item.title}. Status: ${isCompleted ? 'Concluído' : 'Pendente'}`}
      style={({ pressed }) => [
        styles.card,
        isCompleted && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPressDetails?.(item)}>
      {/* Checkbox de 1 toque [Usabilidade.NF002, Gestao da Rotina.RF005] */}
      <Pressable
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={`Marcar ${item.title}`}
        style={({ pressed }) => [
          styles.checkbox,
          isCompleted ? styles.checkboxChecked : styles.checkboxUnchecked,
          pressed && styles.checkboxPressed,
        ]}
        onPress={() => onToggle(item)}>
        {isCompleted && <Text style={styles.checkmarkIcon}>✓</Text>}
      </Pressable>

      {/* Conteúdo Central */}
      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            isCompleted && styles.titleCompleted,
          ]}>
          {item.title}
        </Text>

        {/* Metadados / Badges */}
        <View style={styles.metaRow}>
          {item.scheduledTime && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.scheduledTime}</Text>
            </View>
          )}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.durationMinutes}m</Text>
          </View>

          <View style={styles.badgeMuted}>
            <Text style={styles.badgeMutedText}>
              {item.type === 'habit' ? 'Hábito' : 'Tarefa'}
            </Text>
          </View>

          {item.category && (
            <View style={styles.badgeCategory}>
              <Text style={styles.badgeCategoryText}>{item.category}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  cardCompleted: {
    opacity: 0.75,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundSelected,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxUnchecked: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  checkboxPressed: {
    transform: [{ scale: 0.92 }],
  },
  checkmarkIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onAccent,
    marginTop: -1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 22,
  },
  titleCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  badgeMuted: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMutedText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  badgeCategory: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
