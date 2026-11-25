import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '../constants/theme';
import { AuthProvider } from '../contexts/auth-context';

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

export default function RootLayout() {
  useEffect(() => {
    // Garante sincronização contínua com a janela nativa do SO (Android/iOS)
    void SystemUI.setBackgroundColorAsync(Colors.background);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <ThemeProvider value={appDarkTheme}>
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
