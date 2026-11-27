import { useFocusEffect } from 'expo-router';
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

import { Button, Card } from '@/components/ui';
import { useAchievements } from '@/hooks/use-achievements';
import { tokens } from '@/theme/tokens';
import type { AchievementItem } from '@/types/achievements';

export default function ConquistasScreen() {
  const { data, isLoading, isRefreshing, errorMessage, refresh } = useAchievements();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={tokens.colors.accent.primary}
            colors={[tokens.colors.accent.primary]}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ROTINA, NO SEU RITMO</Text>
          <Text style={styles.title}>Suas Conquistas</Text>
          <Text style={styles.subtitle}>
            Cada pequeno passo também conta.
          </Text>
        </View>

        {isLoading && !data ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={tokens.colors.accent.primary} />
            <Text style={styles.stateText}>Carregando suas conquistas...</Text>
          </View>
        ) : errorMessage ? (
          <Card style={styles.messageCard}>
            <Text accessibilityRole="alert" style={styles.messageTitle}>
              Não foi possível carregar suas conquistas
            </Text>
            <Text style={styles.bodyText}>{errorMessage}</Text>
            <Button
              label="Tentar novamente"
              variant="ghost"
              size="md"
              onPress={() => void refresh()}
              style={styles.retryButton}
            />
          </Card>
        ) : data ? (
          <>
            {data.highlightMilestone ? (
              <View style={styles.section}>
                <SectionHeading>MARCO DE DESTAQUE</SectionHeading>
                <Card variant="elevated" style={styles.highlightCard}>
                  <View style={styles.highlightTopRow}>
                    <View style={styles.medal}>
                      <Text style={styles.medalIcon}>✦</Text>
                    </View>
                    <Text style={styles.badge}>{data.highlightMilestone.badgeLabel}</Text>
                  </View>
                  <Text style={styles.highlightCount}>{data.highlightMilestone.count}</Text>
                  <Text style={styles.highlightHabit}>{data.highlightMilestone.habitTitle}</Text>
                  <Text style={styles.bodyText}>{data.highlightMilestone.supportingText}</Text>
                </Card>
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeading>PEQUENAS VITÓRIAS REAIS</SectionHeading>
              {data.hasAnyCompletions ? (
                <View style={styles.victoryList}>
                  {data.victories.map((victory) => (
                    <VictoryRow key={victory.id} achievement={victory} />
                  ))}
                </View>
              ) : (
                <Card style={styles.messageCard}>
                  <Text style={styles.messageTitle}>Suas conquistas começam com um passo</Text>
                  <Text style={styles.bodyText}>
                    Quando você concluir seus primeiros hábitos ou tarefas, eles aparecerão aqui. Sem pressa: cada dia é uma nova oportunidade.
                  </Text>
                </Card>
              )}
            </View>

            <View style={styles.section}>
              <SectionHeading>PENSAMENTO DO DIA</SectionHeading>
              <Card style={styles.thoughtCard}>
                <Text style={styles.quoteMark}>“</Text>
                <Text style={styles.thoughtText}>{data.thoughtOfTheDay.quote}</Text>
                <Text style={styles.thoughtAuthor}>— {data.thoughtOfTheDay.author}</Text>
              </Card>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

function VictoryRow({ achievement }: { achievement: AchievementItem }) {
  return (
    <Card style={styles.victoryCard}>
      <View style={styles.victoryIcon}>
        <Text style={styles.victoryIconText}>{getVictoryIcon(achievement.type)}</Text>
      </View>
      <View style={styles.victoryCopy}>
        <Text style={styles.victoryTitle}>{achievement.title}</Text>
        <Text style={styles.bodyText}>{achievement.description}</Text>
      </View>
      <Text style={styles.victoryCount}>{achievement.count}</Text>
    </Card>
  );
}

function getVictoryIcon(type: AchievementItem['type']): string {
  switch (type) {
    case 'streak':
      return '↗';
    case 'habit':
      return '✓';
    case 'tasks':
      return '•';
    case 'punctuality':
      return '◷';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.bg.root,
  },
  content: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.xl,
    paddingBottom: 40,
    gap: tokens.spacing.xxl,
  },
  header: {
    gap: tokens.spacing.xs,
  },
  eyebrow: {
    color: tokens.colors.accent.primary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  title: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
  },
  section: {
    gap: tokens.spacing.md,
  },
  sectionHeading: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  highlightCard: {
    gap: tokens.spacing.sm,
  },
  highlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medal: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.bg.root,
  },
  medalIcon: {
    color: tokens.colors.accent.primary,
    fontSize: 22,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.bg.root,
    color: tokens.colors.accent.primary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 12,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  highlightCount: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.fonts.bold,
    fontSize: 42,
    lineHeight: 48,
    marginTop: tokens.spacing.sm,
  },
  highlightHabit: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 18,
  },
  bodyText: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  victoryList: {
    gap: tokens.spacing.sm,
  },
  victoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  victoryIcon: {
    width: 38,
    height: 38,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.bg.elevated,
  },
  victoryIconText: {
    color: tokens.colors.accent.primary,
    fontFamily: tokens.fonts.bold,
    fontSize: 18,
  },
  victoryCopy: {
    flex: 1,
    gap: 3,
  },
  victoryTitle: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 14,
  },
  victoryCount: {
    color: tokens.colors.accent.primary,
    fontFamily: tokens.fonts.bold,
    fontSize: 18,
  },
  thoughtCard: {
    gap: tokens.spacing.sm,
  },
  quoteMark: {
    color: tokens.colors.accent.primary,
    fontFamily: tokens.fonts.bold,
    fontSize: 34,
    height: 30,
  },
  thoughtText: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.fonts.medium,
    fontSize: 16,
    lineHeight: 25,
  },
  thoughtAuthor: {
    alignSelf: 'flex-end',
    color: tokens.colors.text.secondary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 12,
  },
  stateContainer: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.md,
  },
  stateText: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
  },
  messageCard: {
    gap: tokens.spacing.sm,
  },
  messageTitle: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.fonts.semiBold,
    fontSize: 16,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: tokens.spacing.xs,
  },
});
