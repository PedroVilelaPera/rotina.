import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { DurationMinutes } from '../../../../types/routine';

import { styles } from './styles';

export interface DurationPickerProps {
  value: DurationMinutes;
  onChange: (duration: DurationMinutes) => void;
  label?: string;
}

const DURATIONS: { value: DurationMinutes; label: string }[] = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
];

export function DurationPicker({
  value,
  onChange,
  label = 'Duração estimada',
}: DurationPickerProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pillsRow}>
        {DURATIONS.map((d) => {
          const isSelected = value === d.value;
          return (
            <Pressable
              key={d.value}
              accessibilityRole="button"
              accessibilityLabel={`Duração de ${d.label}`}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.pill,
                isSelected && styles.pillSelected,
                pressed && styles.pillPressed,
              ]}
              onPress={() => onChange(d.value)}>
              <Text
                style={[
                  styles.pillText,
                  isSelected && styles.pillTextSelected,
                ]}>
                {d.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
