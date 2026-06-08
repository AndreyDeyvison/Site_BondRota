import type { DataISO, Sentido, TimestampRFC3339, Turno } from './common';

export type ViagemStatus = 'aguardando' | 'em_andamento' | 'concluida' | 'cancelada' | string;

/** Viagem retornada por `GET /viagens/` e `GET /viagens/{viagemID}` (com dados do ciclo). */
export interface Viagem {
  id: number;
  ciclo_id: number;
  motorista_id: number;
  veiculo_id?: number;
  rota_interna_id?: number;
  destino_id?: number;
  data_viagem: DataISO;
  turno: Turno;
  sentido: Sentido;
  status: ViagemStatus;
  criado_em?: TimestampRFC3339;
}

/** Localização em tempo real consumida via polling em `GET /viagens/{viagemID}/localizacao`. */
export interface Localizacao {
  latitude: number;
  longitude: number;
  velocidade_kmh: number;
  direcao_graus: number;
  registrado_em?: TimestampRFC3339;
}
