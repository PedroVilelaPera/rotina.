import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DurationPicker,
  ItemFormHeader,
  ItemTypeSelector,
  RecurrenceSelector,
  TimePickerField,
} from '../components/routine';
import { Colors } from '../constants/theme';
import { useItemForm } from '../hooks/use-item-form';
import type { ItemType } from '../types/routine';

const CATEGORY_SUGGESTIONS = ['Saúde', 'Foco', 'Trabalho', 'Estudos', 'Pessoal'];

export default function ItemFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; initialType?: string }>();

  const itemId = typeof params.id === 'string' ? params.id : undefined;
  const initialType =
    params.initialType === 'habit' || params.initialType === 'task'
      ? (params.initialType as ItemType)
      : 'task';

  const {
    type,
    title,
    category,
    scheduledTime,
    durationMinutes,
    recurrenceKind,
    daysOfWeek,
    targetDate,
    note,
    isLoading,
    isSubmitting,
    isEditing,
    errors,
    generalError,
    setType,
    setTitle,
    setCategory,
    setScheduledTime,
    setDurationMinutes,
    setRecurrenceKind,
    toggleDayOfWeek,
    setDaysOfWeek,
    setNote,
    submit,
  } = useItemForm({
    itemId,
    initialType,
    onSuccess: () => {
      router.back();
    },
  });

  const screenTitle = isEditing
    ? type === 'habit'
      ? 'Editar Hábito'
      : 'Editar Tarefa'
    : type === 'habit'
      ? 'Novo Hábito'
      : 'Nova Tarefa';

  const submitButtonLabel = isSubmitting
    ? 'Salvando...'
    : isEditing
      ? 'Salvar alterações'
      : type === 'habit'
        ? 'Criar hábito'
        : 'Criar tarefa';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ItemFormHeader
        title={screenTitle}
        onClose={() => router.back()}
        onSave={() => void submit()}
        isSubmitting={isSubmitting}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.loadingText}>Carregando dados do item...</Text>
            </View>
          ) : (
            <>
              {/* Erro Geral (se houver) */}
              {generalError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{generalError}</Text>
                </View>
              )}

              {/* Modo de criação: seletor de tipo | Modo de edição: badge contextual explícito [IF03] */}
              {isEditing ? (
                <View
                  style={styles.editingContextBadge}
                  accessibilityRole="text"
                  accessibilityLabel={`Editando ${type === 'habit' ? 'Hábito recorrente' : 'Tarefa do dia'}`}>
                  <View style={styles.badgeIndicator} />
                  <Text style={styles.editingContextText}>
                    {type === 'habit' ? 'Hábito recorrente' : 'Tarefa do dia'}
                  </Text>
                  <Text style={styles.editingContextSub}>
                    (Tipo fixo para histórico)
                  </Text>
                </View>
              ) : (
                <ItemTypeSelector
                  value={type}
                  onChange={setType}
                />
              )}

              {/* Campo Título (Obrigatório, 1-80 caracteres) [Gestao da Rotina.RF002, RF003] */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Título <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <Text
                    style={[
                      styles.counterText,
                      title.length > 80 && styles.counterTextError,
                    ]}>
                    {title.length}/80
                  </Text>
                </View>

                <TextInput
                  accessibilityLabel="Título do item"
                  placeholder={
                    type === 'habit'
                      ? 'Ex.: Meditar por 15 minutos'
                      : 'Ex.: Entregar declaração de imposto'
                  }
                  placeholderTextColor={Colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                  style={[
                    styles.textInput,
                    Boolean(errors.title) && styles.inputError,
                  ]}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>

              {/* Campo Categoria (Opcional) */}
              <View style={styles.section}>
                <Text style={styles.label}>Categoria (opcional)</Text>
                <TextInput
                  accessibilityLabel="Categoria opcional"
                  placeholder="Ex.: Saúde, Trabalho, Foco, Estudos"
                  placeholderTextColor={Colors.textSecondary}
                  value={category}
                  onChangeText={setCategory}
                  maxLength={40}
                  style={styles.textInput}
                />
                {/* Sugestões rápidas de categoria */}
                <View style={styles.suggestionsRow}>
                  {CATEGORY_SUGGESTIONS.map((sug) => (
                    <Pressable
                      key={sug}
                      accessibilityRole="button"
                      accessibilityLabel={`Categoria rápida: ${sug}`}
                      style={({ pressed }) => [
                        styles.suggestionChip,
                        category === sug && styles.suggestionChipSelected,
                        pressed && styles.suggestionChipPressed,
                      ]}
                      onPress={() => setCategory(category === sug ? '' : sug)}>
                      <Text
                        style={[
                          styles.suggestionText,
                          category === sug && styles.suggestionTextSelected,
                        ]}>
                        {sug}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Campos específicos: Hábito vs Tarefa */}
              {type === 'habit' ? (
                <>
                  {/* Horário de Início (Obrigatório para hábito) [RF003] */}
                  <TimePickerField
                    label="Horário de início"
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    isRequired={true}
                    errorMessage={errors.scheduledTime}
                  />

                  {/* Duração Planejada (15m / 30m / 45m / 1h) [RF003] */}
                  <DurationPicker
                    label="Duração planejada"
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                  />

                  {/* Recorrência (Diário ou Semanal com >= 1 dia) [RF003] */}
                  <RecurrenceSelector
                    kind={recurrenceKind}
                    daysOfWeek={daysOfWeek}
                    onKindChange={setRecurrenceKind}
                    onToggleDay={toggleDayOfWeek}
                    onSetDays={setDaysOfWeek}
                    errorMessage={errors.recurrence}
                  />
                </>
              ) : (
                <>
                  {/* Data Alvo da Tarefa (Padrão: Hoje) [RF002] */}
                  <View style={styles.targetDateBanner}>
                    <Text style={styles.targetDateIcon}>📅</Text>
                    <View style={styles.targetDateTexts}>
                      <Text style={styles.targetDateTitle}>Programada para</Text>
                      <Text style={styles.targetDateSubtitle}>
                        Hoje ({targetDate})
                      </Text>
                    </View>
                  </View>

                  {/* Horário Opcional para Tarefa [RF002] */}
                  <TimePickerField
                    label="Horário planejado (opcional)"
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    isRequired={false}
                    errorMessage={errors.scheduledTime}
                  />

                  {/* Duração Estimada Opcional para Tarefa [RF002] */}
                  <DurationPicker
                    label="Duração estimada"
                    value={durationMinutes}
                    onChange={setDurationMinutes}
                  />
                </>
              )}

              {/* Campo Nota Pessoal (Opcional, até 280 caracteres) [IF03] */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Nota pessoal (opcional)</Text>
                  <Text
                    style={[
                      styles.counterText,
                      note.length > 280 && styles.counterTextError,
                    ]}>
                    {note.length}/280
                  </Text>
                </View>

                <TextInput
                  accessibilityLabel="Nota pessoal opcional"
                  placeholder="Adicione um contexto pessoal ou lembrete de incentivo..."
                  placeholderTextColor={Colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                  maxLength={280}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[
                    styles.textArea,
                    Boolean(errors.note) && styles.inputError,
                  ]}
                />
                {errors.note && (
                  <Text style={styles.errorText}>{errors.note}</Text>
                )}
              </View>

              {/* Botão Largo de Ação Principal */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={submitButtonLabel}
                accessibilityState={{ disabled: isSubmitting }}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !isSubmitting && styles.submitButtonPressed,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={() => void submit()}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.onAccent} />
                ) : (
                  <Text style={styles.submitButtonText}>{submitButtonLabel}</Text>
                )}
              </Pressable>
            </>
          )}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
  },
  editingContextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundElement,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  badgeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  editingContextText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  editingContextSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  section: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: Colors.accent,
  },
  counterText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  counterTextError: {
    color: Colors.danger,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 110,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    fontWeight: '500',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionChipSelected: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
  },
  suggestionChipPressed: {
    opacity: 0.8,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  suggestionTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  targetDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  targetDateIcon: {
    fontSize: 20,
  },
  targetDateTexts: {
    flex: 1,
  },
  targetDateTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetDateSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onAccent,
  },
});
