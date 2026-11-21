import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/theme';
import type { LocalTimeString } from '../../../types/routine';

export interface TimeStepperCardProps {
  scheduledTime: LocalTimeString | null;
  onAdjust: (delta: 15 | -15) => void;
  label?: string;
}

export function TimeStepperCard({
  scheduledTime,
  onAdjust,
  label = 'Início',
}: TimeStepperCardProps) {
  const displayTime = scheduledTime ?? '--:--';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subtext}>Micro-ajustes de 15 min</Text>
      </View>

      <View style={styles.stepperContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adiantar 15 minutos (-15m)"
          android_ripple={{ color: Colors.backgroundSelected, borderless: false }}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
          ]}
          onPress={() => onAdjust(-15)}>
          <Text style={styles.stepButtonText}>-15m</Text>
        </Pressable>

        <View style={styles.timeDisplay}>
          <Text style={styles.timeValue}>{displayTime}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atrasar 15 minutos (+15m)"
          android_ripple={{ color: Colors.backgroundSelected, borderless: false }}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
          ]}
          onPress={() => onAdjust(15)}>
          <Text style={styles.stepButtonText}>+15m</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSelected,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: Colors.border,
    transform: [{ scale: 0.96 }],
  },
  stepButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  timeDisplay: {
    flex: 1.4,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1,
  },
});
