'use client';

import { useEntityMutation } from './useEntityMutation';
import { criarCliente } from '@/services/clientes';
import type { Cliente, ClienteCreatePayload } from '@/types/cliente';

/** `POST /clientes/` — cadastro de cliente, usado pela Central de Cadastros. */
export function useCriarCliente() {
  const { mutate, loading, error } = useEntityMutation<ClienteCreatePayload, Cliente>(
    criarCliente,
    'Não foi possível cadastrar o cliente.',
  );
  return { criar: mutate, loading, error };
}
