import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';

export interface RoutineHeaderProps {
  onPressAdd?: () => void;
  onPressProfile?: () => void;
  isAnonymous?: boolean;
}

export function RoutineHeader({
  onPressAdd,
  onPressProfile,
  isAnonymous = true,
}: RoutineHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>
          rotina
          <Text style={styles.logoDot}>.</Text>
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar nova tarefa ou hábito"
          android_ripple={{ color: Colors.backgroundSelected, borderless: true }}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={onPressAdd}>
          <Text style={styles.addIcon}>+</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil ou ajustes"
          android_ripple={{ color: Colors.backgroundSelected, borderless: true }}
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.profileButtonPressed,
          ]}
          onPress={onPressProfile}>
          <Text style={styles.profileText}>
            {isAnonymous ? 'V' : 'U'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  logoDot: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  addIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.onAccent,
    marginTop: -2,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonPressed: {
    backgroundColor: Colors.backgroundSelected,
  },
  profileText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
