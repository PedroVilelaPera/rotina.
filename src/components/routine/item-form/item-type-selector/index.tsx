import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { ItemType } from '../../../../types/routine';

import { styles } from './styles';

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
