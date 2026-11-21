import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accent,
  },
  badgeSuccess: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSelected,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
});
