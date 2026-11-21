import { StyleSheet } from 'react-native';

import { Colors } from '../../../../constants/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSelected,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: Colors.border,
    transform: [{ scale: 0.96 }],
  },
  stepButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  timeDisplay: {
    flex: 1.4,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1,
  },
});
