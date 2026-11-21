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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 64,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    bottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    zIndex: 1,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onAccent,
  },
});
