'use client';

import { useCallback, useState } from 'react';
import { ApiError } from '@/services/api';

interface UseEntityMutationResult<TPayload, TResult> {
  mutate: (payload: TPayload) => Promise<TResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook genérico de criação/atualização — cobre o padrão repetido nos
 * formulários de cadastro: chamar o service, controlar loading e traduzir
 * o texto puro de erro da API para uma mensagem amigável.
 *
 * `mutateFn` deve ser uma referência estável (ex.: a função do service).
 */
export function useEntityMutation<TPayload, TResult>(
  mutateFn: (payload: TPayload) => Promise<TResult>,
  fallbackErrorMessage: string,
): UseEntityMutationResult<TPayload, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (payload: TPayload) => {
    setLoading(true);
    setError(null);
    try {
      return await mutateFn(payload);
    } catch (err) {
      let message = fallbackErrorMessage;
      if (err instanceof ApiError) {
        // Erros 5xx chegam como texto técnico cru do servidor (ex.: "internal
        // server error"), normalmente disparado por violação de unicidade
        // (placa, e-mail, CPF duplicados) que a API não trata com uma
        // resposta de validação — não faz sentido expor esse texto ao usuário.
        message = err.status >= 500
          ? `${fallbackErrorMessage} Verifique se algum dado único (placa, e-mail, CPF etc.) já não está cadastrado e tente novamente.`
          : err.message;
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutateFn, fallbackErrorMessage]);

  return { mutate, loading, error };
}
