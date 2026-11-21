import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { Colors } from '../../../../constants/theme';

import { styles } from './styles';

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
