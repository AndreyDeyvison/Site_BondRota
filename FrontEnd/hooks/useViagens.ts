'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { buscarViagem, listarReservasDaViagem, listarViagens } from '@/services/viagens';
import type { Reserva } from '@/types/cliente';
import type { Viagem } from '@/types/viagem';

interface UseViagensResult {
  viagens: Viagem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** `GET /viagens/` — todas as viagens com dados do ciclo, para o painel de monitoramento do admin. */
export function useViagens(): UseViagensResult {
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViagens = useCallback(() => {
    return Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
      })
      .then(() => listarViagens())
      .then((result) => {
        setViagens(result);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as viagens.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchViagens();
  }, [fetchViagens]);

  return { viagens, loading, error, refetch: fetchViagens };
}

interface UseViagemResult {
  viagem: Viagem | null;
  /** Passageiros/reservas alocados na viagem — base do checklist de presença. */
  passageiros: Reserva[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Combina `GET /viagens/{viagemID}` (detalhe + dados do ciclo) com
 * `GET /viagens/{viagemID}/reservas/` (lista de passageiros) para o painel
 * de monitoramento do admin (checklist de presença / ocupação da viagem).
 */
export function useViagem(viagemId: number | null): UseViagemResult {
  const [viagem, setViagem] = useState<Viagem | null>(null);
  const [passageiros, setPassageiros] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViagem = useCallback(() => {
    if (viagemId === null) return Promise.resolve();
    const id = viagemId;
    return Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
      })
      .then(() => Promise.all([buscarViagem(id), listarReservasDaViagem(id)]))
      .then(([detalhe, reservas]) => {
        setViagem(detalhe);
        setPassageiros(reservas);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar a viagem.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [viagemId]);

  useEffect(() => {
    fetchViagem();
  }, [fetchViagem]);

  return { viagem, passageiros, loading, error, refetch: fetchViagem };
}
