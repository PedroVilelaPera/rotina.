import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, type Href, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '../constants/theme';
import { AuthProvider } from '../contexts/auth-context';
import { useAuth } from '../hooks/use-auth';
import { setReminderSyncHandler } from '../hooks/use-reminder-sync';
import { configureNotifications } from '../services/notifications/configure';
import {
  cancelAllReminders,
  cancelHabitReminder,
  scheduleHabitReminder,
} from '../services/notifications/schedule-habit-reminder';

setReminderSyncHandler({
  scheduleHabitReminder,
  cancelHabitReminder,
  cancelAllReminders,
});

void SplashScreen.preventAutoHideAsync();

// Aplica imediatamente no nível da janela nativa do SO antes de qualquer ciclo de renderização
void SystemUI.setBackgroundColorAsync(Colors.background);

// Configura o tema escuro estrito eliminando fallbacks claros da navegação
const appDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.backgroundElement,
    border: Colors.border,
    text: Colors.text,
    primary: Colors.accent,
    notification: Colors.accent,
  },
};

function RootNavigator() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured || loading) {
      return;
    }

    const inLoginRoute = (segments[0] as string) === 'login';
    if (!user && !inLoginRoute) {
      router.replace('/login' as Href);
    } else if (user && inLoginRoute) {
      router.replace('/(tabs)');
    }
  }, [isFirebaseConfigured, loading, user, segments, router]);

  useEffect(() => {
    void configureNotifications();

    function openNotificationTarget(response: Notifications.NotificationResponse) {
      const itemId = response.notification.request.content.data?.itemId;

      if (typeof itemId === 'string') {
        router.push({
          pathname: '/item-details',
          params: { id: itemId },
        });
      } else {
        router.push('/');
      }

      void Notifications.clearLastNotificationResponseAsync();
    }

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      openNotificationTarget(lastResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotificationTarget);
    return () => subscription.remove();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_bottom',
      }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          animation: 'fade',
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="item-form"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen
        name="item-details"
        options={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    // Garante sincronização contínua com a janela nativa do SO (Android/iOS)
    void SystemUI.setBackgroundColorAsync(Colors.background);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <ThemeProvider value={appDarkTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
