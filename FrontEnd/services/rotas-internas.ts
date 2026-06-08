import { apiRequest } from './api';
import type {
  RotaInterna,
  RotaInternaCreatePayload,
  RotaInternaParadasUpdatePayload,
} from '@/types/rota-interna';

export function criarRotaInterna(payload: RotaInternaCreatePayload): Promise<RotaInterna> {
  return apiRequest<RotaInterna>('/rotas-internas/', { method: 'POST', body: payload });
}

export function listarRotasInternas(): Promise<RotaInterna[]> {
  return apiRequest<RotaInterna[]>('/rotas-internas/');
}

export function listarRotasInternasPorCidade(cidade: string): Promise<RotaInterna[]> {
  return apiRequest<RotaInterna[]>(`/rotas-internas/cidade/${encodeURIComponent(cidade)}`);
}

export function buscarRotaInterna(rotaId: number): Promise<RotaInterna> {
  return apiRequest<RotaInterna>(`/rotas-internas/${rotaId}`);
}

/** Substitui a sequência completa de paradas (ordem de embarque) da rota. */
export function substituirParadasDaRota(
  rotaId: number,
  payload: RotaInternaParadasUpdatePayload,
): Promise<RotaInterna> {
  return apiRequest<RotaInterna>(`/rotas-internas/${rotaId}/paradas`, { method: 'PUT', body: payload });
}

export function removerRotaInterna(rotaId: number): Promise<void> {
  return apiRequest<void>(`/rotas-internas/${rotaId}`, { method: 'DELETE' });
}
