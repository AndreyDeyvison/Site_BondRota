import { apiRequest } from './api';
import type { Destino, DestinoCreatePayload, DestinoUpdatePayload } from '@/types/destino';

export function criarDestino(payload: DestinoCreatePayload): Promise<Destino> {
  return apiRequest<Destino>('/destinos/', { method: 'POST', body: payload });
}

export function listarDestinos(): Promise<Destino[]> {
  return apiRequest<Destino[]>('/destinos/');
}

export function listarDestinosPorCidade(cidade: string): Promise<Destino[]> {
  return apiRequest<Destino[]>(`/destinos/cidade/${encodeURIComponent(cidade)}`);
}

export function buscarDestino(destinoId: number): Promise<Destino> {
  return apiRequest<Destino>(`/destinos/${destinoId}`);
}

export function atualizarDestino(destinoId: number, payload: DestinoUpdatePayload): Promise<Destino> {
  return apiRequest<Destino>(`/destinos/${destinoId}`, { method: 'PUT', body: payload });
}

export function removerDestino(destinoId: number): Promise<void> {
  return apiRequest<void>(`/destinos/${destinoId}`, { method: 'DELETE' });
}
