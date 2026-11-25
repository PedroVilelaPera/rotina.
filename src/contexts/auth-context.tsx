import { onAuthStateChanged, type User } from 'firebase/auth';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

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
  email: string | null;
  isAnonymous: boolean;
  loading: boolean;
  isFirebaseConfigured: boolean;
  refreshAuthUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthSnapshot {
  user: User | null;
  email: string | null;
  isAnonymous: boolean;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const services = getFirebaseServices();
  const isConfigured = services !== null;

  const [snapshot, setSnapshot] = useState<AuthSnapshot>({
    user: null,
    email: null,
    isAnonymous: false,
  });
  const [loading, setLoading] = useState<boolean>(isConfigured);

  useEffect(() => {
    if (!services) {
      resetRoutineRepositoryToInMemory();
      return;
    }

    const unsubscribe = onAuthStateChanged(services.auth, (nextUser) => {
      if (nextUser) {
        const adapter = new FirebaseFirestoreAdapter(services.db);
        setRoutineRepository(createRoutineRepository(adapter));
      } else {
        resetRoutineRepositoryToInMemory();
      }

      setSnapshot({
        user: nextUser,
        email: nextUser?.email ?? null,
        isAnonymous: nextUser?.isAnonymous ?? false,
      });
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [services]);

  const refreshAuthUser = useCallback(async () => {
    if (!services) {
      return;
    }

    const currentUser = services.auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
    }

    setSnapshot({
      user: currentUser,
      email: currentUser?.email ?? null,
      isAnonymous: currentUser?.isAnonymous ?? false,
    });
  }, [services]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: snapshot.user,
      userId: snapshot.user?.uid ?? null,
      email: snapshot.email,
      isAnonymous: snapshot.isAnonymous,
      loading,
      isFirebaseConfigured: isConfigured,
      refreshAuthUser,
    }),
    [snapshot, loading, isConfigured, refreshAuthUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
