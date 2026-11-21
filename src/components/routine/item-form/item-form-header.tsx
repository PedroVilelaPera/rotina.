import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '../../../constants/theme';

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar formulário"
        hitSlop={12}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onClose}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Salvar item"
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onAccent,
  },
});
