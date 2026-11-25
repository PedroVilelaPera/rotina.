# Design — Issue #7 (`[A3]`): Cadastro/Login E-mail+Senha, Recuperação de Senha e Tela `IF01`

**Data:** 2026-11-25  
**Issue:** `#7` (`[A3] Implementar cadastro/login E-mail+Senha, recuperação de senha e tela IF01`)  
**Requisitos de referência:** `[Autenticacao e Conta.RF001]`, `[Autenticacao e Conta.RF004]`, Interface `IF01`, `[Usabilidade.NF001]`  
**Tamanho da entrega:** Feature focada (autenticação por e-mail/senha + tela `IF01` + guarda condicional).

---

## 1. Intenção e Porquê

Entregar a primeira porta de entrada autenticada do **`rotina.`** (`IF01 — Login Minimalista`) usando E-mail e Senha via Firebase JS SDK, garantindo validação imediata no cliente, criação automática do documento de perfil `users/{userId}` no Cloud Firestore, recuperação de senha com feedback neutro e guarda condicional que preserva o funcionamento em memória quando não há `.env` configurado.

## 2. Escopo

### Objetivos (Goals)
- Implementar tela **`IF01` (`/login`)** aderente ao tema *Warm Obsidian Terracotta* e aos componentes base (`Button`, `Input`, `Plus Jakarta Sans`):
  - Ícone minimalista de relógio, logotipo `rotina.` (ponto em `#E07A5F`) e subtítulo *"sua rotina no seu ritmo."*.
  - Inputs *Seu e-mail* (`trim` automático, teclado `email-address`) e *Senha* (mínimo 6 caracteres, mascarado com toggle de visibilidade *Mostrar/Ocultar*).
  - Ação *"Esqueceu?"* disparando `sendPasswordResetEmail` com feedback neutro (sem vazar se o e-mail existe ou não).
  - Botão primário terracota (*"Entrar →"* / *"Criar conta →"*) com estado `loading` bloqueando cliques duplos.
  - Alternância entre modos *Entrar* e *Criar conta* na própria `IF01`.
- Criar documento inicial `users/{userId}` no primeiro cadastro com:
  - `displayName`, `email`, `isAnonymous: false`, `createdAt`, e `settings: { nextDayFollowUpEnabled: true, followUpTime: "09:00" }`.
- Garantir criação/sincronização do perfil também no login caso o documento ainda não exista.
- Implementar guarda condicional em `RootLayout`: redireciona para `/login` apenas quando `isFirebaseConfigured === true && !loading && !user`; redireciona para `/(tabs)` ao autenticar. Sem `.env`, abre direto em `/(tabs)` com `InMemoryFirestoreAdapter`.
- Conectar `useAuth().userId ?? 'current-user'` em `useRoutineDaily`, `useItemForm` e `item-details` para que, uma vez autenticado, o app leia e escreva em `users/{uid}/...` no Firestore real.

### Não-Objetivos (Non-Goals)
- Botão *"Entrar sem cadastro (modo visitante)"* e conversão de conta anônima (Issue `#8 / A4`).
- Botão social *Google* (`A5` postergada fora do MVP) e *Apple* (`V1` em v2).
- Tela `IF06` (Ajustes / Logout) (Issue `#10 / A6`).

### Anti-Objetivos (Anti-Goals)
- Bloquear o app ou quebrar fluxos da frente `rotina-core` quando `.env` não estiver configurado.
- Limpar o campo de e-mail em erros de login (`[RF001]` exige manter o e-mail preenchido).
- Expor mensagens técnicas cruas do Firebase Auth ou vazar existência de e-mails no fluxo *"Esqueceu?"*.

## 3. Abordagens Consideradas

### Abordagem A — `auth-validation.ts` + `auth-service.ts` desacoplados + `src/app/login.tsx` *(Escolhida)*
- Separa validação pura (`auth-validation.ts`), orquestração Firebase Auth + Firestore (`auth-service.ts`) e UI (`src/app/login.tsx`).
- `ensureUserProfileDocument(adapter, user)` recebe `FirestoreAdapter`, permitindo testes determinísticos no `node --test` sem rede.

### Abordagem B — Tudo dentro de `AuthProvider` *(Descartada)*
- Misturaria regras de validação, criação de perfil e tradução de erros ao estado React, dificultando testes unitários sem renderizar componentes.

## 4. Arquitetura e Unidades

| Arquivo | Responsabilidade | Dependências |
| :--- | :--- | :--- |
| `src/utils/auth-validation.ts` | `normalizeEmail`, `validateEmail`, `validatePassword`, `validateAuthForm`, `mapFirebaseAuthError` (mensagens amigáveis em `semantic.danger`). | Nenhuma |
| `src/services/auth-service.ts` | `signInWithEmail`, `signUpWithEmail`, `sendPasswordReset`, `ensureUserProfileDocument(adapter, profileInput)` e `buildDefaultUserProfile`. | `firebase/auth`, `firebase.ts`, `firebase-firestore-adapter.ts`, `routine-repository.ts`, `auth-validation.ts` |
| `src/app/login.tsx` | Tela `IF01` (Login/Cadastro E-mail+Senha, toggle de visibilidade da senha, fluxo *Esqueceu?*, loading e bloqueio de clique duplo). | `useAuth`, `auth-service.ts`, `auth-validation.ts`, `Button`, `Input`, `tokens` |
| `src/app/_layout.tsx` | Registrar `<Stack.Screen name="login" />` e guarda condicional (`isFirebaseConfigured && !loading`). | `expo-router`, `useAuth` |
| `src/hooks/use-routine-daily.ts`, `src/hooks/use-item-form.ts`, `src/app/item-details.tsx` | Usar `options?.userId ?? authUserId ?? 'current-user'` preservando override em testes e fallback sem sessão. | `useAuth` |

## 5. Fluxo de Dados e Tratamento de Erros
1. **Login / Cadastro (`RF001`):**
   - Aplica `trim()` no e-mail e valida formato + senha `>= 6`. Erros locais exibem mensagem inline abaixo do respectivo `Input` sem disparar requisição.
   - Durante requisição (`isSubmitting = true`), botão exibe `loading` e ignora novos toques.
   - Em erro do Firebase (`auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found`, `auth/email-already-in-use`, `auth/network-request-failed`), exibe mensagem amigável em `#C85A53` preservando o e-mail digitado.
   - No cadastro bem-sucedido, grava `users/{userId}` com `settings: { nextDayFollowUpEnabled: true, followUpTime: "09:00" }`; no login, garante criação caso não exista. O `onAuthStateChanged` no `AuthProvider` atualiza `user` e ativa o `FirebaseFirestoreAdapter`, e a guarda redireciona para `/(tabs)`.
2. **Recuperação de Senha (`RF004`):**
   - Usuário toca em *"Esqueceu?"*. Valida o e-mail informado (se vazio ou inválido, destaca erro no campo de e-mail).
   - Se válido, chama `sendPasswordReset(email)` e exibe mensagem neutra: *"Se o e-mail estiver cadastrado, enviamos as instruções para redefinir sua senha."*

## 6. Estratégia de Testes e Verificação
- `tests/auth-validation.test.ts`: validação de e-mail com `trim`, senha `< 6` vs `>= 6`, e mapeamento dos códigos de erro do Firebase Auth.
- `tests/auth-service.test.ts`: criação idempotente de `users/{userId}` com `settings` padrão (`nextDayFollowUpEnabled: true`, `followUpTime: "09:00"`) usando `InMemoryFirestoreAdapter`, sem sobrescrever perfil existente no login, além de validação de login/cadastro/reset com bindings mockados.
- Higiene obrigatória: `npx tsc --noEmit`, `npm run lint` e `npm test` (todos verdes).
