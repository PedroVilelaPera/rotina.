import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/theme';
import type { ItemType } from '../../../types/routine';

export interface ItemTypeSelectorProps {
  value: ItemType;
  onChange: (type: ItemType) => void;
  disabled?: boolean;
}

export function ItemTypeSelector({
  value,
  onChange,
  disabled = false,
}: ItemTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Selecionar Tarefa do dia"
        accessibilityState={{ selected: value === 'task', disabled }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.option,
          value === 'task' && styles.optionSelected,
          pressed && !disabled && styles.optionPressed,
          disabled && styles.optionDisabled,
        ]}
        onPress={() => onChange('task')}>
        <Text
          style={[
            styles.optionText,
            value === 'task' && styles.optionTextSelected,
          ]}>
          Tarefa do dia
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Selecionar Hábito"
        accessibilityState={{ selected: value === 'habit', disabled }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.option,
          value === 'habit' && styles.optionSelected,
          pressed && !disabled && styles.optionPressed,
          disabled && styles.optionDisabled,
        ]}
        onPress={() => onChange('habit')}>
        <Text
          style={[
            styles.optionText,
            value === 'habit' && styles.optionTextSelected,
          ]}>
          Hábito recorrente
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.text,
  },
});
