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

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 64,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    bottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    zIndex: 1,
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
