# Firebase Auth + Cloud Firestore Offline + Security Rules (`[A2]`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar Firebase JS SDK (Auth + Cloud Firestore com cache offline compatível com Expo Go), versionar `firestore.rules` isolando `users/{userId}/**`, implementar `FirebaseFirestoreAdapter` e expor `AuthProvider` / `useAuth()` com ativação condicional do repositório real apenas quando houver `.env` válido e sessão autenticada.

**Architecture:** Inicialização *lazy* do Firebase em `src/lib/firebase.ts` alimentada por `readFirebaseConfig()` puro (`src/lib/firebase-config.ts`). O `FirebaseFirestoreAdapter` implementa o contrato `FirestoreAdapter` já existente em `src/repositories/routine-repository.ts`, e o `AuthProvider` (`src/contexts/auth-context.tsx`) escuta `onAuthStateChanged` para alternar o repositório via `setRoutineRepository()` / `resetRoutineRepositoryToInMemory()`, mantendo `InMemoryFirestoreAdapter` como fallback seguro enquanto `A3`/`A4` não autenticam.

**Tech Stack:** React Native + Expo (Expo Go), TypeScript strict, Firebase JS SDK (`firebase`), `@react-native-async-storage/async-storage`, Node built-in test runner (`node --test`).

---

## File Structure

- Create: `.env.example` — template das 6 variáveis `EXPO_PUBLIC_FIREBASE_*`
- Create: `firestore.rules` — isolamento de dados `users/{userId}/**` (`[Seguranca.NF001]`)
- Create: `src/lib/firebase-config.ts` — leitura e validação pura das variáveis `EXPO_PUBLIC_FIREBASE_*`
- Create: `src/lib/firebase.ts` — inicialização *lazy* e segura para Fast Refresh de App, Auth e Firestore (Expo Go)
- Create: `src/repositories/firebase-firestore-adapter.ts` — implementação de `FirestoreAdapter` sobre `firebase/firestore` com bindings injetáveis para teste
- Modify: `src/repositories/index.ts` — re-exportar `firebase-firestore-adapter`
- Modify: `src/services/routine-service.ts` — adicionar `resetRoutineRepositoryToInMemory()`
- Create: `src/contexts/auth-context.tsx` — `AuthProvider` e `AuthContext` com troca condicional de repositório
- Create: `src/hooks/use-auth.ts` — hook `useAuth()`
- Modify: `src/app/_layout.tsx` — envolver árvore de navegação com `<AuthProvider>`
- Modify: `scripts/test-loader.mjs` — corrigir registro relativo no Windows
- Test: `tests/firestore-rules.test.ts`
- Test: `tests/firebase-config.test.ts`
- Test: `tests/firebase-firestore-adapter.test.ts`

---

### Task 1: Instalar dependências Firebase/AsyncStorage, criar `.env.example` e corrigir `test-loader`

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `scripts/test-loader.mjs:1-4`
- Create: `.env.example`

- [ ] **Step 1: Instalar `firebase` e `@react-native-async-storage/async-storage`**

Run: `npx expo install firebase @react-native-async-storage/async-storage`  
Expected: ambos instalados sem erros e sem módulos nativos incompatíveis com Expo Go.

- [ ] **Step 2: Criar `.env.example` na raiz do repositório**

```dotenv
# Configuração do Web App no Firebase Console (Configurações do Projeto -> Seus aplicativos -> Web)
# Copie este arquivo para .env e preencha os valores reais (nunca commite .env).
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Step 3: Corrigir `scripts/test-loader.mjs` para compatibilidade Windows/Unix**

```js
import { register } from 'node:module';

register('./ts-resolver.mjs', import.meta.url);
```

- [ ] **Step 4: Validar que a suíte existente passa**

Run: `npm test`  
Expected: todos os testes existentes passando (`fail 0`).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example scripts/test-loader.mjs
git commit -m "chore(firebase): instalar Firebase JS SDK, AsyncStorage e adicionar .env.example

Refs: #6"
```

---

### Task 2: Criar e testar `firestore.rules` (`[Seguranca.NF001]`)

**Files:**
- Create: `firestore.rules`
- Test: `tests/firestore-rules.test.ts`

- [ ] **Step 1: Escrever o teste falhando `tests/firestore-rules.test.ts`**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const rulesPath = resolve(process.cwd(), 'firestore.rules');

test('firestore.rules declara rules_version 2 e serviço cloud.firestore', () => {
  const content = readFileSync(rulesPath, 'utf8');
  assert.match(content, /rules_version\s*=\s*'2';/);
  assert.match(content, /service\s+cloud\.firestore\s*\{/);
});

test('firestore.rules isola users/{userId} e subcoleções ao próprio uid autenticado', () => {
  const content = readFileSync(rulesPath, 'utf8');
  assert.match(content, /match\s+\/users\/\{userId\}\s*\{/);
  assert.match(
    content,
    /request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId/,
  );
  assert.match(content, /match\s+\/\{document=\*\*\}\s*\{/);
});

test('firestore.rules aplica deny-all explícito fora de users/{userId}', () => {
  const content = readFileSync(rulesPath, 'utf8');
  assert.match(content, /allow\s+read,\s*write:\s*if\s+false;/);
});
```

- [ ] **Step 2: Rodar o teste e confirmar falha**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test tests/firestore-rules.test.ts`  
Expected: FAIL (`ENOENT: no such file or directory ... firestore.rules`).

- [ ] **Step 3: Criar `firestore.rules`**

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /{document=**} {
        allow read, write: if isOwner(userId);
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test tests/firestore-rules.test.ts`  
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add firestore.rules tests/firestore-rules.test.ts
git commit -m "feat(firebase): versionar firestore.rules com isolamento por uid

Restringe leitura e escrita em users/{userId} e subcolecoes ao usuario autenticado dono do uid e aplica deny-all no restante.

Refs: #6"
```

---

### Task 3: Implementar leitor/validador puro `src/lib/firebase-config.ts`

**Files:**
- Create: `src/lib/firebase-config.ts`
- Test: `tests/firebase-config.test.ts`

- [ ] **Step 1: Escrever o teste falhando `tests/firebase-config.test.ts`**

```ts
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
```

- [ ] **Step 2: Rodar o teste e confirmar falha**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test tests/firebase-config.test.ts`  
Expected: FAIL (`Cannot find module ... firebase-config`).

- [ ] **Step 3: Criar `src/lib/firebase-config.ts`**

```ts
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
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test tests/firebase-config.test.ts`  
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/firebase-config.ts tests/firebase-config.test.ts
git commit -m "feat(firebase): adicionar leitura e validacao tipada de EXPO_PUBLIC_FIREBASE_*

Refs: #6"
```

---

### Task 4: Implementar inicialização *lazy* do Firebase (`src/lib/firebase.ts`)

**Files:**
- Create: `src/lib/firebase.ts`

- [ ] **Step 1: Criar `src/lib/firebase.ts` com persistência Auth (AsyncStorage/Web) e cache Firestore por plataforma**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Persistence,
} from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
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
```

- [ ] **Step 2: Validar TypeScript e lint**

Run: `npx tsc --noEmit && npm run lint`  
Expected: exit 0 sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firebase.ts
git commit -m "feat(firebase): inicializar Firebase App, Auth e Firestore compativeis com Expo Go

Configura inicializacao lazy (retorna null sem .env), persistencia de sessao via AsyncStorage no mobile / browserLocalPersistence na Web e cache offline adequado por plataforma com protecao para Fast Refresh.

Refs: #6"
```

---

### Task 5: Implementar `FirebaseFirestoreAdapter` e `resetRoutineRepositoryToInMemory()`

**Files:**
- Create: `src/repositories/firebase-firestore-adapter.ts`
- Modify: `src/repositories/index.ts:1`
- Modify: `src/services/routine-service.ts:1-34`
- Test: `tests/firebase-firestore-adapter.test.ts`

- [ ] **Step 1: Escrever o teste falhando `tests/firebase-firestore-adapter.test.ts`**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FirebaseFirestoreAdapter,
  type FirestoreSdkBindings,
} from '../src/repositories/firebase-firestore-adapter';
import { createRoutineRepository } from '../src/repositories/routine-repository';
import {
  getRoutineRepository,
  resetRoutineRepositoryToInMemory,
  setRoutineRepository,
} from '../src/services/routine-service';

function createFakeSdkBindings(): {
  bindings: FirestoreSdkBindings;
  store: Map<string, Record<string, unknown>>;
} {
  const store = new Map<string, Record<string, unknown>>();
  let seq = 0;

  const bindings: FirestoreSdkBindings = {
    async getDoc(path) {
      const value = store.get(path);
      const id = path.split('/').pop() ?? '';
      return {
        id,
        exists: () => value !== undefined,
        data: () => (value ? { ...value } : undefined),
      };
    },
    async setDoc(path, data) {
      store.set(path, { ...data });
    },
    async updateDoc(path, data) {
      const existing = store.get(path);
      if (!existing) {
        throw new Error(`Documento não encontrado: ${path}`);
      }
      store.set(path, { ...existing, ...data });
    },
    async deleteDoc(path) {
      store.delete(path);
    },
    async getDocs(collectionPath, filters = []) {
      const prefix = `${collectionPath}/`;
      const docs = Array.from(store.entries())
        .filter(([key]) => {
          if (!key.startsWith(prefix)) return false;
          const rest = key.slice(prefix.length);
          return !rest.includes('/');
        })
        .filter(([, data]) =>
          filters.every((filter) => {
            const val = data[filter.field];
            if (filter.op === '==') return val === filter.value;
            if (filter.op === '>=') return String(val) >= String(filter.value);
            if (filter.op === '<=') return String(val) <= String(filter.value);
            if (filter.op === 'in') {
              return Array.isArray(filter.value) && filter.value.includes(val);
            }
            return false;
          }),
        )
        .map(([key, data]) => ({
          id: key.slice(prefix.length),
          exists: () => true,
          data: () => ({ ...data }),
        }));

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
      };
    },
    generateId() {
      seq += 1;
      return `fb_id_${seq}`;
    },
    now() {
      const now = new Date('2026-11-25T12:00:00.000Z');
      return {
        toDate: () => new Date(now.getTime()),
        toMillis: () => now.getTime(),
      };
    },
  };

  return { bindings, store };
}

test('FirebaseFirestoreAdapter executa CRUD e conclusões idempotentes via RoutineRepository', async () => {
  const { bindings, store } = createFakeSdkBindings();
  const adapter = new FirebaseFirestoreAdapter(bindings);
  const repository = createRoutineRepository(adapter);

  const created = await repository.createItem('uid-123', {
    type: 'habit',
    title: 'Beber água',
    scheduledTime: '08:00',
    recurrence: { frequency: 'daily', daysOfWeek: [] },
  });

  assert.equal(created.id, 'fb_id_1');
  assert.ok(store.has('users/uid-123/items/fb_id_1'));

  const toggle = await repository.toggleCompletion(
    'uid-123',
    { id: created.id, type: 'habit', scheduledTime: '08:00' },
    '2026-11-25',
  );
  assert.equal(toggle.completed, true);
  assert.ok(store.has('users/uid-123/completions/fb_id_1_2026-11-25'));

  const activeItems = await repository.listItems('uid-123', { onlyActive: true });
  assert.equal(activeItems.length, 1);
  assert.equal(activeItems[0].title, 'Beber água');
});

test('resetRoutineRepositoryToInMemory restaura instância em memória após troca', () => {
  const { bindings } = createFakeSdkBindings();
  const firebaseRepo = createRoutineRepository(new FirebaseFirestoreAdapter(bindings));

  setRoutineRepository(firebaseRepo);
  assert.equal(getRoutineRepository(), firebaseRepo);

  const fallbackRepo = resetRoutineRepositoryToInMemory();
  assert.notEqual(fallbackRepo, firebaseRepo);
  assert.equal(getRoutineRepository(), fallbackRepo);
});
```

- [ ] **Step 2: Rodar o teste e confirmar falha**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test tests/firebase-firestore-adapter.test.ts`  
Expected: FAIL (`Cannot find module ... firebase-firestore-adapter`).

- [ ] **Step 3: Criar `src/repositories/firebase-firestore-adapter.ts`, atualizar `src/repositories/index.ts` e `src/services/routine-service.ts`**

`src/repositories/firebase-firestore-adapter.ts`:
```ts
import {
  collection,
  deleteDoc as firestoreDeleteDoc,
  doc,
  type Firestore,
  getDoc as firestoreGetDoc,
  getDocs as firestoreGetDocs,
  query,
  setDoc as firestoreSetDoc,
  Timestamp,
  updateDoc as firestoreUpdateDoc,
  where,
} from 'firebase/firestore';

import type { FirestoreTimestampLike } from '../types/routine';
import type {
  FirestoreAdapter,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreWhereFilter,
} from './routine-repository';

export type FirestoreSdkBindings = FirestoreAdapter;

export function createFirestoreSdkBindings(db: Firestore): FirestoreSdkBindings {
  return {
    async getDoc(path: string): Promise<FirestoreDocumentSnapshotLike> {
      const snapshot = await firestoreGetDoc(doc(db, path));
      return {
        id: snapshot.id,
        exists: () => snapshot.exists(),
        data: () => snapshot.data() as Record<string, unknown> | undefined,
      };
    },

    async setDoc(path: string, data: Record<string, unknown>): Promise<void> {
      await firestoreSetDoc(doc(db, path), data);
    },

    async updateDoc(path: string, data: Record<string, unknown>): Promise<void> {
      await firestoreUpdateDoc(doc(db, path), data);
    },

    async deleteDoc(path: string): Promise<void> {
      await firestoreDeleteDoc(doc(db, path));
    },

    async getDocs(
      collectionPath: string,
      filters: FirestoreWhereFilter[] = [],
    ): Promise<FirestoreQuerySnapshotLike> {
      const colRef = collection(db, collectionPath);
      const constraints = filters.map((filter) =>
        where(filter.field, filter.op, filter.value),
      );
      const snapshot = await firestoreGetDocs(
        constraints.length > 0 ? query(colRef, ...constraints) : colRef,
      );
      const docs: FirestoreDocumentSnapshotLike[] = snapshot.docs.map((item) => ({
        id: item.id,
        exists: () => true,
        data: () => item.data() as Record<string, unknown>,
      }));

      return {
        docs,
        empty: snapshot.empty,
        size: snapshot.size,
      };
    },

    generateId(collectionPath: string): string {
      return doc(collection(db, collectionPath)).id;
    },

    now(): FirestoreTimestampLike {
      return Timestamp.now();
    },
  };
}

export class FirebaseFirestoreAdapter implements FirestoreAdapter {
  private readonly bindings: FirestoreSdkBindings;

  constructor(dbOrBindings: Firestore | FirestoreSdkBindings) {
    this.bindings =
      'getDoc' in dbOrBindings
        ? dbOrBindings
        : createFirestoreSdkBindings(dbOrBindings);
  }

  getDoc(path: string): Promise<FirestoreDocumentSnapshotLike> {
    return this.bindings.getDoc(path);
  }

  setDoc(path: string, data: Record<string, unknown>): Promise<void> {
    return this.bindings.setDoc(path, data);
  }

  updateDoc(path: string, data: Record<string, unknown>): Promise<void> {
    return this.bindings.updateDoc(path, data);
  }

  deleteDoc(path: string): Promise<void> {
    return this.bindings.deleteDoc(path);
  }

  getDocs(
    collectionPath: string,
    filters?: FirestoreWhereFilter[],
  ): Promise<FirestoreQuerySnapshotLike> {
    return this.bindings.getDocs(collectionPath, filters);
  }

  generateId(collectionPath: string): string {
    return this.bindings.generateId(collectionPath);
  }

  now(): FirestoreTimestampLike {
    return this.bindings.now();
  }
}
```

`src/repositories/index.ts`:
```ts
export * from './routine-repository';
export * from './firebase-firestore-adapter';
```

Adicionar em `src/services/routine-service.ts`:
```ts
/**
 * Restaura o repositório compartilhado para o adaptador em memória (usado ao encerrar sessão ou sem Firebase configurado).
 */
export function resetRoutineRepositoryToInMemory(): IRoutineRepository {
  if (!sharedAdapter) {
    sharedAdapter = new InMemoryFirestoreAdapter();
  }
  sharedRepository = createRoutineRepository(sharedAdapter);
  return sharedRepository;
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test tests/firebase-firestore-adapter.test.ts`  
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add src/repositories/firebase-firestore-adapter.ts src/repositories/index.ts src/services/routine-service.ts tests/firebase-firestore-adapter.test.ts
git commit -m "feat(firebase): implementar FirebaseFirestoreAdapter e resetRoutineRepositoryToInMemory

Refs: #6"
```

---

### Task 6: Implementar `AuthProvider`, `useAuth()` e integrar no `RootLayout`

**Files:**
- Create: `src/contexts/auth-context.tsx`
- Create: `src/hooks/use-auth.ts`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Criar `src/contexts/auth-context.tsx`**

```tsx
import { onAuthStateChanged, type User } from 'firebase/auth';
import React, { createContext, useEffect, useMemo, useState } from 'react';

import { getFirebaseServices } from '@/lib/firebase';
import { FirebaseFirestoreAdapter } from '@/repositories/firebase-firestore-adapter';
import { createRoutineRepository } from '@/repositories/routine-repository';
import {
  resetRoutineRepositoryToInMemory,
  setRoutineRepository,
} from '@/services/routine-service';

export interface AuthContextValue {
  user: User | null;
  userId: string | null;
  isAnonymous: boolean;
  loading: boolean;
  isFirebaseConfigured: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const services = getFirebaseServices();
  const isConfigured = services !== null;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isConfigured);

  useEffect(() => {
    if (!services) {
      resetRoutineRepositoryToInMemory();
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(services.auth, (nextUser) => {
      if (nextUser) {
        const adapter = new FirebaseFirestoreAdapter(services.db);
        setRoutineRepository(createRoutineRepository(adapter));
      } else {
        resetRoutineRepositoryToInMemory();
      }

      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [services]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?.uid ?? null,
      isAnonymous: user?.isAnonymous ?? false,
      loading,
      isFirebaseConfigured: isConfigured,
    }),
    [user, loading, isConfigured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

- [ ] **Step 2: Criar `src/hooks/use-auth.ts`**

```ts
import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
}
```

- [ ] **Step 3: Envolver a navegação em `src/app/_layout.tsx` com `<AuthProvider>`**

Importar `AuthProvider` de `../contexts/auth-context` e envolver `<ThemeProvider value={appDarkTheme}>` com `<AuthProvider>...</AuthProvider>`.

- [ ] **Step 4: Rodar verificação completa obrigatória**

Run: `npx tsc --noEmit && npm run lint && npm test`  
Expected: 0 erros no TypeScript, 0 erros no ESLint, 100% dos testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/auth-context.tsx src/hooks/use-auth.ts src/app/_layout.tsx
git commit -m "feat(auth): criar AuthProvider e hook useAuth com ativacao condicional do Firestore

Conecta onAuthStateChanged no RootLayout, alternando para FirebaseFirestoreAdapter apenas com Firebase configurado e sessao ativa, preservando fallback em memoria enquanto A3/A4 nao autenticam.

Refs: #6"
```
