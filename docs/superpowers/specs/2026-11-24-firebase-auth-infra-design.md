# Design — Issue #6 (`[A2]`): Infraestrutura Firebase (Auth + Cloud Firestore offline), Security Rules e `useAuth`

**Data:** 2026-11-24  
**Issue:** `#6` (`[A2] Configurar Firebase (Auth + Cloud Firestore offline) e Security Rules`)  
**Requisitos de referência:** `[Confiabilidade.NF001]`, `[Seguranca.NF001]`, `[Seguranca.NF002]`  
**Tamanho da entrega:** Mudança pequena/focada de infraestrutura (camada base para `A3`, `A4` e `A6`).

---

## 1. Intenção e Porquê

Estabelecer a camada oficial de backend gerenciado (Firebase Auth + Cloud Firestore) compatível com **Expo Go** e isolar os dados por usuário (`users/{userId}/**`), sem quebrar as telas da frente `rotina-core` que hoje rodam com `InMemoryFirestoreAdapter` e `userId = 'current-user'` enquanto a tela de Login (`A3`) e o Modo Visitante (`A4`) ainda não existem.

## 2. Escopo

### Objetivos (Goals)
- Inicializar o **Firebase JS SDK (`firebase`)** a partir das variáveis `EXPO_PUBLIC_FIREBASE_*` com `.env.example` documentado.
- Configurar persistência de sessão do Auth (`AsyncStorage` no mobile / `browserLocalPersistence` na Web) e cache offline do Cloud Firestore (`persistentLocalCache` na Web / `memoryLocalCache` no Expo Go).
- Versionar `firestore.rules` na raiz do repositório isolando `users/{userId}` e todas as subcoleções (`items`, `completions`) exclusivamente a `request.auth != null && request.auth.uid == userId`, com *deny-all* no restante.
- Implementar `FirebaseFirestoreAdapter` aderente ao contrato `FirestoreAdapter` já definido em `src/repositories/routine-repository.ts`.
- Expor `AuthProvider` e o hook `useAuth()` com `{ user, userId, isAnonymous, loading, isFirebaseConfigured }`.
- Ativar o repositório real do Firestore **condicionalmente**: apenas quando o Firebase estiver configurado **e** houver `user` autenticado, mantendo/restaurando `InMemoryFirestoreAdapter` caso contrário.

### Não-Objetivos (Non-Goals)
- Tela de Login `IF01`, cadastro E-mail/Senha e recuperação de senha (Issue `#7 / A3`).
- Modo Visitante (`Anonymous Auth`) e conversão de conta (Issue `#8 / A4`).
- Tela `IF06` (Ajustes e Logout) (Issue `#10 / A6`).
- Substituir `userId = 'current-user'` nas telas de `rotina-core` agora (evita conflitos entre frentes; entra acoplado à entrega de sessão autenticada em `A3`/`A4`).

### Anti-Objetivos (Anti-Goals)
- Instalar `@react-native-firebase/*` ou qualquer dependência nativa que quebre o Expo Go.
- Crashar o app no startup caso o desenvolvedor ainda não tenha criado o `.env` local.
- Versionar credenciais reais ou `.env` no histórico Git.

## 3. Restrições Técnicas
- **Expo Go estrito:** apenas pacotes JS puros ou já incluídos no runtime do Expo Go (`firebase`, `@react-native-async-storage/async-storage`).
- **Trade-off explícito do Firestore offline no Expo Go:** o Firebase JS SDK usa IndexedDB para cache persistente em disco na Web; no React Native/Expo Go não há IndexedDB, portanto o SDK opera com `memoryLocalCache()` no mobile (suporta leituras em cache e fila de escritas offline durante a sessão ativa, sincronizando ao reconectar, sem persistência SQLite após encerramento completo do processo).
- **Segurança (`[Seguranca.NF001]`, `[Seguranca.NF002]`):** transporte exclusivamente HTTPS/TLS gerenciado pelo SDK; `firestore.rules` com bloqueio padrão (`allow read, write: if false;`) fora de `users/{userId}/**`.

## 4. Abordagens Consideradas

### Abordagem A — Inicialização *lazy* + troca condicional no `AuthProvider` *(Escolhida)*
- `firebase-config.ts` valida `EXPO_PUBLIC_FIREBASE_*` sem efeitos colaterais.
- `firebase.ts` inicializa `app`, `auth` e `db` sob demanda (retornando `null` se sem `.env`).
- `AuthProvider` escuta `onAuthStateChanged` e chama o `setRoutineRepository()` já existente em `src/services/routine-service.ts` para alternar entre `FirebaseFirestoreAdapter` (usuário autenticado) e `InMemoryFirestoreAdapter` (sem sessão ou sem `.env`).
- *Trade-off:* aproveita diretamente o contrato já desenhado pela frente `rotina-core`, mantém cada unidade pequena e testável e concentra a regra de ativação em um único ponto.

### Abordagem B — Proxy dinâmico em `routine-service.ts` *(Descartada)*
- Um `DynamicRoutineRepository` decidiria em cada chamada de método se delega ao Firestore ou à memória com base em `auth.currentUser`.
- *Trade-off:* adiciona indireção redundante com `setRoutineRepository()` e torna o estado ativo do repositório menos transparente durante transições de login/logout.

## 5. Arquitetura e Unidades

| Arquivo | Responsabilidade | Dependências |
| :--- | :--- | :--- |
| `.env.example` | Documentar as 6 chaves `EXPO_PUBLIC_FIREBASE_*` necessárias (sem valores reais). | — |
| `firestore.rules` | Regras de segurança restringindo `users/{userId}` e `users/{userId}/{document=**}` a `request.auth != null && request.auth.uid == userId`; bloqueio explícito para qualquer outro caminho. | — |
| `src/lib/firebase-config.ts` | Ler e validar `EXPO_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`. Função pura `readFirebaseConfig(env)` retornando `FirebaseEnvConfig \| null`. | Nenhuma (Node/RN puro) |
| `src/lib/firebase.ts` | Inicialização *lazy* e idempotente (`getFirebaseServices()`): cria/reutiliza `FirebaseApp`, `Auth` (com persistência `AsyncStorage` no mobile / `browserLocalPersistence` na Web) e `Firestore` (`persistentLocalCache()` na Web / `memoryLocalCache()` no mobile). | `firebase/*`, `AsyncStorage`, `react-native` (`Platform`), `firebase-config.ts` |
| `src/repositories/firebase-firestore-adapter.ts` | Classe `FirebaseFirestoreAdapter` implementando todos os 7 métodos de `FirestoreAdapter` (`getDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `getDocs`, `generateId`, `now`) sobre o SDK `firebase/firestore`, convertendo `Timestamp` para `FirestoreTimestampLike` e tratando filtros `FirestoreWhereFilter`. | `firebase/firestore`, `routine-repository.ts` |
| `src/services/routine-service.ts` | Adicionar `resetRoutineRepositoryToInMemory()` (além dos existentes `getRoutineRepository`, `setRoutineRepository`, `getSharedInMemoryAdapter`) para o `AuthProvider` restaurar o fallback limpo ao encerrar sessão. | `routine-repository.ts` |
| `src/contexts/auth-context.tsx` | `AuthProvider` e `AuthContext` expondo `{ user, userId, isAnonymous, loading, isFirebaseConfigured }`. Quando `getFirebaseServices()` retorna `null`, resolve imediatamente `loading: false`, `user: null` e mantém `InMemoryFirestoreAdapter`. Quando configurado, assina `onAuthStateChanged` e alterna o repositório via `setRoutineRepository` / `resetRoutineRepositoryToInMemory`. | `firebase/auth`, `firebase.ts`, `firebase-firestore-adapter.ts`, `routine-service.ts` |
| `src/hooks/use-auth.ts` | Hook `useAuth()` consumindo `AuthContext` com erro explícito caso usado fora de `AuthProvider`. | `auth-context.tsx` |
| `src/app/_layout.tsx` | Envolver a árvore de navegação com `<AuthProvider>`. | `auth-context.tsx` |

## 6. Tratamento de Erros e Fluxo de Dados
- **`.env` ausente ou parcial:** `readFirebaseConfig()` retorna `null`; `getFirebaseServices()` retorna `null` sem lançar exceção; `AuthProvider` define `isFirebaseConfigured = false`, `loading = false`, `user = null` e mantém `InMemoryFirestoreAdapter`.
- **Erro na inicialização do `Auth` (ex.: Fast Refresh com `initializeAuth` já chamado):** fallback seguro para `getAuth(app)` para evitar erro `auth/already-initialized` durante hot reload no Expo Go.
- **Erro na inicialização do `Firestore` (ex.: Fast Refresh com `initializeFirestore` já chamado):** fallback seguro para `getFirestore(app)`.
- **Conversão de datas/timestamps no adapter:** `now()` retorna `{ toDate: () => new Date(), toMillis: () => Date.now() }` compatível com `Timestamp.now()` do Firestore, preservando o contrato `FirestoreTimestampLike`.

## 7. Estratégia de Testes e Verificação
- `tests/firebase-config.test.ts`: testa `readFirebaseConfig()` com env completo, espaços em branco (`trim`), variáveis faltando e env vazio.
- `tests/firebase-firestore-adapter.test.ts`: testa `FirebaseFirestoreAdapter` com operações CRUD, filtros `where`, `generateId` e `now()` sobre um cliente Firestore injetável/dublê, além da integração com `FirestoreRoutineRepository` e `resetRoutineRepositoryToInMemory()`.
- `tests/firestore-rules.test.ts`: validação estrutural do arquivo `firestore.rules` garantindo presença de `rules_version = '2'`, escopo `users/{userId}`, guarda `request.auth != null && request.auth.uid == userId` e *deny-all* global.
- Higiene obrigatória: `npx tsc --noEmit`, `npm run lint` e `npm test` (todos verdes).
- Nota de deploy manual do usuário: publicar `firestore.rules` no Firebase Console (ou `firebase deploy --only firestore:rules`) e preencher `.env` local a partir de `.env.example` quando o projeto Firebase estiver criado.

## 8. O que fica a cargo da implementação
- Tipagem exata da importação de `getReactNativePersistence` conforme a versão instalada de `firebase` (v11/v12) sob `tsconfig` estrito.
- Detalhes internos de assinatura do `onAuthStateChanged` e limpeza no `useEffect`.
