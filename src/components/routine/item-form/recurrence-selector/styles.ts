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
  kindSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  kindOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  kindOptionSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  kindOptionPressed: {
    opacity: 0.8,
  },
  kindText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kindTextSelected: {
    color: Colors.text,
  },
  weeklyContainer: {
    marginTop: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 46,
    borderRadius: 23,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  dayChipPressed: {
    opacity: 0.8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.accent,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    justifyContent: 'center',
  },
  presetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  presetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    fontWeight: '500',
  },
});
