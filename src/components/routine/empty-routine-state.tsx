import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 24,
    color: Colors.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onAccent,
  },
});
