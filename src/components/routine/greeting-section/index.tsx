import React from 'react';
import { Text, View } from 'react-native';

import { styles } from './styles';

export interface GreetingSectionProps {
  greeting: string;
  dateExtenso: string;
}

export function GreetingSection({ greeting, dateExtenso }: GreetingSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.greetingText}>{greeting}</Text>
      <Text style={styles.dateText}>{dateExtenso}</Text>
    </View>
  );
}
