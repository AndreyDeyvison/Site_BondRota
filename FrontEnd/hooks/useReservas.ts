'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { criarReserva, listarReservasDoCliente } from '@/services/clientes';
import type { Reserva, ReservaCreatePayload } from '@/types/cliente';

interface UseReservasResult {
  reservas: Reserva[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /**
   * Cria uma reserva a partir de um vínculo. Se a API responder 409 (já existe
   * reserva ativa para a mesma data/turno/sentido), o erro é traduzido para uma
   * mensagem amigável mantendo `status === 409` para o chamador decidir o tratamento.
   */
  reservar: (vinculoId: number, payload: ReservaCreatePayload) => Promise<Reserva>;
}

/** `GET /clientes/{clienteID}/reservas/` + criação via vínculo, com bloqueio de conflito 409. */
export function useReservas(clienteId: number | null): UseReservasResult {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservas = useCallback(() => {
    if (clienteId === null) return Promise.resolve();
    const id = clienteId;
    return Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
      })
      .then(() => listarReservasDoCliente(id))
      .then((result) => {
        setReservas(result);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as reservas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clienteId]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  const reservar = useCallback(async (vinculoId: number, payload: ReservaCreatePayload) => {
    if (clienteId === null) throw new Error('Cliente não autenticado.');

    try {
      const reserva = await criarReserva(clienteId, vinculoId, payload);
      setReservas((prev) => [...prev, reserva]);
      return reserva;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        throw new ApiError(409, 'Já existe uma reserva ativa para esta data, turno e sentido.');
      }
      throw err;
    }
  }, [clienteId]);

  return { reservas, loading, error, refetch: fetchReservas, reservar };
}
