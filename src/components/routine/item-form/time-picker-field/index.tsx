import React from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '../../../../constants/theme';

import { styles } from './styles';

export interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  label?: string;
  errorMessage?: string;
  showPresets?: boolean;
}

const COMMON_PRESETS = ['07:00', '08:30', '12:00', '18:00', '21:00'];

export function TimePickerField({
  value,
  onChange,
  isRequired = false,
  label = 'Horário planejado',
  errorMessage,
  showPresets = true,
}: TimePickerFieldProps) {
  // Máscara simples para entrada amigável de 4 dígitos para HH:mm
  const handleTextChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 4);
    if (digitsOnly.length <= 2) {
      onChange(digitsOnly);
    } else {
      const hours = digitsOnly.slice(0, 2);
      const minutes = digitsOnly.slice(2);
      onChange(`${hours}:${minutes}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {isRequired && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        {!isRequired && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar horário da tarefa"
            onPress={() => onChange('')}
            hitSlop={8}>
            <Text style={styles.clearText}>Sem horário fixo</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.inputContainer,
          Boolean(errorMessage) && styles.inputContainerError,
        ]}>
        <Text style={styles.clockIcon}>🕒</Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={handleTextChange}
          placeholder="08:00"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          maxLength={5}
          style={styles.input}
        />
        <Text style={styles.formatHint}>24h (HH:mm)</Text>
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {/* Atalhos Rápidos */}
      {showPresets && (
        <View style={styles.presetsRow}>
          {COMMON_PRESETS.map((preset) => {
            const isSelected = value === preset;
            return (
              <Pressable
                key={preset}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar horário ${preset}`}
                style={({ pressed }) => [
                  styles.presetChip,
                  isSelected && styles.presetChipSelected,
                  pressed && styles.presetChipPressed,
                ]}
                onPress={() => onChange(preset)}>
                <Text
                  style={[
                    styles.presetChipText,
                    isSelected && styles.presetChipTextSelected,
                  ]}>
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
