import { apiRequest } from './api';
import type { Veiculo, VeiculoCreatePayload, VeiculoUpdatePayload } from '@/types/veiculo';

export function criarVeiculo(payload: VeiculoCreatePayload): Promise<Veiculo> {
  return apiRequest<Veiculo>('/veiculos/', { method: 'POST', body: payload });
}

export function listarVeiculos(): Promise<Veiculo[]> {
  return apiRequest<Veiculo[]>('/veiculos/');
}

export function buscarVeiculo(veiculoId: number): Promise<Veiculo> {
  return apiRequest<Veiculo>(`/veiculos/${veiculoId}`);
}

export function atualizarVeiculo(veiculoId: number, payload: VeiculoUpdatePayload): Promise<Veiculo> {
  return apiRequest<Veiculo>(`/veiculos/${veiculoId}`, { method: 'PUT', body: payload });
}

export function removerVeiculo(veiculoId: number): Promise<void> {
  return apiRequest<void>(`/veiculos/${veiculoId}`, { method: 'DELETE' });
}
