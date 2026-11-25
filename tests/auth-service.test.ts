import assert from 'node:assert/strict';
import test from 'node:test';

import { createRoutineRepository, InMemoryFirestoreAdapter } from '../src/repositories/routine-repository';
import {
  buildDefaultUserProfile,
  convertGuestAccountWithEmail,
  ensureUserProfileDocument,
  sendPasswordReset,
  signInAsGuest,
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
    async signInAnonymously() {
      calls.push('signInAnonymously');
      return {
        uid: 'uid-guest-1',
        email: null,
        displayName: null,
        isAnonymous: true,
      };
    },
    async linkEmailPassword(email, password) {
      calls.push(`linkEmail:${email}:${password}`);
      return {
        uid: 'uid-guest-1',
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

test('signInAsGuest cria sessão anônima e grava perfil users/{userId} com isAnonymous=true', async () => {
  const adapter = new InMemoryFirestoreAdapter();
  const { bindings, calls } = createFakeAuthBindings();

  const guest = await signInAsGuest({ authBindings: bindings, adapter });
  assert.equal(guest.uid, 'uid-guest-1');
  assert.equal(guest.isAnonymous, true);
  assert.deepEqual(calls, ['signInAnonymously']);

  const snap = await adapter.getDoc('users/uid-guest-1');
  assert.equal(snap.exists(), true);
  assert.equal(snap.data()?.isAnonymous, true);
  assert.equal(snap.data()?.email, null);
  assert.equal(snap.data()?.displayName, 'Visitante');
});

test('convertGuestAccountWithEmail vincula conta mantendo items e completions intactos sob o mesmo uid', async () => {
  const adapter = new InMemoryFirestoreAdapter();
  const routineRepo = createRoutineRepository(adapter);
  const { bindings, calls } = createFakeAuthBindings();

  const guest = await signInAsGuest({ authBindings: bindings, adapter });
  const habit = await routineRepo.createItem(guest.uid, {
    type: 'habit',
    title: 'Ler 15 min',
    scheduledTime: '20:00',
    recurrence: { kind: 'daily', daysOfWeek: [] },
  });
  await routineRepo.toggleCompletion(
    guest.uid,
    { id: habit.id, type: 'habit', scheduledTime: '20:00' },
    '2026-11-25',
  );

  const converted = await convertGuestAccountWithEmail('  Alvaro@Rotina.App ', '123456', {
    authBindings: bindings,
    adapter,
  });

  assert.equal(converted.uid, 'uid-guest-1');
  assert.equal(converted.isAnonymous, false);
  assert.equal(converted.email, 'alvaro@rotina.app');
  assert.deepEqual(calls, ['signInAnonymously', 'linkEmail:alvaro@rotina.app:123456']);

  const profileSnap = await adapter.getDoc('users/uid-guest-1');
  assert.equal(profileSnap.data()?.isAnonymous, false);
  assert.equal(profileSnap.data()?.email, 'alvaro@rotina.app');

  const itemsAfter = await routineRepo.listItems('uid-guest-1');
  const completionsAfter = await routineRepo.listCompletionsForDate('uid-guest-1', '2026-11-25');
  assert.equal(itemsAfter.length, 1);
  assert.equal(itemsAfter[0].title, 'Ler 15 min');
  assert.equal(completionsAfter.length, 1);
});
