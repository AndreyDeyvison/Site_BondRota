import type { DataISO, Turno } from './common';

export interface Motorista {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  data_nasc: DataISO;
  turno: Turno;
  cidade_trabalho: string;
  residencia: string;
  foto?: string;
}

/** Payload de `POST /motoristas/`. */
export interface MotoristaCreatePayload {
  nome: string;
  cpf: string;
  senha: string;
  telefone?: string;
  data_nasc: DataISO;
  turno: Turno;
  cidade_trabalho: string;
  residencia: string;
  foto?: string;
}

export type MotoristaUpdatePayload = Partial<Omit<MotoristaCreatePayload, 'cpf' | 'senha'>>;
