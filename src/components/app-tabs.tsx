import { NativeTabs } from 'expo-router/native-tabs';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const colors = Colors;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Rotina</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="conquistas">
        <NativeTabs.Trigger.Label>Conquistas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="emoji_events" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
