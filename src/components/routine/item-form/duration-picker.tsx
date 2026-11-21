import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/theme';
import type { DurationMinutes } from '../../../types/routine';

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

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.accent,
  },
});
