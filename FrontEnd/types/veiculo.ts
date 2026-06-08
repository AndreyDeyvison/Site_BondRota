export type CategoriaVeiculo = 'executivo' | 'escolar' | 'carro_7_lugares';

export type StatusVeiculo = 'ativo' | 'inativo' | 'manutencao';

/** Comodidades enviadas como booleanos nomeados (não como objeto aninhado). */
export interface ComodidadesVeiculo {
  ar_condicionado: boolean;
  banheiro: boolean;
  persiana: boolean;
  luz_leitura: boolean;
  tomada: boolean;
}

export interface Veiculo extends ComodidadesVeiculo {
  id: number;
  placa: string;
  modelo: string;
  categoria: CategoriaVeiculo;
  capacidade: number;
  cidade_base: string;
  status: StatusVeiculo;
  foto?: string;
}

/**
 * Payload de `POST /veiculos/` — a API valida que `capacidade` corresponde
 * exatamente ao valor esperado para a `categoria` informada (ex.: "escolar"
 * exige 24), então o valor derivado precisa ser enviado explicitamente.
 */
export type VeiculoCreatePayload = Omit<Veiculo, 'id'>;

export type VeiculoUpdatePayload = Partial<VeiculoCreatePayload>;
