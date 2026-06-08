import type { DataISO, Sentido, TimestampRFC3339, Turno } from './common';

/** `programada` é o estado inicial (gerado pelo planejamento); `iniciar`/`concluir`/`cancelar` levam aos demais. */
export type ViagemStatus = 'programada' | 'em_andamento' | 'concluida' | 'cancelada' | string;

/**
 * Viagem retornada por `GET /viagens/` e `GET /viagens/{viagemID}`.
 *
 * A API devolve um objeto aninhado `{ viagem, ciclo }` — `services/viagens.ts`
 * achata essa estrutura aqui porque os dados do ciclo (motorista, veículo,
 * rota, data, turno, cidade) descrevem a mesma viagem do ponto de vista de
 * quem consome (telas de monitoramento, KPIs, listagens).
 */
export interface Viagem {
  id: number;
  ciclo_viagem_id: number;
  motorista_id: number;
  veiculo_id?: number;
  rota_interna_id?: number;
  data_viagem: DataISO;
  turno: Turno;
  cidade: string;
  sentido: Sentido;
  status: ViagemStatus;
  inicio_real?: TimestampRFC3339;
  fim_real?: TimestampRFC3339;
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
