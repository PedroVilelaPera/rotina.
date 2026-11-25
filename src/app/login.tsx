import { SymbolView } from 'expo-symbols';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, type InputRef } from '../components/ui';
import { useAuth } from '../hooks/use-auth';
import {
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from '../services/auth-service';
import { tokens } from '../theme/tokens';
import {
  mapFirebaseAuthError,
  validateAuthForm,
  validateEmail,
} from '../utils/auth-validation';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const { isFirebaseConfigured } = useAuth();
  const passwordInputRef = useRef<InputRef>(null);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegisterMode = mode === 'register';

  const clearFeedback = () => {
    setFormError(null);
    setInfoMessage(null);
  };

  const handleToggleMode = () => {
    if (isSubmitting) {
      return;
    }
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setEmailError(null);
    setPasswordError(null);
    clearFeedback();
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    clearFeedback();
    const validation = validateAuthForm(email, password);
    setEmail(validation.normalizedEmail);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);

    if (!validation.valid) {
      return;
    }

    if (!isFirebaseConfigured) {
      setFormError('Firebase não configurado. Preencha o arquivo .env para autenticar.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await signUpWithEmail(validation.normalizedEmail, password);
      } else {
        await signInWithEmail(validation.normalizedEmail, password);
      }
    } catch (error) {
      setFormError(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (isSubmitting) {
      return;
    }

    clearFeedback();
    const error = validateEmail(email);
    setEmailError(error);
    if (error) {
      return;
    }

    if (!isFirebaseConfigured) {
      setFormError('Firebase não configurado. Preencha o arquivo .env para recuperar a senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setInfoMessage(
        'Se o e-mail estiver cadastrado, enviamos as instruções para redefinir sua senha.',
      );
    } catch (err) {
      setFormError(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brandBlock}>
            <View style={styles.iconBadge}>
              <SymbolView
                name="clock"
                size={28}
                tintColor={tokens.colors.accent.primary}
                fallback={<Text style={styles.clockFallback}>◷</Text>}
              />
            </View>

            <Text style={styles.logo}>
              rotina<Text style={styles.logoDot}>.</Text>
            </Text>
            <Text style={styles.subtitle}>sua rotina no seu ritmo.</Text>
          </View>

          <View style={styles.formBlock}>
            <Input
              label="Seu e-mail"
              placeholder="voce@exemplo.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError(null);
                if (formError) setFormError(null);
              }}
              onBlur={() => setEmail((prev) => prev.trim())}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!isSubmitting}
              error={emailError}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />

            <Input
              ref={passwordInputRef}
              label="Senha"
              labelRight={
                !isRegisterMode ? (
                  <Pressable
                    onPress={handleForgotPassword}
                    disabled={isSubmitting}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Esqueceu a senha?">
                    <Text style={styles.forgotLink}>Esqueceu?</Text>
                  </Pressable>
                ) : null
              }
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(null);
                if (formError) setFormError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={isRegisterMode ? 'newPassword' : 'password'}
              returnKeyType="done"
              editable={!isSubmitting}
              error={passwordError}
              onSubmitEditing={handleSubmit}
              rightAdornment={
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  <Text style={styles.togglePasswordText}>
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </Pressable>
              }
            />

            {formError ? (
              <Text accessibilityRole="alert" style={styles.formError}>
                {formError}
              </Text>
            ) : null}

            {infoMessage ? (
              <Text accessibilityRole="status" style={styles.infoMessage}>
                {infoMessage}
              </Text>
            ) : null}

            <Button
              label={isRegisterMode ? 'Criar conta →' : 'Entrar →'}
              onPress={handleSubmit}
              loading={isSubmitting}
              fullWidth
              style={styles.submitButton}
            />

            <Pressable
              onPress={handleToggleMode}
              disabled={isSubmitting}
              style={styles.switchModeButton}
              accessibilityRole="button">
              <Text style={styles.switchModeText}>
                {isRegisterMode ? 'Já tem conta? ' : 'Novo por aqui? '}
                <Text style={styles.switchModeHighlight}>
                  {isRegisterMode ? 'Entrar' : 'Criar conta'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.bg.root,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xxl,
    paddingVertical: tokens.spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxl + 12,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.bg.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.lg,
  },
  clockFallback: {
    fontSize: 26,
    color: tokens.colors.accent.primary,
  },
  logo: {
    fontFamily: tokens.fonts.bold,
    fontSize: 36,
    lineHeight: 42,
    color: tokens.colors.text.primary,
    letterSpacing: -0.5,
  },
  logoDot: {
    color: tokens.colors.accent.primary,
  },
  subtitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  formBlock: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: tokens.spacing.lg,
  },
  forgotLink: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    color: tokens.colors.accent.primary,
  },
  togglePasswordText: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    color: tokens.colors.text.secondary,
  },
  formError: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.colors.semantic.danger,
  },
  infoMessage: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.bg.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.md,
  },
  submitButton: {
    marginTop: tokens.spacing.xs,
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  switchModeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text.secondary,
  },
  switchModeHighlight: {
    fontFamily: tokens.fonts.semiBold,
    color: tokens.colors.accent.primary,
  },
});
