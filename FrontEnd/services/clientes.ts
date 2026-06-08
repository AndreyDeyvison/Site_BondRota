import { apiRequest } from './api';
import type {
  Cliente,
  ClienteCreatePayload,
  ClienteUpdatePayload,
  Reserva,
  ReservaCreatePayload,
  Vinculo,
  VinculoCreatePayload,
  VinculoUpdatePayload,
} from '@/types/cliente';

/** `POST /clientes/` — cadastro de cliente pelo admin (requer token de administrador). */
export function criarCliente(payload: ClienteCreatePayload): Promise<Cliente> {
  return apiRequest<Cliente>('/clientes/', { method: 'POST', body: payload });
}

/** `GET /clientes/` — lista de clientes (visão administrativa). */
export function listarClientes(): Promise<Cliente[]> {
  return apiRequest<Cliente[]>('/clientes/');
}

/** `GET /clientes/{clienteID}` — árvore completa: dados cadastrais + vínculos + horários fixos. */
export function buscarCliente(clienteId: number): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${clienteId}`);
}

/** `PUT /clientes/{clienteID}` — atualiza dados cadastrais do cliente. */
export function atualizarCliente(clienteId: number, payload: ClienteUpdatePayload): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${clienteId}`, { method: 'PUT', body: payload });
}

/** `DELETE /clientes/{clienteID}` — remove o cliente. */
export function removerCliente(clienteId: number): Promise<void> {
  return apiRequest<void>(`/clientes/${clienteId}`, { method: 'DELETE' });
}

/** `GET /clientes/{clienteID}/vinculos/` — vínculos do cliente (histórico/renovações). */
export function listarVinculosDoCliente(clienteId: number): Promise<Vinculo[]> {
  return apiRequest<Vinculo[]>(`/clientes/${clienteId}/vinculos/`);
}

/** `GET /clientes/{clienteID}/reservas/` — reservas ativas do cliente logado. */
export function listarReservasDoCliente(clienteId: number): Promise<Reserva[]> {
  return apiRequest<Reserva[]>(`/clientes/${clienteId}/reservas/`);
}

/** `POST /clientes/{clienteID}/vinculos/` — vincula o cliente a destino e rota. */
export function criarVinculo(clienteId: number, payload: VinculoCreatePayload): Promise<Vinculo> {
  return apiRequest<Vinculo>(`/clientes/${clienteId}/vinculos/`, { method: 'POST', body: payload });
}

/** `PUT /clientes/{clienteID}/vinculos/{vinculoID}` — atualiza o vínculo. */
export function atualizarVinculo(
  clienteId: number,
  vinculoId: number,
  payload: VinculoUpdatePayload,
): Promise<Vinculo> {
  return apiRequest<Vinculo>(`/clientes/${clienteId}/vinculos/${vinculoId}`, { method: 'PUT', body: payload });
}

/** `DELETE /clientes/{clienteID}/vinculos/{vinculoID}` — remove o vínculo. */
export function removerVinculo(clienteId: number, vinculoId: number): Promise<void> {
  return apiRequest<void>(`/clientes/${clienteId}/vinculos/${vinculoId}`, { method: 'DELETE' });
}

/**
 * `POST /clientes/{clienteID}/vinculos/{vinculoID}/reservas/` — cria reserva a partir do vínculo.
 * A API responde 409 quando já existe uma reserva ativa para os mesmos
 * `data_viagem` + `turno` + `sentido`; isso é repassado como `ApiError` (status 409)
 * para que o chamador trate o conflito.
 */
export function criarReserva(
  clienteId: number,
  vinculoId: number,
  payload: ReservaCreatePayload,
): Promise<Reserva> {
  return apiRequest<Reserva>(`/clientes/${clienteId}/vinculos/${vinculoId}/reservas/`, {
    method: 'POST',
    body: payload,
  });
}
