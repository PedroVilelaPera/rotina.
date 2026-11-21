import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/theme';

export const styles = StyleSheet.create({
  swipeableContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: Colors.backgroundElement,
    overflow: 'hidden',
  },
  childrenContainer: {
    borderRadius: 14,
    backgroundColor: Colors.backgroundElement,
    overflow: 'hidden',
  },
  swipeAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  swipeActionLeft: {
    justifyContent: 'flex-start',
  },
  swipeActionRight: {
    justifyContent: 'flex-end',
  },
  swipeActionComplete: {
    backgroundColor: Colors.accent,
  },
  swipeActionUndo: {
    backgroundColor: Colors.backgroundSelected,
  },
  swipeActionIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 6,
  },
  swipeActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  cardCompleted: {
    opacity: 0.75,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    backgroundColor: 'transparent',
  },
  editButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.6,
  },
  gearFallback: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxUnchecked: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  checkboxPressed: {
    transform: [{ scale: 0.92 }],
  },
  checkmarkIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onAccent,
    marginTop: -1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 22,
  },
  titleCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  badgeMuted: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMutedText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  badgeCategory: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
