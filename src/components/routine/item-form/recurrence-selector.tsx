import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/theme';
import type { DayOfWeek, RecurrenceKind } from '../../../types/routine';

export interface RecurrenceSelectorProps {
  kind: RecurrenceKind;
  daysOfWeek: DayOfWeek[];
  onKindChange: (kind: RecurrenceKind) => void;
  onToggleDay: (day: DayOfWeek) => void;
  onSetDays?: (days: DayOfWeek[]) => void;
  errorMessage?: string;
}

const DAYS: { day: DayOfWeek; label: string; full: string }[] = [
  { day: 0, label: 'D', full: 'Domingo' },
  { day: 1, label: 'S', full: 'Segunda-feira' },
  { day: 2, label: 'T', full: 'Terça-feira' },
  { day: 3, label: 'Q', full: 'Quarta-feira' },
  { day: 4, label: 'Q', full: 'Quinta-feira' },
  { day: 5, label: 'S', full: 'Sexta-feira' },
  { day: 6, label: 'S', full: 'Sábado' },
];

export function RecurrenceSelector({
  kind,
  daysOfWeek,
  onKindChange,
  onToggleDay,
  onSetDays,
  errorMessage,
}: RecurrenceSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Frequência do hábito</Text>

      {/* Seletor Diário vs Semanal */}
      <View style={styles.kindSelector}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Frequência diária (todos os dias)"
          accessibilityState={{ selected: kind === 'daily' }}
          style={({ pressed }) => [
            styles.kindOption,
            kind === 'daily' && styles.kindOptionSelected,
            pressed && styles.kindOptionPressed,
          ]}
          onPress={() => onKindChange('daily')}>
          <Text
            style={[
              styles.kindText,
              kind === 'daily' && styles.kindTextSelected,
            ]}>
            Todos os dias
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Frequência semanal (dias específicos)"
          accessibilityState={{ selected: kind === 'weekly' }}
          style={({ pressed }) => [
            styles.kindOption,
            kind === 'weekly' && styles.kindOptionSelected,
            pressed && styles.kindOptionPressed,
          ]}
          onPress={() => onKindChange('weekly')}>
          <Text
            style={[
              styles.kindText,
              kind === 'weekly' && styles.kindTextSelected,
            ]}>
            Dias da semana
          </Text>
        </Pressable>
      </View>

      {/* Dias da Semana (D S T Q Q S S) quando Semanal */}
      {kind === 'weekly' && (
        <View style={styles.weeklyContainer}>
          <View style={styles.daysRow}>
            {DAYS.map(({ day, label, full }) => {
              const isSelected = daysOfWeek.includes(day);
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${full}`}
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                    pressed && styles.dayChipPressed,
                  ]}
                  onPress={() => onToggleDay(day)}>
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Atalho rápido para Dias Úteis / Fim de Semana */}
          {onSetDays && (
            <View style={styles.presetsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar apenas dias úteis (Segunda a Sexta)"
                onPress={() => onSetDays([1, 2, 3, 4, 5])}
                style={styles.presetButton}>
                <Text style={styles.presetText}>Dias úteis (Seg-Sex)</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar fins de semana (Sábado e Domingo)"
                onPress={() => onSetDays([0, 6])}
                style={styles.presetButton}>
                <Text style={styles.presetText}>Fim de semana</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
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
  kindSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  kindOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  kindOptionSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  kindOptionPressed: {
    opacity: 0.8,
  },
  kindText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kindTextSelected: {
    color: Colors.text,
  },
  weeklyContainer: {
    marginTop: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 46,
    borderRadius: 23,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  dayChipPressed: {
    opacity: 0.8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.accent,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    justifyContent: 'center',
  },
  presetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  presetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    fontWeight: '500',
  },
});
