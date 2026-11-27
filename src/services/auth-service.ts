import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import type { FirestoreAdapter } from '../repositories/routine-repository';
import type { FirestoreTimestampLike } from '../types/routine';
import { normalizeEmail } from '../utils/auth-validation';
import { isValidTimeString } from '../utils/routine-validation';

export interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

export interface UserProfileSettings {
  nextDayFollowUpEnabled: boolean;
  followUpTime: string;
}

export interface UserProfileDocument {
  displayName: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: FirestoreTimestampLike;
  settings: UserProfileSettings;
}

export interface AuthSdkBindings {
  signInWithEmail(email: string, password: string): Promise<AuthUserSummary>;
  signUpWithEmail(email: string, password: string): Promise<AuthUserSummary>;
  signInAnonymously(): Promise<AuthUserSummary>;
  linkEmailPassword(email: string, password: string): Promise<AuthUserSummary>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
}

export interface AuthServiceOptions {
  authBindings?: AuthSdkBindings;
  adapter?: FirestoreAdapter;
}

const DEFAULT_USER_SETTINGS: UserProfileSettings = {
  nextDayFollowUpEnabled: true,
  followUpTime: '09:00',
};

async function requireFirebaseBindings(): Promise<{
  authBindings: AuthSdkBindings;
  adapter: FirestoreAdapter;
}> {
  const [{ getFirebaseServices }, { FirebaseFirestoreAdapter }] = await Promise.all([
    import('../lib/firebase'),
    import('../repositories/firebase-firestore-adapter'),
  ]);
  const services = getFirebaseServices();
  if (!services) {
    throw new Error('Firebase não configurado. Preencha o arquivo .env para autenticar.');
  }

  return {
    authBindings: {
      async signInWithEmail(email, password) {
        const credential = await signInWithEmailAndPassword(services.auth, email, password);
        return {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          isAnonymous: credential.user.isAnonymous,
        };
      },
      async signUpWithEmail(email, password) {
        const credential = await createUserWithEmailAndPassword(services.auth, email, password);
        return {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          isAnonymous: credential.user.isAnonymous,
        };
      },
      async signInAnonymously() {
        const credential = await firebaseSignInAnonymously(services.auth);
        return {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          isAnonymous: credential.user.isAnonymous,
        };
      },
      async linkEmailPassword(email, password) {
        const currentUser = services.auth.currentUser;
        if (!currentUser) {
          throw new Error('Nenhuma sessão ativa encontrada para vincular a conta.');
        }
        const credential = EmailAuthProvider.credential(email, password);
        const result = await linkWithCredential(currentUser, credential);
        return {
          uid: result.user.uid,
          email: result.user.email ?? email,
          displayName: result.user.displayName,
          isAnonymous: result.user.isAnonymous,
        };
      },
      async sendPasswordReset(email) {
        await sendPasswordResetEmail(services.auth, email);
      },
      async signOut() {
        await firebaseSignOut(services.auth);
      },
    },
    adapter: new FirebaseFirestoreAdapter(services.db),
  };
}

function resolveDisplayName(user: AuthUserSummary): string {
  const explicitName = user.displayName?.trim();
  if (explicitName) {
    return explicitName;
  }
  if (user.isAnonymous) {
    return 'Visitante';
  }
  const emailPrefix = user.email?.split('@')[0]?.trim();
  return emailPrefix || 'Usuário';
}

export function buildDefaultUserProfile(
  user: AuthUserSummary,
  createdAt: FirestoreTimestampLike,
): UserProfileDocument {
  return {
    displayName: resolveDisplayName(user),
    email: user.email,
    isAnonymous: user.isAnonymous,
    createdAt,
    settings: { ...DEFAULT_USER_SETTINGS },
  };
}

function normalizeUserSettings(raw: unknown): UserProfileSettings {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    nextDayFollowUpEnabled:
      typeof value.nextDayFollowUpEnabled === 'boolean'
        ? value.nextDayFollowUpEnabled
        : DEFAULT_USER_SETTINGS.nextDayFollowUpEnabled,
    followUpTime: isValidTimeString(value.followUpTime)
      ? value.followUpTime
      : DEFAULT_USER_SETTINGS.followUpTime,
  };
}

export async function getUserProfileSettings(
  userId: string,
  options?: Pick<AuthServiceOptions, 'adapter'>,
): Promise<UserProfileSettings> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) throw new Error('Identificador de usuário é obrigatório.');
  const adapter = options?.adapter ?? (await requireFirebaseBindings()).adapter;
  const snapshot = await adapter.getDoc(`users/${cleanUserId}`);
  if (!snapshot.exists()) throw new Error('Perfil do usuário não encontrado.');
  return normalizeUserSettings(snapshot.data()?.settings);
}

export async function updateUserProfileSettings(
  userId: string,
  updates: Partial<UserProfileSettings>,
  options?: Pick<AuthServiceOptions, 'adapter'>,
): Promise<UserProfileSettings> {
  const cleanUserId = userId.trim();
  if (!cleanUserId) throw new Error('Identificador de usuário é obrigatório.');
  if (updates.nextDayFollowUpEnabled !== undefined && typeof updates.nextDayFollowUpEnabled !== 'boolean') {
    throw new Error('A preferência de follow-up deve ser verdadeira ou falsa.');
  }
  if (updates.followUpTime !== undefined && !isValidTimeString(updates.followUpTime)) {
    throw new Error('Horário inválido. Use o formato HH:mm.');
  }

  const adapter = options?.adapter ?? (await requireFirebaseBindings()).adapter;
  const path = `users/${cleanUserId}`;
  const snapshot = await adapter.getDoc(path);
  if (!snapshot.exists()) throw new Error('Perfil do usuário não encontrado.');
  const settings = { ...normalizeUserSettings(snapshot.data()?.settings), ...updates };
  await adapter.updateDoc(path, { settings });
  return settings;
}

export async function ensureUserProfileDocument(
  adapter: FirestoreAdapter,
  user: AuthUserSummary,
): Promise<void> {
  const docPath = `users/${user.uid}`;
  const snapshot = await adapter.getDoc(docPath);
  if (snapshot.exists()) {
    return;
  }

  const profile = buildDefaultUserProfile(user, adapter.now());
  await adapter.setDoc(docPath, profile as unknown as Record<string, unknown>);
}

export async function signInWithEmail(
  rawEmail: string,
  password: string,
  options?: AuthServiceOptions,
): Promise<AuthUserSummary> {
  const normalizedEmail = normalizeEmail(rawEmail);
  const defaults = options?.authBindings && options?.adapter ? null : await requireFirebaseBindings();
  const authBindings = options?.authBindings ?? defaults!.authBindings;
  const adapter = options?.adapter ?? defaults!.adapter;

  const user = await authBindings.signInWithEmail(normalizedEmail, password);
  await ensureUserProfileDocument(adapter, user);
  return user;
}

export async function signUpWithEmail(
  rawEmail: string,
  password: string,
  options?: AuthServiceOptions,
): Promise<AuthUserSummary> {
  const normalizedEmail = normalizeEmail(rawEmail);
  const defaults = options?.authBindings && options?.adapter ? null : await requireFirebaseBindings();
  const authBindings = options?.authBindings ?? defaults!.authBindings;
  const adapter = options?.adapter ?? defaults!.adapter;

  const user = await authBindings.signUpWithEmail(normalizedEmail, password);
  await ensureUserProfileDocument(adapter, user);
  return user;
}

export async function sendPasswordReset(
  rawEmail: string,
  options?: Pick<AuthServiceOptions, 'authBindings'>,
): Promise<void> {
  const normalizedEmail = normalizeEmail(rawEmail);
  const authBindings = options?.authBindings ?? (await requireFirebaseBindings()).authBindings;
  await authBindings.sendPasswordReset(normalizedEmail);
}

export async function signInAsGuest(
  options?: AuthServiceOptions,
): Promise<AuthUserSummary> {
  const defaults = options?.authBindings && options?.adapter ? null : await requireFirebaseBindings();
  const authBindings = options?.authBindings ?? defaults!.authBindings;
  const adapter = options?.adapter ?? defaults!.adapter;

  const user = await authBindings.signInAnonymously();
  await ensureUserProfileDocument(adapter, user);
  return user;
}

export async function convertGuestAccountWithEmail(
  rawEmail: string,
  password: string,
  options?: AuthServiceOptions,
): Promise<AuthUserSummary> {
  const normalizedEmail = normalizeEmail(rawEmail);
  const defaults = options?.authBindings && options?.adapter ? null : await requireFirebaseBindings();
  const authBindings = options?.authBindings ?? defaults!.authBindings;
  const adapter = options?.adapter ?? defaults!.adapter;

  const convertedUser = await authBindings.linkEmailPassword(normalizedEmail, password);
  const docPath = `users/${convertedUser.uid}`;
  const snapshot = await adapter.getDoc(docPath);

  if (snapshot.exists()) {
    await adapter.updateDoc(docPath, {
      email: convertedUser.email ?? normalizedEmail,
      displayName: resolveDisplayName({
        ...convertedUser,
        email: convertedUser.email ?? normalizedEmail,
        isAnonymous: false,
      }),
      isAnonymous: false,
    });
  } else {
    await ensureUserProfileDocument(adapter, {
      ...convertedUser,
      email: convertedUser.email ?? normalizedEmail,
      isAnonymous: false,
    });
  }

  return convertedUser;
}

export interface SignOutOptions {
  authBindings?: Pick<AuthSdkBindings, 'signOut'>;
  onBeforeSignOut?: () => Promise<void> | void;
}

export async function signOutUser(options?: SignOutOptions): Promise<void> {
  if (options?.onBeforeSignOut) {
    try {
      await options.onBeforeSignOut();
    } catch {
      // Falha ao limpar notificações locais não deve impedir o encerramento da sessão
    }
  }

  const authBindings = options?.authBindings ?? (await requireFirebaseBindings()).authBindings;
  await authBindings.signOut();
}
