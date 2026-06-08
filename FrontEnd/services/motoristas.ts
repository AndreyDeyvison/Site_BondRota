import { apiRequest } from './api';
import type { Motorista, MotoristaCreatePayload, MotoristaUpdatePayload } from '@/types/motorista';

export function criarMotorista(payload: MotoristaCreatePayload): Promise<Motorista> {
  return apiRequest<Motorista>('/motoristas/', { method: 'POST', body: payload });
}

export function listarMotoristas(): Promise<Motorista[]> {
  return apiRequest<Motorista[]>('/motoristas/');
}

export function buscarMotorista(motoristaId: number): Promise<Motorista> {
  return apiRequest<Motorista>(`/motoristas/${motoristaId}`);
}

export function atualizarMotorista(motoristaId: number, payload: MotoristaUpdatePayload): Promise<Motorista> {
  return apiRequest<Motorista>(`/motoristas/${motoristaId}`, { method: 'PUT', body: payload });
}

export function removerMotorista(motoristaId: number): Promise<void> {
  return apiRequest<void>(`/motoristas/${motoristaId}`, { method: 'DELETE' });
}
