import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '../../../constants/theme';

import { styles } from './styles';

export interface EmptyRoutineStateProps {
  onPressCreate?: () => void;
}

export function EmptyRoutineState({ onPressCreate }: EmptyRoutineStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>✦</Text>
      </View>

      <Text style={styles.title}>Seu dia está livre por enquanto</Text>
      <Text style={styles.description}>
        Organize seus hábitos e tarefas no seu ritmo, sem cobranças ou penalidades.
      </Text>

      {onPressCreate && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar o primeiro item para hoje"
          android_ripple={{ color: Colors.backgroundSelected }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onPressCreate}>
          <Text style={styles.buttonText}>+ Adicionar hábito ou tarefa</Text>
        </Pressable>
      )}
    </View>
  );
}
