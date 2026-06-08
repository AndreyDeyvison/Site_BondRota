'use client';

import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import type { MotoristaAtivo } from '@/types/rastreamento';

interface UseMotoristasAtivosResult {
  motoristasAtivos: MotoristaAtivo[];
  loading: boolean;
  error: string | null;
}

/**
 * Escuta em tempo real o nó `rotas_ativas` do Firebase Realtime Database.
 *
 * Cada filha representa um motorista transmitindo localização (chave = CPF).
 * Quando o app Android encerra a transmissão, o nó é removido e o
 * snapshot seguinte do `onValue` já vem sem aquele CPF — então o motorista
 * desaparece da lista (e, consequentemente, do mapa) automaticamente.
 */
export function useMotoristasAtivos(): UseMotoristasAtivosResult {
  const [motoristasAtivos, setMotoristasAtivos] = useState<MotoristaAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const database = getFirebaseDatabase();
    if (!database) return;

    const rotasAtivasRef = ref(database, 'rotas_ativas');

    const unsubscribe = onValue(
      rotasAtivasRef,
      (snapshot) => {
        const valor = snapshot.val() as Record<string, { latitude: number; longitude: number; timestamp: number }> | null;

        const lista: MotoristaAtivo[] = valor
          ? Object.entries(valor).map(([cpf, dados]) => ({
              cpf,
              latitude: dados.latitude,
              longitude: dados.longitude,
              timestamp: dados.timestamp,
            }))
          : [];

        setMotoristasAtivos(lista);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Não foi possível conectar ao monitoramento em tempo real.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { motoristasAtivos, loading, error };
}
