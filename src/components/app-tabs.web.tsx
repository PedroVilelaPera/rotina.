import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const colors = Colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Rotina' }} />
      <Tabs.Screen name="conquistas" options={{ title: 'Conquistas' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
