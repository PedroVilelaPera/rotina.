import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Colors } from '../../constants/theme';
import type { RoutineItem } from '../../types/routine';

export interface RoutineItemCardProps {
  item: RoutineItem;
  isCompleted: boolean;
  onToggle: (item: RoutineItem) => void;
  onPressDetails?: (item: RoutineItem) => void;
}

export function RoutineItemCard({
  item,
  isCompleted,
  onToggle,
  onPressDetails,
}: RoutineItemCardProps) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const handleSwipeTrigger = () => {
    // Fecha o painel de swipe imediatamente
    swipeableRef.current?.close();

    // Feedback tátil leve [IF02, Usabilidade.NF002]
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(10);
      } catch {
        // Fallback silencioso se vibração não estiver disponível no dispositivo
      }
    }

    // Alternância de conclusão sem pop-up bloqueante [NF002, RF005]
    onToggle(item);
  };

  const renderSwipeAction = (side: 'left' | 'right') => {
    return (
      <View
        style={[
          styles.swipeAction,
          side === 'left' ? styles.swipeActionLeft : styles.swipeActionRight,
          isCompleted ? styles.swipeActionUndo : styles.swipeActionComplete,
        ]}>
        <Text style={styles.swipeActionIcon}>{isCompleted ? '↺' : '✓'}</Text>
        <Text style={styles.swipeActionText}>
          {isCompleted ? 'Desfazer' : 'Concluir'}
        </Text>
      </View>
    );
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      containerStyle={styles.swipeableContainer}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => renderSwipeAction('left')}
      renderRightActions={() => renderSwipeAction('right')}
      onSwipeableOpen={handleSwipeTrigger}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Item: ${item.title}. Status: ${isCompleted ? 'Concluído' : 'Pendente'}`}
        style={({ pressed }) => [
          styles.card,
          isCompleted && styles.cardCompleted,
          pressed && styles.cardPressed,
        ]}
        onPress={() => onPressDetails?.(item)}>
        {/* Checkbox de 1 toque [Usabilidade.NF002, Gestao da Rotina.RF005] */}
        <Pressable
          hitSlop={12}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={`Marcar ${item.title}`}
          style={({ pressed }) => [
            styles.checkbox,
            isCompleted ? styles.checkboxChecked : styles.checkboxUnchecked,
            pressed && styles.checkboxPressed,
          ]}
          onPress={() => onToggle(item)}>
          {isCompleted && <Text style={styles.checkmarkIcon}>✓</Text>}
        </Pressable>

        {/* Conteúdo Central */}
        <View style={styles.content}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
            ]}>
            {item.title}
          </Text>

          {/* Metadados / Badges */}
          <View style={styles.metaRow}>
            {item.scheduledTime && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.scheduledTime}</Text>
              </View>
            )}

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.durationMinutes}m</Text>
            </View>

            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>
                {item.type === 'habit' ? 'Hábito' : 'Tarefa'}
              </Text>
            </View>

            {item.category && (
              <View style={styles.badgeCategory}>
                <Text style={styles.badgeCategoryText}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
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
  },
  cardCompleted: {
    opacity: 0.75,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundSelected,
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

