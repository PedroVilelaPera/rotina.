const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 6;

export interface AuthFormValidationResult {
  valid: boolean;
  normalizedEmail: string;
  emailError: string | null;
  passwordError: string | null;
}

export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export function validateEmail(rawEmail: string): string | null {
  const normalized = normalizeEmail(rawEmail);
  if (!normalized) {
    return 'Informe seu e-mail.';
  }
  if (!EMAIL_REGEX.test(normalized)) {
    return 'Informe um e-mail válido.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

export function validateAuthForm(rawEmail: string, password: string): AuthFormValidationResult {
  const normalizedEmail = normalizeEmail(rawEmail);
  const emailError = validateEmail(rawEmail);
  const passwordError = validatePassword(password);

  return {
    valid: emailError === null && passwordError === null,
    normalizedEmail,
    emailError,
    passwordError,
  };
}

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.';
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar na sua conta.';
    case 'auth/weak-password':
      return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    case 'auth/network-request-failed':
      return 'Sem conexão no momento. Verifique sua internet e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
    default:
      return 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}

export function mapGuestConversionError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
    return 'Este e-mail já possui uma conta cadastrada. Se optar por entrar nela, os dados desta sessão visitante não serão mesclados automaticamente.';
  }

  return mapFirebaseAuthError(error);
}
