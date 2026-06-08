import type { Turno } from './common';

/** Horário fixo de turno não comporta o turno Integral (IN). */
export type TurnoHorario = Exclude<Turno, 'IN'>;

export interface HorarioTurnoViagem {
  id: number;
  cidade: string;
  turno: TurnoHorario;
  /** Formato HH:mm. */
  horario_ida: string;
  /** Formato HH:mm — deve ser maior que `horario_ida`. */
  horario_volta: string;
}

export type HorarioTurnoViagemCreatePayload = Omit<HorarioTurnoViagem, 'id'>;

export type HorarioTurnoViagemUpdatePayload = Partial<HorarioTurnoViagemCreatePayload>;
