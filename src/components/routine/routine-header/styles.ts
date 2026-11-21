import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  logoDot: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  addIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.onAccent,
    marginTop: -2,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonPressed: {
    backgroundColor: Colors.backgroundSelected,
  },
  profileText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
