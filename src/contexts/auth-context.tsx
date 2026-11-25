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
