import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyRoutineState,
  GreetingSection,
  ProgressCard,
  RoutineHeader,
  RoutineItemCard,
} from '../../components/routine';
import { Colors } from '../../constants/theme';
import { useRoutineDaily } from '../../hooks/use-routine-daily';
import type { RoutineItem } from '../../types/routine';

export default function RoutineScreen() {
  const router = useRouter();
  const {
    dailyItems,
    completedIds,
    progress,
    isLoading,
    isRefreshing,
    errorMessage,
    dateExtenso,
    greeting,
    toggleItem,
    refresh,
    silentRefresh,
  } = useRoutineDaily();

  // Atualização silenciosa em background ao retornar de modais (evita piscar o indicador do SwipeRefreshLayout)
  useFocusEffect(
    useCallback(() => {
      void silentRefresh();
    }, [silentRefresh])
  );

  const handlePressAdd = () => {
    router.push('/item-form');
  };

  const handlePressProfile = () => {
    // Será integrado ao redirecionamento para Ajustes/IF06
  };

  const handlePressDetails = (item: RoutineItem) => {
    router.push({ pathname: '/item-form', params: { id: item.id } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Fixo [IF02] */}
      <RoutineHeader
        onPressAdd={handlePressAdd}
        onPressProfile={handlePressProfile}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
            progressBackgroundColor={Colors.backgroundElement}
          />
        }>
        {/* Saudação e Data por Extenso [RF001] */}
        <GreetingSection greeting={greeting} dateExtenso={dateExtenso} />

        {/* Card Progresso de Hoje [RF001] */}
        <ProgressCard
          completedCount={progress.completedCount}
          totalCount={progress.totalCount}
          progressRatio={progress.progressRatio}
          isAllCompleted={progress.isAllCompleted}
        />

        {/* Mensagem de Erro Discreta (caso ocorra) */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Lista Unificada do Dia ou Estado Vazio */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.loadingText}>Carregando sua rotina...</Text>
          </View>
        ) : dailyItems.length === 0 ? (
          <EmptyRoutineState onPressCreate={handlePressAdd} />
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Tarefas e Hábitos</Text>
              <Text style={styles.sectionBadge}>
                {dailyItems.length} {dailyItems.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>

            {dailyItems.map((item) => (
              <RoutineItemCard
                key={item.id}
                item={item}
                isCompleted={completedIds.has(item.id)}
                onToggle={toggleItem}
                onPressDetails={handlePressDetails}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  listContainer: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
