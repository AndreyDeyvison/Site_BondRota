import { apiRequest } from './api';
import type {
  HorarioTurnoViagem,
  HorarioTurnoViagemCreatePayload,
  HorarioTurnoViagemUpdatePayload,
} from '@/types/horario-turno-viagem';

export function criarHorarioTurnoViagem(
  payload: HorarioTurnoViagemCreatePayload,
): Promise<HorarioTurnoViagem> {
  return apiRequest<HorarioTurnoViagem>('/horarios-turno-viagem/', { method: 'POST', body: payload });
}

export function listarHorariosTurnoViagem(): Promise<HorarioTurnoViagem[]> {
  return apiRequest<HorarioTurnoViagem[]>('/horarios-turno-viagem/');
}

export function buscarHorarioTurnoViagem(horarioId: number): Promise<HorarioTurnoViagem> {
  return apiRequest<HorarioTurnoViagem>(`/horarios-turno-viagem/${horarioId}`);
}

export function atualizarHorarioTurnoViagem(
  horarioId: number,
  payload: HorarioTurnoViagemUpdatePayload,
): Promise<HorarioTurnoViagem> {
  return apiRequest<HorarioTurnoViagem>(`/horarios-turno-viagem/${horarioId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function removerHorarioTurnoViagem(horarioId: number): Promise<void> {
  return apiRequest<void>(`/horarios-turno-viagem/${horarioId}`, { method: 'DELETE' });
}
