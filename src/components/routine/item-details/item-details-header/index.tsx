import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '../../../../constants/theme';
import type { ItemType } from '../../../../types/routine';

import { styles } from './styles';

export interface ItemDetailsHeaderProps {
  itemType: ItemType;
  onPressBack: () => void;
  onPressEdit: () => void;
  isAnonymous?: boolean;
}

export function ItemDetailsHeader({
  itemType,
  onPressBack,
  onPressEdit,
  isAnonymous = true,
}: ItemDetailsHeaderProps) {
  const editButtonLabel = itemType === 'habit' ? 'Editar Hábito' : 'Editar Tarefa';

  return (
    <View style={styles.container}>
      {/* Título/Logo centralizado em absoluto para alinhamento geométrico perfeito */}
      <View style={styles.centerContainer} pointerEvents="none">
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>
            rotina
            <Text style={styles.logoDot}>.</Text>
          </Text>
        </View>
      </View>

      <View style={styles.leftRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para a rotina"
          hitSlop={12}
          android_ripple={{ color: Colors.backgroundSelected, borderless: true }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={onPressBack}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.rightRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editButtonLabel}
          android_ripple={{ color: Colors.backgroundSelected, borderless: false }}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
          onPress={onPressEdit}>
          <Text style={styles.editText}>{editButtonLabel}</Text>
        </Pressable>

        <View style={styles.profileIndicator}>
          <Text style={styles.profileText}>{isAnonymous ? 'V' : 'U'}</Text>
        </View>
      </View>
    </View>
  );
}
