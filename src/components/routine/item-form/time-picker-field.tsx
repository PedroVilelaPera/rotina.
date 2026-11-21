import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '../../../constants/theme';

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
  // Mascara simples para entrada amigável de 4 dígitos para HH:mm
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: Colors.accent,
  },
  clearText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputContainerError: {
    borderColor: Colors.danger,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 0,
  },
  formatHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    fontWeight: '500',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  presetChipPressed: {
    opacity: 0.8,
  },
  presetChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  presetChipTextSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
