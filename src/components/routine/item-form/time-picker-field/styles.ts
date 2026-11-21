import { StyleSheet } from 'react-native';

import { Colors } from '../../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: Colors.accent,
  },
  clearText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputContainerError: {
    borderColor: Colors.danger,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 0,
  },
  formatHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    fontWeight: '500',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  presetChipPressed: {
    opacity: 0.8,
  },
  presetChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  presetChipTextSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
