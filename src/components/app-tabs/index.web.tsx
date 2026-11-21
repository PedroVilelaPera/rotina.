import React from 'react';
import { Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';

import { styles } from './styles';

export default function AppTabs() {
  const colors = Colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Rotina' }} />
      <Tabs.Screen name="conquistas" options={{ title: 'Conquistas' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
