import { apiRequest } from './api';
import type { Reserva } from '@/types/cliente';
import type { Localizacao, Viagem } from '@/types/viagem';

/** `GET /viagens/` — viagens atribuídas ao motorista autenticado. */
export function listarViagens(): Promise<Viagem[]> {
  return apiRequest<Viagem[]>('/viagens/');
}

/** `GET /viagens/{viagemID}` — detalhe da viagem, incluindo dados do ciclo. */
export function buscarViagem(viagemId: number): Promise<Viagem> {
  return apiRequest<Viagem>(`/viagens/${viagemId}`);
}

/** `GET /viagens/{viagemID}/reservas/` — passageiros alocados, para o checklist de presença. */
export function listarReservasDaViagem(viagemId: number): Promise<Reserva[]> {
  return apiRequest<Reserva[]>(`/viagens/${viagemId}/reservas/`);
}

/** `GET /viagens/{viagemID}/localizacao` — posição atual do veículo (consumido via polling). */
export function buscarLocalizacaoDaViagem(viagemId: number): Promise<Localizacao> {
  return apiRequest<Localizacao>(`/viagens/${viagemId}/localizacao`);
}
