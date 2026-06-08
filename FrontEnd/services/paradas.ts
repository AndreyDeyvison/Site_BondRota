import { apiRequest } from './api';
import type { Parada, ParadaCreatePayload, ParadaUpdatePayload } from '@/types/parada';

export function criarParada(payload: ParadaCreatePayload): Promise<Parada> {
  return apiRequest<Parada>('/paradas/', { method: 'POST', body: payload });
}

export function listarParadas(): Promise<Parada[]> {
  return apiRequest<Parada[]>('/paradas/');
}

export function listarParadasPorCidade(cidade: string): Promise<Parada[]> {
  return apiRequest<Parada[]>(`/paradas/cidade/${encodeURIComponent(cidade)}`);
}

export function buscarParada(paradaId: number): Promise<Parada> {
  return apiRequest<Parada>(`/paradas/${paradaId}`);
}

export function atualizarParada(paradaId: number, payload: ParadaUpdatePayload): Promise<Parada> {
  return apiRequest<Parada>(`/paradas/${paradaId}`, { method: 'PUT', body: payload });
}

export function removerParada(paradaId: number): Promise<void> {
  return apiRequest<void>(`/paradas/${paradaId}`, { method: 'DELETE' });
}
