import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
