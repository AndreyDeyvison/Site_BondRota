'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { buscarCliente } from '@/services/clientes';
import type { Cliente } from '@/types/cliente';

interface UseClienteResult {
  cliente: Cliente | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Carrega `GET /clientes/{clienteID}` — dados cadastrais do cliente logado
 * com a árvore completa de vínculos e horários fixos, para alimentar o painel do cliente.
 */
export function useCliente(clienteId: number | null): UseClienteResult {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCliente = useCallback(() => {
    if (clienteId === null) return Promise.resolve();
    const id = clienteId;
    return Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
      })
      .then(() => buscarCliente(id))
      .then((result) => {
        setCliente(result);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os dados do cliente.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clienteId]);

  useEffect(() => {
    fetchCliente();
  }, [fetchCliente]);

  return { cliente, loading, error, refetch: fetchCliente };
}
