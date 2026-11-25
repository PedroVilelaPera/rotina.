import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import type { FirestoreAdapter } from '../repositories/routine-repository';
import type { FirestoreTimestampLike } from '../types/routine';
import { normalizeEmail } from '../utils/auth-validation';

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
  sendPasswordReset(email: string): Promise<void>;
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
      async sendPasswordReset(email) {
        await sendPasswordResetEmail(services.auth, email);
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
