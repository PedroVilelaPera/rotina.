import assert from 'node:assert/strict';
import test from 'node:test';

import { readFirebaseConfig } from '../src/lib/firebase-config';

const validEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'api-key-123',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'rotina-app.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'rotina-app',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'rotina-app.appspot.com',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:1234567890:web:abcdef',
};

test('retorna configuração tipada quando todas as variáveis obrigatórias estão presentes', () => {
  const config = readFirebaseConfig(validEnv);
  assert.deepEqual(config, {
    apiKey: 'api-key-123',
    authDomain: 'rotina-app.firebaseapp.com',
    projectId: 'rotina-app',
    storageBucket: 'rotina-app.appspot.com',
    messagingSenderId: '1234567890',
    appId: '1:1234567890:web:abcdef',
  });
});

test('remove espaços laterais das variáveis de ambiente', () => {
  const config = readFirebaseConfig({
    ...validEnv,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: '  rotina-app  ',
  });
  assert.equal(config?.projectId, 'rotina-app');
});

test('retorna null quando alguma variável obrigatória está ausente ou vazia', () => {
  assert.equal(readFirebaseConfig({}), null);
  assert.equal(
    readFirebaseConfig({
      ...validEnv,
      EXPO_PUBLIC_FIREBASE_API_KEY: '   ',
    }),
    null,
  );
  const { EXPO_PUBLIC_FIREBASE_APP_ID: _, ...missingAppId } = validEnv;
  assert.equal(readFirebaseConfig(missingAppId), null);
});
