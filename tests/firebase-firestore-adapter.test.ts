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
    recurrence: { kind: 'daily', daysOfWeek: [] },
  });

  assert.equal(created.id, 'fb_id_1');
  assert.ok(store.has('users/uid-123/items/fb_id_1'));

  const toggle = await repository.toggleCompletion(
    'uid-123',
    { id: created.id, type: 'habit', scheduledTime: '08:00' },
    '2026-11-25',
  );
  assert.equal(toggle.action, 'completed');
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
