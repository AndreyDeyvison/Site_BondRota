import type { DataISO, DiaSemana, Sentido, TimestampRFC3339, Turno } from './common';

export type TipoVinculo = 'estudante' | 'estagio';

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  data_nasc: DataISO;
  foto?: string;
  vinculos?: Vinculo[];
}

/** Payload de `POST /clientes/`. */
export interface ClienteCreatePayload {
  nome: string;
  cpf: string;
  senha: string;
  telefone?: string;
  data_nasc: DataISO;
  foto?: string;
}

/** Payload de `PUT /clientes/{clienteID}` — CPF e senha não são atualizáveis por aqui. */
export type ClienteUpdatePayload = Partial<Omit<ClienteCreatePayload, 'cpf' | 'senha'>>;

/** Dia fixo de transporte vinculado ao registro — é como a API devolve `horarios_fixos` ao listar/buscar vínculos. */
export interface HorarioFixo {
  id: number;
  vinculo_id: number;
  /** Dia útil (1=Seg … 5=Sex). */
  dia_semana: DiaSemana;
}

export interface Vinculo {
  id: number;
  cliente_id: number;
  tipo: TipoVinculo;
  turno: Turno;
  destino_id: number;
  rota_interna_id: number;
  curso?: string;
  comprovante?: string;
  validade: DataISO;
  horarios_fixos: HorarioFixo[];
  reservas?: Reserva[];
}

/** Payload de `POST /clientes/{clienteID}/vinculos/`. */
export interface VinculoCreatePayload {
  tipo: TipoVinculo;
  turno: Turno;
  destino_id: number;
  rota_interna_id: number;
  curso?: string;
  comprovante?: string;
  validade: DataISO;
  horarios_fixos: DiaSemana[];
}

/** Payload de `PUT /clientes/{clienteID}/vinculos/{vinculoID}`. */
export type VinculoUpdatePayload = Partial<VinculoCreatePayload>;

export type ReservaStatus = 'confirmada' | 'cancelada' | 'concluida' | string;

export interface Reserva {
  id: number;
  vinculo_id: number;
  data_viagem: DataISO;
  turno: Turno;
  sentido: Sentido;
  status?: ReservaStatus;
  criado_em?: TimestampRFC3339;
}

/** Payload de `POST /clientes/{clienteID}/vinculos/{vinculoID}/reservas/`. */
export interface ReservaCreatePayload {
  data_viagem: DataISO;
  turno: Turno;
  sentido: Sentido;
}
