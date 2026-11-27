import { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Card, Input } from "@/components/ui";
import { useAppAlert } from "@/contexts/alert-context";
import { useAuth } from "@/hooks/use-auth";
import { useReminderSync } from "@/hooks/use-reminder-sync";
import {
  convertGuestAccountWithEmail,
  getUserProfileSettings,
  signOutUser,
  updateUserProfileSettings,
} from "@/services/auth-service";
import {
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  type NotificationPermissionStatus,
} from "@/services/notifications/permissions";
import { tokens } from "@/theme/tokens";
import {
  mapGuestConversionError,
  validateAuthForm,
} from "@/utils/auth-validation";
import { isValidTimeString } from "@/utils/routine-validation";

export default function AjustesScreen() {
  const {
    user,
    userId,
    email,
    isAnonymous,
    isFirebaseConfigured,
    refreshAuthUser,
  } = useAuth();
  const { showAlert } = useAppAlert();
  const { cancelAllReminders } = useReminderSync();

  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState<string | null>(
    null,
  );
  const [isConverting, setIsConverting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [followUpTime, setFollowUpTime] = useState("09:00");
  const [timeDraft, setTimeDraft] = useState("09:00");
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>("unavailable");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (userId) {
          const settings = await getUserProfileSettings(userId);
          if (active) {
            setFollowUpEnabled(settings.nextDayFollowUpEnabled);
            setFollowUpTime(settings.followUpTime);
            setTimeDraft(settings.followUpTime);
          }
        }
        const status = await getNotificationPermissionStatus();
        if (active) setPermissionStatus(status);
      } catch {
        if (active)
          setSettingsError("Não foi possível carregar as preferências agora.");
      } finally {
        if (active) setSettingsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleToggleFollowUp = async (enabled: boolean) => {
    if (!userId || settingsSaving) return;
    setSettingsSaving(true);
    setSettingsError(null);
    try {
      const settings = await updateUserProfileSettings(userId, {
        nextDayFollowUpEnabled: enabled,
      });
      setFollowUpEnabled(settings.nextDayFollowUpEnabled);
    } catch {
      setSettingsError("Não foi possível salvar essa preferência.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveFollowUpTime = async () => {
    if (!userId || settingsSaving) return;
    if (!isValidTimeString(timeDraft)) {
      setSettingsError(
        "Informe um horário válido no formato HH:mm, por exemplo 09:00.",
      );
      return;
    }
    setSettingsSaving(true);
    setSettingsError(null);
    try {
      const settings = await updateUserProfileSettings(userId, {
        followUpTime: timeDraft,
      });
      setFollowUpTime(settings.followUpTime);
    } catch {
      setSettingsError("Não foi possível salvar o horário.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await ensureNotificationPermission();
    setPermissionStatus(await getNotificationPermissionStatus());
    if (!granted && Platform.OS !== "web") {
      showAlert(
        "Permissão não ativada",
        "Você pode ativar as notificações nas configurações do aparelho.",
      );
    }
  };

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
      await convertGuestAccountWithEmail(
        validation.normalizedEmail,
        linkPassword,
      );
      await refreshAuthUser();
      setIsLinkingOpen(false);
      setLinkPassword("");
      setConversionSuccess(
        "Conta vinculada com sucesso. Seus hábitos e tarefas foram preservados.",
      );
    } catch (error) {
      setConversionError(mapGuestConversionError(error));
    } finally {
      setIsConverting(false);
    }
  };

  const executeSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOutUser({
        onBeforeSignOut: async () => {
          await cancelAllReminders();
        },
      });
    } catch {
      setSignOutError(
        "Não foi possível encerrar a sessão agora. Tente novamente.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handlePressSignOut = () => {
    if (isSigningOut) {
      return;
    }

    if (isAnonymous) {
      const title = "Sair do modo visitante?";
      const message =
        "Seus dados de visitante podem ser perdidos se você sair sem vincular uma conta definitiva.";

      if (Platform.OS === "web") {
        if (
          typeof window !== "undefined" &&
          window.confirm(`${title}\n\n${message}`)
        ) {
          void executeSignOut();
        }
        return;
      }

      showAlert(title, message, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair mesmo assim",
          style: "destructive",
          onPress: () => void executeSignOut(),
        },
      ]);
      return;
    }

    void executeSignOut();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                Firebase não configurado (.env). Os dados estão sendo salvos em
                memória nesta sessão.
              </Text>
            </Card>
          ) : isAnonymous ? (
            <Card variant="elevated" style={styles.guestBanner}>
              <Text style={styles.accountTitle}>
                Modo visitante — criar conta para salvar na nuvem
              </Text>
              <Text style={styles.accountSubtitle}>
                Vincule um e-mail e senha para manter sua rotina e conquistas
                protegidas em qualquer aparelho.
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
              <Text style={styles.accountTitle}>
                {email ?? "Conta conectada"}
              </Text>
              <Text style={styles.accountSubtitle}>
                Conta sincronizada na nuvem
              </Text>
            </Card>
          )}

          {conversionSuccess ? (
            <Card style={styles.successCard}>
              <Text style={styles.successText}>{conversionSuccess}</Text>
            </Card>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICAÇÕES</Text>
          <Card style={styles.notificationCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.accountTitle}>
                  Follow-up do dia seguinte
                </Text>
                <Text style={styles.accountSubtitle}>
                  Pergunta sobre hábitos de ontem que ainda não foram marcados.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Ativar follow-up do dia seguinte"
                value={followUpEnabled}
                onValueChange={(value) => void handleToggleFollowUp(value)}
                disabled={!userId || settingsLoading || settingsSaving}
              />
            </View>
            <Input
              label="Horário da pergunta"
              value={timeDraft}
              onChangeText={setTimeDraft}
              editable={
                Boolean(userId) &&
                followUpEnabled &&
                !settingsLoading &&
                !settingsSaving
              }
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="09:00"
              helperText={
                followUpEnabled
                  ? `Salvo: ${followUpTime}`
                  : "Ative o follow-up para editar o horário."
              }
            />
            {timeDraft !== followUpTime && followUpEnabled ? (
              <Button
                label="Salvar horário"
                size="md"
                onPress={() => void handleSaveFollowUpTime()}
                loading={settingsSaving}
              />
            ) : null}
            {!userId ? (
              <Text style={styles.accountSubtitle}>
                Entre em uma conta para salvar essas preferências.
              </Text>
            ) : null}
            <Text style={styles.accountSubtitle}>
              Permissão do aparelho:{" "}
              {permissionStatus === "granted"
                ? "ativada"
                : permissionStatus === "denied"
                  ? "negada"
                  : permissionStatus === "requestable"
                    ? "ainda não solicitada"
                    : "indisponível nesta plataforma"}
              .
            </Text>
            {permissionStatus === "requestable" ? (
              <Button
                label="Permitir notificações"
                variant="secondary"
                size="md"
                onPress={() => void handleRequestNotificationPermission()}
              />
            ) : permissionStatus === "denied" ? (
              <Button
                label="Abrir configurações do aparelho"
                variant="secondary"
                size="md"
                onPress={() => void Linking.openSettings()}
              />
            ) : null}
            {settingsError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {settingsError}
              </Text>
            ) : null}
          </Card>
        </View>

        {user ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SESSÃO</Text>
            {signOutError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {signOutError}
              </Text>
            ) : null}
            <Button
              label="Sair"
              variant="danger"
              size="md"
              onPress={handlePressSignOut}
              loading={isSigningOut}
              fullWidth
            />
          </View>
        ) : null}
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
  notificationCard: {
    gap: tokens.spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  settingCopy: {
    flex: 1,
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
    flexDirection: "row",
    justifyContent: "flex-end",
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
