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
