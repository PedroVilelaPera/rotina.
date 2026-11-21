import React from 'react';
import { Text, View } from 'react-native';

import { styles } from './styles';

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
