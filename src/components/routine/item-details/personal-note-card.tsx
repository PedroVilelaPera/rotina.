import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '../../../constants/theme';

export interface PersonalNoteCardProps {
  note: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
}

export function PersonalNoteCard({
  note,
  onChangeText,
  maxLength = 280,
}: PersonalNoteCardProps) {
  const currentLength = note.length;
  const isOverLimit = currentLength > maxLength;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Nota Pessoal</Text>
        <Text
          style={[
            styles.counter,
            isOverLimit && styles.counterOverLimit,
          ]}>
          {currentLength}/{maxLength}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        value={note}
        onChangeText={onChangeText}
        placeholder="Adicione reflexões, metas ou contexto pessoal..."
        placeholderTextColor={Colors.textSecondary}
        multiline
        numberOfLines={4}
        maxLength={maxLength}
        textAlignVertical="top"
        accessibilityLabel="Nota pessoal do item"
      />
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
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counter: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  counterOverLimit: {
    color: Colors.danger,
    fontWeight: '700',
  },
  input: {
    minHeight: 110,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
