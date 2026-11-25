import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryFirestoreAdapter } from '../src/repositories/routine-repository';
import {
  buildDefaultUserProfile,
  ensureUserProfileDocument,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  type AuthSdkBindings,
} from '../src/services/auth-service';

function createFakeAuthBindings() {
  const calls: string[] = [];
  const bindings: AuthSdkBindings = {
    async signInWithEmail(email, password) {
      calls.push(`signIn:${email}:${password}`);
      return {
        uid: 'uid-login-1',
        email,
        displayName: 'Álvaro',
        isAnonymous: false,
      };
    },
    async signUpWithEmail(email, password) {
      calls.push(`signUp:${email}:${password}`);
      return {
        uid: 'uid-signup-1',
        email,
        displayName: null,
        isAnonymous: false,
      };
    },
    async sendPasswordReset(email) {
      calls.push(`reset:${email}`);
    },
  };
  return { bindings, calls };
}

test('buildDefaultUserProfile cria estrutura padrão com settings de follow-up às 09:00', () => {
  const adapter = new InMemoryFirestoreAdapter();
  const profile = buildDefaultUserProfile(
    {
      uid: 'uid-1',
      email: 'alvaro@rotina.app',
      displayName: null,
      isAnonymous: false,
    },
    adapter.now(),
  );

  assert.equal(profile.displayName, 'alvaro');
  assert.equal(profile.email, 'alvaro@rotina.app');
  assert.equal(profile.isAnonymous, false);
  assert.deepEqual(profile.settings, {
    nextDayFollowUpEnabled: true,
    followUpTime: '09:00',
  });
});

test('ensureUserProfileDocument cria users/{userId} no primeiro acesso e não sobrescreve perfil existente', async () => {
  const adapter = new InMemoryFirestoreAdapter();
  const user = {
    uid: 'uid-abc',
    email: 'novo@rotina.app',
    displayName: 'Novo Usuário',
    isAnonymous: false,
  };

  await ensureUserProfileDocument(adapter, user);
  const createdSnap = await adapter.getDoc('users/uid-abc');
  assert.equal(createdSnap.exists(), true);
  assert.equal(createdSnap.data()?.displayName, 'Novo Usuário');
  assert.deepEqual(createdSnap.data()?.settings, {
    nextDayFollowUpEnabled: true,
    followUpTime: '09:00',
  });

  await adapter.updateDoc('users/uid-abc', { displayName: 'Nome Personalizado' });
  await ensureUserProfileDocument(adapter, user);
  const afterLoginSnap = await adapter.getDoc('users/uid-abc');
  assert.equal(afterLoginSnap.data()?.displayName, 'Nome Personalizado');
});

test('signUpWithEmail normaliza e-mail, cria conta no Auth e grava perfil users/{userId}', async () => {
  const adapter = new InMemoryFirestoreAdapter();
  const { bindings, calls } = createFakeAuthBindings();

  const user = await signUpWithEmail('  Novo@Rotina.App  ', '123456', {
    authBindings: bindings,
    adapter,
  });

  assert.equal(user.uid, 'uid-signup-1');
  assert.deepEqual(calls, ['signUp:novo@rotina.app:123456']);

  const profileSnap = await adapter.getDoc('users/uid-signup-1');
  assert.equal(profileSnap.exists(), true);
  assert.equal(profileSnap.data()?.email, 'novo@rotina.app');
});

test('signInWithEmail autentica com e-mail normalizado e garante perfil em users/{userId}', async () => {
  const adapter = new InMemoryFirestoreAdapter();
  const { bindings, calls } = createFakeAuthBindings();

  const user = await signInWithEmail('  Alvaro@Rotina.App ', 'segredo123', {
    authBindings: bindings,
    adapter,
  });

  assert.equal(user.uid, 'uid-login-1');
  assert.deepEqual(calls, ['signIn:alvaro@rotina.app:segredo123']);
  const profileSnap = await adapter.getDoc('users/uid-login-1');
  assert.equal(profileSnap.exists(), true);
});

test('sendPasswordReset normaliza e-mail antes de chamar o Firebase Auth', async () => {
  const { bindings, calls } = createFakeAuthBindings();
  await sendPasswordReset('  Alvaro@Rotina.App ', { authBindings: bindings });
  assert.deepEqual(calls, ['reset:alvaro@rotina.app']);
});
