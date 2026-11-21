import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '../../../../constants/theme';
import type { LocalTimeString } from '../../../../types/routine';

import { styles } from './styles';

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
