import {
  createRoutineRepository,
  InMemoryFirestoreAdapter,
} from '../repositories/routine-repository';
import type { IRoutineRepository } from '../types/routine';

let sharedRepository: IRoutineRepository | null = null;
let sharedAdapter: InMemoryFirestoreAdapter | null = null;

/**
 * Retorna a instância compartilhada do repositório de rotina.
 * Garante desacoplamento de infraestrutura enquanto a frente auth-infra finaliza a configuração oficial do Firebase.
 */
export function getRoutineRepository(): IRoutineRepository {
  if (!sharedRepository) {
    sharedAdapter = new InMemoryFirestoreAdapter();
    sharedRepository = createRoutineRepository(sharedAdapter);
  }
  return sharedRepository;
}

/**
 * Permite substituir a instância compartilhada (ex: conectar Firebase oficial ou mock).
 */
export function setRoutineRepository(repository: IRoutineRepository): void {
  sharedRepository = repository;
}

/**
 * Retorna o adaptador em memória compartilhado (útil para inspeção ou testes rápidos).
 */
export function getSharedInMemoryAdapter(): InMemoryFirestoreAdapter | null {
  return sharedAdapter;
}
