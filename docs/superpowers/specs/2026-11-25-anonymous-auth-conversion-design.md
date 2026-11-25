# Design — Issue #8 (`[A4]`): Modo Visitante (Anonymous Auth) e Conversão para Conta Definitiva

**Data:** 2026-11-25  
**Issue:** `#8` (`[A4] Implementar Modo Visitante (Anonymous Auth) e conversão para conta definitiva`)  
**Requisitos de referência:** `[Autenticacao e Conta.RF002]`, `[Autenticacao e Conta.RF003]`, Interfaces `IF01`, `IF06`  
**Tamanho da entrega:** Feature focada (sessão anônima + conversão via `linkWithCredential` + bloco de conta na `IF06`).

---

## 1. Intenção e Porquê

Permitir que o usuário experimente o **`rotina.`** sem atrito de cadastro imediato (Firebase Anonymous Auth) e converta sua conta visitante em conta definitiva (E-mail + Senha via `linkWithCredential`) mantendo todo o histórico de `items` e `completions` intacto sob o mesmo `uid`.

## 2. Escopo

### Objetivos (Goals)
- **Na `IF01` (`/login`):** adicionar opção *"Entrar sem cadastro (modo visitante)"*, criando sessão anônima e documento `users/{userId}` (`isAnonymous: true`, `email: null`, `displayName: "Visitante"`, `settings` padrão).
- **No `AuthContext`:** expor `refreshAuthUser()` (recarrega `currentUser` e sincroniza `email` / `isAnonymous` no React state após `linkWithCredential`).
- **Na `IF06` (`/(tabs)/ajustes`):** estruturar a tela de Ajustes com o bloco de Conta:
  - Quando `isAnonymous === true`: exibe banner discreto *"Modo visitante — criar conta para salvar na nuvem"* com formulário inline para vincular E-mail e Senha via `linkWithCredential`.
  - Após conversão: atualiza `users/{userId}` (`isAnonymous: false`, `email`, `displayName`), preserva `items` e `completions` sob o mesmo `userId`, e atualiza o status exibido.
  - Quando `e-mail` já possui conta (`auth/email-already-in-use` / `auth/credential-already-in-use`): exibe mensagem clara informando que o e-mail já tem conta e alertando que entrar nela não mescla os dados da sessão visitante (`[RF003]`).

### Não-Objetivos (Non-Goals)
- Vinculação com Google (`A5` postergada fora do MVP).
- Controles de notificação (`L3`) e botão *Sair* (`A6`) na `IF06` — apenas a estrutura base da tela pronta para recebê-los.

## 3. Abordagem e Unidades
- `src/utils/auth-validation.ts`: adicionar `mapGuestConversionError(error)` tratando conflitos de credencial na vinculação.
- `src/services/auth-service.ts`: adicionar `signInAsGuest()` e `convertGuestAccountWithEmail()` com `AuthSdkBindings` injetável para testes determinísticos.
- `src/contexts/auth-context.tsx`: expor `refreshAuthUser()` e sincronizar `email` / `isAnonymous` explicitamente no estado do contexto.
- `src/app/login.tsx`: adicionar botão *"Entrar sem cadastro (modo visitante)"* compartilhando bloqueio de `isSubmitting`.
- `src/app/(tabs)/ajustes.tsx`: implementar estrutura base da `IF06` com bloco de Conta e banner/formulário de conversão de visitante.
