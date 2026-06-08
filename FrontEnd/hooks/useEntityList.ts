'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';

interface UseEntityListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook genérico de listagem — cobre o padrão repetido em ~10 entidades
 * (destinos, paradas, rotas internas, veículos, motoristas, admins, etc.):
 * buscar ao montar, controlar loading/erro e permitir refetch manual.
 *
 * `fetchList` deve ser uma referência estável (ex.: a função exportada do
 * service, não uma arrow function recriada a cada render).
 */
export function useEntityList<T>(
  fetchList: () => Promise<T[]>,
  fallbackErrorMessage: string,
): UseEntityListResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    return Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
      })
      .then(() => fetchList())
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : fallbackErrorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchList, fallbackErrorMessage]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
