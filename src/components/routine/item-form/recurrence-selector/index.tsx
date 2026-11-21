import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { DayOfWeek, RecurrenceKind } from '../../../../types/routine';

import { styles } from './styles';

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
