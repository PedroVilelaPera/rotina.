import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { convertGuestAccountWithEmail } from '@/services/auth-service';
import { tokens } from '@/theme/tokens';
import { mapGuestConversionError, validateAuthForm } from '@/utils/auth-validation';

export default function AjustesScreen() {
  const { user, email, isAnonymous, isFirebaseConfigured, refreshAuthUser } = useAuth();

  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleLinkAccount = async () => {
    if (isConverting) {
      return;
    }

    setConversionError(null);
    setConversionSuccess(null);

    const validation = validateAuthForm(linkEmail, linkPassword);
    setLinkEmail(validation.normalizedEmail);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);

    if (!validation.valid) {
      return;
    }

    setIsConverting(true);
    try {
      await convertGuestAccountWithEmail(validation.normalizedEmail, linkPassword);
      await refreshAuthUser();
      setIsLinkingOpen(false);
      setLinkPassword('');
      setConversionSuccess('Conta vinculada com sucesso. Seus hábitos e tarefas foram preservados.');
    } catch (error) {
      setConversionError(mapGuestConversionError(error));
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            rotina<Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.screenTitle}>Ajustes</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTA</Text>

          {!isFirebaseConfigured && !user ? (
            <Card>
              <Text style={styles.accountTitle}>Modo local ativo</Text>
              <Text style={styles.accountSubtitle}>
                Firebase não configurado (.env). Os dados estão sendo salvos em memória nesta sessão.
              </Text>
            </Card>
          ) : isAnonymous ? (
            <Card variant="elevated" style={styles.guestBanner}>
              <Text style={styles.accountTitle}>
                Modo visitante — criar conta para salvar na nuvem
              </Text>
              <Text style={styles.accountSubtitle}>
                Vincule um e-mail e senha para manter sua rotina e conquistas protegidas em qualquer aparelho.
              </Text>

              {!isLinkingOpen ? (
                <Button
                  label="Vincular e-mail e senha"
                  size="md"
                  onPress={() => {
                    setConversionError(null);
                    setIsLinkingOpen(true);
                  }}
                />
              ) : (
                <View style={styles.linkForm}>
                  <Input
                    label="E-mail"
                    placeholder="voce@exemplo.com"
                    value={linkEmail}
                    onChangeText={(value) => {
                      setLinkEmail(value);
                      if (emailError) setEmailError(null);
                      if (conversionError) setConversionError(null);
                    }}
                    onBlur={() => setLinkEmail((prev) => prev.trim())}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isConverting}
                    error={emailError}
                  />

                  <Input
                    label="Senha"
                    placeholder="Mínimo 6 caracteres"
                    value={linkPassword}
                    onChangeText={(value) => {
                      setLinkPassword(value);
                      if (passwordError) setPasswordError(null);
                      if (conversionError) setConversionError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isConverting}
                    error={passwordError}
                  />

                  {conversionError ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {conversionError}
                    </Text>
                  ) : null}

                  <View style={styles.formActions}>
                    <Button
                      label="Cancelar"
                      variant="ghost"
                      size="md"
                      onPress={() => {
                        setIsLinkingOpen(false);
                        setConversionError(null);
                        setEmailError(null);
                        setPasswordError(null);
                      }}
                      disabled={isConverting}
                    />
                    <Button
                      label="Salvar conta"
                      size="md"
                      onPress={handleLinkAccount}
                      loading={isConverting}
                      style={styles.saveButton}
                    />
                  </View>
                </View>
              )}
            </Card>
          ) : (
            <Card>
              <Text style={styles.accountTitle}>{email ?? 'Conta conectada'}</Text>
              <Text style={styles.accountSubtitle}>Conta sincronizada na nuvem</Text>
            </Card>
          )}

          {conversionSuccess ? (
            <Card style={styles.successCard}>
              <Text style={styles.successText}>{conversionSuccess}</Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.bg.root,
  },
  content: {
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
    gap: tokens.spacing.xxl,
  },
  header: {
    gap: tokens.spacing.xs,
  },
  logo: {
    fontFamily: tokens.fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    color: tokens.colors.text.primary,
  },
  logoDot: {
    color: tokens.colors.accent.primary,
  },
  screenTitle: {
    fontFamily: tokens.fonts.semiBold,
    fontSize: 28,
    lineHeight: 34,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing.sm,
  },
  section: {
    gap: tokens.spacing.md,
  },
  sectionLabel: {
    fontFamily: tokens.fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: tokens.colors.text.secondary,
  },
  guestBanner: {
    gap: tokens.spacing.md,
  },
  accountTitle: {
    fontFamily: tokens.fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: tokens.colors.text.primary,
  },
  accountSubtitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  linkForm: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  saveButton: {
    flex: 1,
  },
  errorText: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.colors.semantic.danger,
  },
  successCard: {
    borderColor: tokens.colors.accent.primary,
  },
  successText: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.colors.text.primary,
  },
});
