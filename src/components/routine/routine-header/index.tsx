import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '../../../constants/theme';

import { styles } from './styles';

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
