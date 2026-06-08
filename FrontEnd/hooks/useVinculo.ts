'use client';

import { useCallback, useState } from 'react';
import { ApiError } from '@/services/api';
import { criarVinculo } from '@/services/clientes';
import type { Vinculo, VinculoCreatePayload } from '@/types/cliente';

interface UseCriarVinculoResult {
  criar: (payload: VinculoCreatePayload) => Promise<Vinculo>;
  loading: boolean;
  error: string | null;
}

/** `POST /clientes/{clienteID}/vinculos/` — vincula o cliente logado a destino e rota. */
export function useCriarVinculo(clienteId: number | null): UseCriarVinculoResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const criar = useCallback(async (payload: VinculoCreatePayload) => {
    if (clienteId === null) throw new Error('Cliente não autenticado.');

    setLoading(true);
    setError(null);
    try {
      return await criarVinculo(clienteId, payload);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível criar o vínculo.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  return { criar, loading, error };
}
