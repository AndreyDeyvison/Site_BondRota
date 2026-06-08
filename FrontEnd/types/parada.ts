export interface Parada {
  id: number;
  nome: string;
  cidade: string;
  latitude: number;
  longitude: number;
}

export type ParadaCreatePayload = Omit<Parada, 'id'>;

export type ParadaUpdatePayload = Partial<ParadaCreatePayload>;
