export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

type EnvRecord = Record<string, string | undefined>;

function readRequiredVar(env: EnvRecord, key: string): string | null {
  const raw = env[key];
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readFirebaseConfig(env: EnvRecord): FirebaseEnvConfig | null {
  const apiKey = readRequiredVar(env, 'EXPO_PUBLIC_FIREBASE_API_KEY');
  const authDomain = readRequiredVar(env, 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  const projectId = readRequiredVar(env, 'EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  const storageBucket = readRequiredVar(env, 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = readRequiredVar(env, 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  const appId = readRequiredVar(env, 'EXPO_PUBLIC_FIREBASE_APP_ID');

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function getDefaultFirebaseConfig(): FirebaseEnvConfig | null {
  return readFirebaseConfig({
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });
}
