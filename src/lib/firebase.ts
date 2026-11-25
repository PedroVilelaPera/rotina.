import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import {
  type Auth,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Persistence,
} from 'firebase/auth';
import {
  type Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { getDefaultFirebaseConfig } from './firebase-config';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cachedServices: FirebaseServices | null = null;

function resolveAuthPersistence(): Persistence | undefined {
  if (Platform.OS === 'web') {
    return browserLocalPersistence;
  }

  // getReactNativePersistence é exportado pelo bundle React Native de firebase/auth
  const authModule = firebaseAuth as typeof firebaseAuth & {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
  };

  return authModule.getReactNativePersistence?.(AsyncStorage);
}

function createAuthInstance(app: FirebaseApp): Auth {
  try {
    const persistence = resolveAuthPersistence();
    return persistence ? initializeAuth(app, { persistence }) : getAuth(app);
  } catch {
    // Em Fast Refresh no Expo Go, initializeAuth pode já ter sido chamado para o mesmo app
    return getAuth(app);
  }
}

function createFirestoreInstance(app: FirebaseApp): Firestore {
  try {
    const localCache =
      Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache();
    return initializeFirestore(app, { localCache });
  } catch {
    // Fallback seguro em caso de Fast Refresh
    return getFirestore(app);
  }
}

export function getFirebaseServices(): FirebaseServices | null {
  if (cachedServices) {
    return cachedServices;
  }

  const config = getDefaultFirebaseConfig();
  if (!config) {
    return null;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = createAuthInstance(app);
  const db = createFirestoreInstance(app);

  cachedServices = { app, auth, db };
  return cachedServices;
}

export function isFirebaseConfigured(): boolean {
  return getDefaultFirebaseConfig() !== null;
}

export function resetFirebaseServicesForTests(): void {
  cachedServices = null;
}
