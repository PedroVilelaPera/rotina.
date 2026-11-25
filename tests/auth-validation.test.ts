import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mapFirebaseAuthError,
  normalizeEmail,
  validateAuthForm,
  validateEmail,
  validatePassword,
} from '../src/utils/auth-validation';

test('normalizeEmail remove espaços laterais e converte para minúsculas', () => {
  assert.equal(normalizeEmail('  Alvaro@Rotina.App  '), 'alvaro@rotina.app');
});

test('validateEmail aceita e-mails válidos com trim e rejeita formatos inválidos', () => {
  assert.equal(validateEmail('  usuario@dominio.com  '), null);
  assert.ok(validateEmail(''));
  assert.ok(validateEmail('   '));
  assert.ok(validateEmail('usuario-sem-arroba'));
  assert.ok(validateEmail('usuario@dominio'));
});

test('validatePassword exige no mínimo 6 caracteres', () => {
  assert.equal(validatePassword('123456'), null);
  assert.equal(validatePassword('senha-segura'), null);
  assert.ok(validatePassword(''));
  assert.ok(validatePassword('12345'));
});

test('validateAuthForm retorna erros por campo e valid=true quando válido', () => {
  const invalid = validateAuthForm('invalido', '123');
  assert.equal(invalid.valid, false);
  assert.ok(invalid.emailError);
  assert.ok(invalid.passwordError);

  const valid = validateAuthForm('  alvaro@rotina.app ', '123456');
  assert.equal(valid.valid, true);
  assert.equal(valid.normalizedEmail, 'alvaro@rotina.app');
  assert.equal(valid.emailError, null);
  assert.equal(valid.passwordError, null);
});

test('mapFirebaseAuthError traduz códigos conhecidos para mensagens amigáveis em português', () => {
  assert.match(mapFirebaseAuthError({ code: 'auth/invalid-credential' }), /E-mail ou senha/i);
  assert.match(mapFirebaseAuthError({ code: 'auth/wrong-password' }), /E-mail ou senha/i);
  assert.match(mapFirebaseAuthError({ code: 'auth/user-not-found' }), /E-mail ou senha/i);
  assert.match(mapFirebaseAuthError({ code: 'auth/email-already-in-use' }), /já está cadastrado/i);
  assert.match(mapFirebaseAuthError({ code: 'auth/network-request-failed' }), /conexão/i);
  assert.match(mapFirebaseAuthError({ code: 'auth/too-many-requests' }), /tentativas/i);
  assert.ok(mapFirebaseAuthError(new Error('erro desconhecido')).length > 0);
});
