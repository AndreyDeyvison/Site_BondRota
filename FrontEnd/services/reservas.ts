import { apiRequest } from './api';
import type { Reserva, ReservaCreatePayload } from '@/types/cliente';

export type ReservaUpdatePayload = Partial<ReservaCreatePayload>;

/** `GET /reservas/` — todas as reservas do sistema (visão administrativa). */
export function listarTodasReservas(): Promise<Reserva[]> {
  return apiRequest<Reserva[]>('/reservas/');
}

export function buscarReserva(reservaId: number): Promise<Reserva> {
  return apiRequest<Reserva>(`/reservas/${reservaId}`);
}

export function atualizarReserva(reservaId: number, payload: ReservaUpdatePayload): Promise<Reserva> {
  return apiRequest<Reserva>(`/reservas/${reservaId}`, { method: 'PUT', body: payload });
}

export function cancelarReserva(reservaId: number): Promise<Reserva> {
  return apiRequest<Reserva>(`/reservas/${reservaId}/cancelar`, { method: 'POST' });
}

export function removerReserva(reservaId: number): Promise<void> {
  return apiRequest<void>(`/reservas/${reservaId}`, { method: 'DELETE' });
}
