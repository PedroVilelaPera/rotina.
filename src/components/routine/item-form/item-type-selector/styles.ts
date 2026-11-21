import { StyleSheet } from 'react-native';

import { Colors } from '../../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.text,
  },
});
