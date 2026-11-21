import { StyleSheet } from 'react-native';

import { Colors } from '../../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.accent,
  },
});
