import { apiRequest } from './api';
import type { Reserva } from '@/types/cliente';
import type { DataISO, Sentido, TimestampRFC3339, Turno } from '@/types/common';
import type { Localizacao, Viagem, ViagemStatus } from '@/types/viagem';

/**
 * Shape bruto devolvido por `GET /viagens/` e `GET /viagens/{viagemID}` — a API
 * aninha os dados da execução (`viagem`) e os do ciclo de planejamento
 * (`viagem`, motorista, veículo, rota, data, turno, cidade) separadamente.
 */
interface ViagemComCicloApi {
  viagem: {
    id: number;
    ciclo_viagem_id: number;
    sentido: Sentido;
    status: ViagemStatus;
    inicio_real?: TimestampRFC3339;
    fim_real?: TimestampRFC3339;
    created_at?: TimestampRFC3339;
  };
  ciclo: {
    data_viagem: DataISO;
    turno: Turno;
    cidade: string;
    rota_interna_id?: number;
    veiculo_id?: number;
    motorista_id: number;
  };
}

/** Achata `{ viagem, ciclo }` em um único objeto — ver o comentário em `types/viagem.ts`. */
function achatarViagem({ viagem, ciclo }: ViagemComCicloApi): Viagem {
  return {
    id: viagem.id,
    ciclo_viagem_id: viagem.ciclo_viagem_id,
    motorista_id: ciclo.motorista_id,
    veiculo_id: ciclo.veiculo_id,
    rota_interna_id: ciclo.rota_interna_id,
    data_viagem: ciclo.data_viagem,
    turno: ciclo.turno,
    cidade: ciclo.cidade,
    sentido: viagem.sentido,
    status: viagem.status,
    inicio_real: viagem.inicio_real,
    fim_real: viagem.fim_real,
    criado_em: viagem.created_at,
  };
}

/** `GET /viagens/` — todas as viagens com dados do ciclo (achatadas — ver `achatarViagem`). */
export function listarViagens(): Promise<Viagem[]> {
  return apiRequest<ViagemComCicloApi[]>('/viagens/').then((lista) => lista.map(achatarViagem));
}

/** `GET /viagens/{viagemID}` — detalhe da viagem, incluindo dados do ciclo (achatada). */
export function buscarViagem(viagemId: number): Promise<Viagem> {
  return apiRequest<ViagemComCicloApi>(`/viagens/${viagemId}`).then(achatarViagem);
}

/** `GET /viagens/{viagemID}/reservas/` — passageiros alocados, para o checklist de presença. */
export function listarReservasDaViagem(viagemId: number): Promise<Reserva[]> {
  return apiRequest<Reserva[]>(`/viagens/${viagemId}/reservas/`);
}

/** `GET /viagens/{viagemID}/localizacao` — posição atual do veículo (consumido via polling). */
export function buscarLocalizacaoDaViagem(viagemId: number): Promise<Localizacao> {
  return apiRequest<Localizacao>(`/viagens/${viagemId}/localizacao`);
}
