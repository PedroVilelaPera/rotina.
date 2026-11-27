import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { tokens } from '@/theme/tokens';

export interface AppAlertButton {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void | Promise<void>;
}

interface AlertRequest {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  onDismiss?: () => void;
}

interface AlertContextValue {
  showAlert: (title: string, message?: string, buttons?: AppAlertButton[], onDismiss?: () => void) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAppAlert(): AlertContextValue {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAppAlert deve ser usado dentro de AlertProvider.');
  return context;
}

export function AlertProvider({ children }: React.PropsWithChildren) {
  const [request, setRequest] = useState<AlertRequest | null>(null);
  const showAlert = useCallback<AlertContextValue['showAlert']>((title, message, buttons, onDismiss) => {
    setRequest({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }], onDismiss });
  }, []);

  const close = () => {
    const dismiss = request?.onDismiss;
    setRequest(null);
    dismiss?.();
  };

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal transparent visible={Boolean(request)} animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.accent} />
            <Text style={styles.title}>{request?.title}</Text>
            {request?.message ? <Text style={styles.message}>{request.message}</Text> : null}
            <View style={styles.actions}>
              {request?.buttons.map((button, index) => (
                <Button
                  key={`${button.text}-${index}`}
                  label={button.text}
                  size="md"
                  variant={button.style === 'destructive' ? 'danger' : index === request.buttons.length - 1 ? 'primary' : 'secondary'}
                  style={styles.action}
                  onPress={() => {
                    setRequest(null);
                    void button.onPress?.();
                  }}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.spacing.xl, backgroundColor: 'rgba(0,0,0,0.72)' },
  dialog: { width: '100%', maxWidth: 420, padding: tokens.spacing.xl, borderRadius: tokens.radii.lg, backgroundColor: tokens.colors.bg.elevated, borderWidth: 1, borderColor: tokens.colors.border.subtle, gap: tokens.spacing.md },
  accent: { width: 36, height: 4, borderRadius: tokens.radii.full, backgroundColor: tokens.colors.accent.primary },
  title: { color: tokens.colors.text.primary, fontFamily: tokens.fonts.bold, fontSize: 19, lineHeight: 26 },
  message: { color: tokens.colors.text.secondary, fontFamily: tokens.fonts.regular, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: tokens.spacing.sm, marginTop: tokens.spacing.sm },
  action: { minWidth: 96 },
});
