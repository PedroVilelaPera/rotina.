import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DurationPicker,
  ItemDetailsHeader,
  PersonalNoteCard,
  TimeStepperCard,
} from '../components/routine';
import { Colors } from '../constants/theme';
import { useAuth } from '../hooks/use-auth';
import { useReminderSync } from '../hooks/use-reminder-sync';
import { getRoutineRepository } from '../services/routine-service';
import type {
  DurationMinutes,
  LocalTimeString,
  RoutineItem,
} from '../types/routine';
import {
  adjustTimeBy15Minutes,
  formatRecurrenceBadge,
  getTodayLocalDateString,
} from '../utils/routine-daily';

export default function ItemDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = typeof params.id === 'string' ? params.id : undefined;

  const repository = getRoutineRepository();
  const { userId: authUserId } = useAuth();
  const userId = authUserId ?? 'current-user';
  const todayDate = getTodayLocalDateString();
  const { syncHabitReminder, cancelHabitReminder } = useReminderSync();

  const [item, setItem] = useState<RoutineItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(itemId));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [isCompletedToday, setIsCompletedToday] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    itemId ? null : 'Identificador do item não informado.'
  );

  // Estados dos micro-ajustes editáveis na IF04
  const [scheduledTime, setScheduledTime] = useState<LocalTimeString | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(30);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (!itemId) {
      return;
    }

    let isMounted = true;

    async function loadItemData() {
      try {
        const [fetchedItem, completion] = await Promise.all([
          repository.getItem(userId, itemId as string),
          repository.getCompletion(userId, itemId as string, todayDate),
        ]);

        if (isMounted) {
          if (!fetchedItem) {
            setErrorMessage('Item não encontrado ou arquivado.');
          } else {
            setItem(fetchedItem);
            setScheduledTime(fetchedItem.scheduledTime);
            setDurationMinutes(fetchedItem.durationMinutes);
            setNote(fetchedItem.note ?? '');
            setIsCompletedToday(Boolean(completion));
            setErrorMessage(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar detalhes do item.';
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadItemData();

    return () => {
      isMounted = false;
    };
  }, [itemId, repository, userId, todayDate]);

  // Recarrega silenciosamente se o usuário editar o item na IF03 e voltar
  useFocusEffect(
    useCallback(() => {
      if (!itemId) {
        return;
      }

      let isMounted = true;

      async function reloadItemData() {
        try {
          const [fetchedItem, completion] = await Promise.all([
            repository.getItem(userId, itemId as string),
            repository.getCompletion(userId, itemId as string, todayDate),
          ]);

          if (isMounted && fetchedItem) {
            setItem(fetchedItem);
            setScheduledTime(fetchedItem.scheduledTime);
            setDurationMinutes(fetchedItem.durationMinutes);
            setNote(fetchedItem.note ?? '');
            setIsCompletedToday(Boolean(completion));
          }
        } catch {
          // Fallback silencioso ao retornar o foco
        }
      }

      void reloadItemData();

      return () => {
        isMounted = false;
      };
    }, [itemId, repository, userId, todayDate])
  );

  // Micro-ajuste rápido de horário (-15m / +15m) com wrap 00:00 - 23:45 [IF04, RF004]
  const handleAdjustTime = (delta: 15 | -15) => {
    setScheduledTime((prev) => adjustTimeBy15Minutes(prev, delta));
  };

  // Salvar ajustes rápidos e retornar à IF02 [IF04, RF004]
  const handleSave = async () => {
    if (!item || !itemId) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const cleanNote = note.trim() ? note.trim() : null;
      const updated = await repository.updateItem(userId, itemId, {
        scheduledTime,
        durationMinutes,
        note: cleanNote,
      });

      // Se for hábito e horário foi atualizado, sincroniza lembrete local [RF001, RF004]
      if (updated.type === 'habit') {
        try {
          await syncHabitReminder(updated);
        } catch {
          // Falha em notificação não bloqueia persistência
        }
      }

      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar alterações.';
      setErrorMessage(msg);
      setIsSaving(false);
    }
  };

  // Abrir tela de edição completa IF03 [RF004]
  const handlePressEdit = () => {
    if (!item) return;
    router.push({ pathname: '/item-form', params: { id: item.id } });
  };

  // Concluir ou desfazer conclusão hoje [RF005]
  const handleToggleCompleteToday = async () => {
    if (!item) return;

    setIsToggling(true);
    const wasCompleted = isCompletedToday;
    setIsCompletedToday(!wasCompleted);

    try {
      await repository.toggleCompletion(
        userId,
        {
          id: item.id,
          type: item.type,
          scheduledTime: item.scheduledTime,
        },
        todayDate
      );
    } catch (err) {
      // Rollback se falhar
      setIsCompletedToday(wasCompleted);
      const msg = err instanceof Error ? err.message : 'Falha ao alternar conclusão.';
      Alert.alert('Erro', msg);
    } finally {
      setIsToggling(false);
    }
  };

  // Exclusão lógica (arquivamento) preservando histórico de conquistas [RF006]
  const handleArchive = async () => {
    if (!item || !itemId || isArchiving) return;

    setIsArchiving(true);
    setErrorMessage(null);

    try {
      // 1. Atualiza isActive = false no Firestore mantendo intactos os documentos em completions [RF006]
      await repository.archiveItem(userId, itemId);

      // 2. Cancela notificações locais do item se for hábito (integração com Frente 3) [RF006]
      if (item.type === 'habit') {
        try {
          await cancelHabitReminder(itemId);
        } catch {
          // Falha em notificação não bloqueia a exclusão lógica
        }
      }

      // 3. Retorna à IF02
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir item da rotina.';
      setErrorMessage(msg);
      setIsArchiving(false);
      Alert.alert('Erro', msg);
    }
  };

  // Diálogo de confirmação antes de arquivar [RF006, IF04]
  const handleConfirmArchive = () => {
    if (isArchiving || !item) return;

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm(
              'Tem certeza de que deseja remover este item da sua rotina? Seu histórico de conquistas continuará salvo.'
            )
          : true;
      if (confirmed) {
        void handleArchive();
      }
    } else {
      Alert.alert(
        'Excluir da rotina',
        'Tem certeza de que deseja remover este item da sua rotina? Seu histórico de conquistas continuará salvo.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => {
              void handleArchive();
            },
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.loadingText}>Carregando detalhes do item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item || errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {errorMessage ?? 'Item não encontrado.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.backSimpleButton}
            onPress={() => router.back()}>
            <Text style={styles.backSimpleText}>Voltar para a rotina</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const recurrenceLabel = formatRecurrenceBadge(item);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header [IF04] */}
      <ItemDetailsHeader
        itemType={item.type}
        onPressBack={() => router.back()}
        onPressEdit={handlePressEdit}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Categoria e Badge de Frequência */}
          <View style={styles.badgeRow}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}

            <View style={styles.recurrenceBadge}>
              <Text style={styles.recurrenceBadgeText}>{recurrenceLabel}</Text>
            </View>
          </View>

          {/* Título em Destaque */}
          <Text style={styles.titleText}>{item.title}</Text>

          {/* Grade de Agendamento: Card Início (-15m/+15m com wrap) [IF04, RF004] */}
          <TimeStepperCard
            scheduledTime={scheduledTime}
            onAdjust={handleAdjustTime}
          />

          {/* Grade de Agendamento: Card Duração (15m/30m/45m/1h) [IF04, RF004] */}
          <View style={styles.durationCard}>
            <DurationPicker
              value={durationMinutes}
              onChange={setDurationMinutes}
              label="Duração"
            />
          </View>

          {/* Card Nota Pessoal editável (v1 sem IA) [IF04] */}
          <PersonalNoteCard
            note={note}
            onChangeText={setNote}
          />

          {/* Botão Largo Terracota com Check para Salvar Ajustes [IF04, RF004] */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar ajustes do item"
            disabled={isSaving || isArchiving}
            android_ripple={{ color: Colors.backgroundSelected, borderless: false }}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              (isSaving || isArchiving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}>
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.onAccent} />
            ) : (
              <View style={styles.saveContentRow}>
                <Text style={styles.saveCheckIcon}>✓</Text>
                <Text style={styles.saveButtonText}>Salvar ajustes</Text>
              </View>
            )}
          </Pressable>

          {/* Barra Inferior com Concluir Hoje e Excluir da rotina [IF04, RF005, RF006] */}
          <View style={styles.bottomActionsBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isCompletedToday ? 'Desfazer conclusão de hoje' : 'Concluir hoje'
              }
              disabled={isToggling || isArchiving}
              style={({ pressed }) => [
                styles.completeTodayButton,
                isCompletedToday && styles.completeTodayButtonActive,
                pressed && styles.completeTodayButtonPressed,
              ]}
              onPress={handleToggleCompleteToday}>
              <Text
                style={[
                  styles.completeTodayText,
                  isCompletedToday && styles.completeTodayTextActive,
                ]}>
                {isCompletedToday ? 'Concluído hoje ✓' : 'Concluir hoje'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir item da rotina"
              disabled={isArchiving || isToggling || isSaving}
              android_ripple={{ color: Colors.backgroundSelected, borderless: false }}
              style={({ pressed }) => [
                styles.archiveButton,
                pressed && styles.archiveButtonPressed,
                isArchiving && styles.archiveButtonDisabled,
              ]}
              onPress={handleConfirmArchive}>
              {isArchiving ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <Text style={styles.archiveButtonText}>Excluir da rotina</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: Colors.danger,
    textAlign: 'center',
  },
  backSimpleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  backSimpleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  recurrenceBadge: {
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recurrenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 20,
  },
  durationCard: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveCheckIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onAccent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onAccent,
  },
  bottomActionsBar: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  completeTodayButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTodayButtonActive: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  completeTodayButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  completeTodayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  completeTodayTextActive: {
    color: Colors.accent,
  },
  archiveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveButtonPressed: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.danger,
    transform: [{ scale: 0.98 }],
  },
  archiveButtonDisabled: {
    opacity: 0.6,
  },
  archiveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
});
