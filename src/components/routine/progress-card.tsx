import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/theme';

export interface ProgressCardProps {
  completedCount: number;
  totalCount: number;
  progressRatio: number;
  isAllCompleted: boolean;
}

export function ProgressCard({
  completedCount,
  totalCount,
  progressRatio,
  isAllCompleted,
}: ProgressCardProps) {
  const percentage = Math.round(progressRatio * 100);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Progresso de Hoje</Text>
          <Text style={styles.subtitle}>
            {totalCount === 0
              ? 'Nenhum item agendado'
              : `${completedCount} de ${totalCount} concluídas`}
          </Text>
        </View>

        {isAllCompleted && totalCount > 0 ? (
          <View style={styles.badgeSuccess}>
            <Text style={styles.badgeSuccessText}>Tudo pronto ✓</Text>
          </View>
        ) : (
          <Text style={styles.percentageText}>{percentage}%</Text>
        )}
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(Math.max(percentage, 0), 100)}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accent,
  },
  badgeSuccess: {
    backgroundColor: Colors.backgroundSelected,
    borderColor: Colors.accent,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSelected,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
});
