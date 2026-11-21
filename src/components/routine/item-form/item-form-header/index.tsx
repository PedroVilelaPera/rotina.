import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';

import { Colors } from '../../../../constants/theme';

import { styles } from './styles';

export interface ItemFormHeaderProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSubmitting?: boolean;
}

export function ItemFormHeader({
  title,
  onClose,
  onSave,
  isSubmitting = false,
}: ItemFormHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Título Centralizado em Absoluto para blindagem contra larguras assimétricas dos botões laterais */}
      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar formulário"
        hitSlop={12}
        android_ripple={{ color: Colors.backgroundSelected, borderless: true }}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onClose}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Salvar item"
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
        android_ripple={{ color: Colors.backgroundSelected }}
        style={({ pressed }) => [
          styles.saveButton,
          pressed && !isSubmitting && styles.buttonPressed,
          isSubmitting && styles.saveButtonDisabled,
        ]}
        onPress={onSave}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color={Colors.onAccent} />
        ) : (
          <Text style={styles.saveText}>Salvar</Text>
        )}
      </Pressable>
    </View>
  );
}
