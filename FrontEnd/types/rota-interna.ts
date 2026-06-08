/** Referência a uma parada cadastrada (FK) com sua posição na rota. */
export interface ParadaNaRota {
  parada_id: number;
  ordem: number;
}

export interface RotaInterna {
  id: number;
  cidade: string;
  paradas: ParadaNaRota[];
}

/** Payload de `POST /rotas-internas/`. */
export interface RotaInternaCreatePayload {
  cidade: string;
  paradas: ParadaNaRota[];
}

/** Payload de `PUT /rotas-internas/{id}/paradas` — substitui a sequência inteira. */
export interface RotaInternaParadasUpdatePayload {
  paradas: ParadaNaRota[];
}
