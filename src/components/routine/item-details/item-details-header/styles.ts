import { StyleSheet } from 'react-native';

import { Colors } from '../../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 56,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: Colors.backgroundSelected,
    transform: [{ scale: 0.94 }],
  },
  backIcon: {
    fontSize: 26,
    fontWeight: '400',
    color: Colors.text,
    marginTop: -4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  logoDot: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.accent,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  editButtonPressed: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  profileIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
