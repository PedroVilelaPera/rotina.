import { SymbolView } from 'expo-symbols';
import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { Colors } from '../../constants/theme';
import type { RoutineItem } from '../../types/routine';

export interface RoutineItemCardProps {
  item: RoutineItem;
  isCompleted: boolean;
  onToggle: (item: RoutineItem) => void;
  onPressDetails?: (item: RoutineItem) => void;
  onPressEdit?: (item: RoutineItem) => void;
}

interface SwipeActionProps {
  isCompleted: boolean;
  side: 'left' | 'right';
  progress: SharedValue<number>;
}

function SwipeAction({ isCompleted, side, progress }: SwipeActionProps) {
  // Oculta a camada de fundo quando o card estiver fechado em repouso (evita vazamento em bordas arredondadas)
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0.05 ? 1 : 0,
  }));

  return (
    <Animated.View
      style={[
        styles.swipeAction,
        side === 'left' ? styles.swipeActionLeft : styles.swipeActionRight,
        isCompleted ? styles.swipeActionUndo : styles.swipeActionComplete,
        animatedStyle,
      ]}>
      <Text style={styles.swipeActionIcon}>{isCompleted ? '↺' : '✓'}</Text>
      <Text style={styles.swipeActionText}>
        {isCompleted ? 'Desfazer' : 'Concluir'}
      </Text>
    </Animated.View>
  );
}

export function RoutineItemCard({
  item,
  isCompleted,
  onToggle,
  onPressDetails,
  onPressEdit,
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

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      containerStyle={styles.swipeableContainer}
      childrenContainerStyle={styles.childrenContainer}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={(progress) => (
        <SwipeAction isCompleted={isCompleted} side="left" progress={progress} />
      )}
      renderRightActions={(progress) => (
        <SwipeAction isCompleted={isCompleted} side="right" progress={progress} />
      )}
      onSwipeableOpen={handleSwipeTrigger}>
      <View
        accessibilityRole="none"
        style={[
          styles.card,
          isCompleted && styles.cardCompleted,
        ]}>
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

        {/* Conteúdo Central: Toque no corpo do card abre IF04 [Critérios de Aceite] */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes de ${item.title}`}
          android_ripple={{ color: Colors.backgroundSelected, borderless: false }}
          style={styles.content}
          onPress={() => onPressDetails?.(item)}>
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
        </Pressable>

        {/* Botão de Engrenagem Dedicado para Edição IF03 [Critérios de Aceite] */}
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${item.title}`}
          android_ripple={{ color: Colors.backgroundSelected, borderless: true }}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}
          onPress={() => (onPressEdit ? onPressEdit(item) : onPressDetails?.(item))}>
          <SymbolView
            name={{
              ios: 'gearshape',
              android: 'settings',
              web: 'settings',
            }}
            size={18}
            tintColor={Colors.textSecondary}
            fallback={<Text style={styles.gearFallback}>⚙</Text>}
          />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
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


