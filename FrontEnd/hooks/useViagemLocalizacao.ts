'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/api';
import { buscarLocalizacaoDaViagem } from '@/services/viagens';
import type { Localizacao } from '@/types/viagem';

const DEFAULT_POLLING_INTERVAL_MS = 12_000; // dentro da janela de 10–15s pedida

interface UseViagemLocalizacaoResult {
  localizacao: Localizacao | null;
  loading: boolean;
  error: string | null;
}

/**
 * Faz polling de `GET /viagens/{viagemID}/localizacao` a cada `intervalMs`
 * (padrão 12s, dentro da janela de 10–15s) para o cliente acompanhar o
 * veículo em tempo real (latitude, longitude, velocidade, direção).
 */
export function useViagemLocalizacao(
  viagemId: number | null,
  intervalMs: number = DEFAULT_POLLING_INTERVAL_MS,
): UseViagemLocalizacaoResult {
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (viagemId === null) return;

    let cancelled = false;

    const poll = () => {
      return buscarLocalizacaoDaViagem(viagemId)
        .then((data) => {
          if (cancelled) return;
          setLocalizacao(data);
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof ApiError ? err.message : 'Não foi possível obter a localização do veículo.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    poll();
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [viagemId, intervalMs]);

  return { localizacao, loading, error };
}
