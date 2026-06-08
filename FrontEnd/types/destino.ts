export interface Destino {
  id: number;
  nome: string;
  rua: string;
  cidade: string;
  latitude: number;
  longitude: number;
}

export type DestinoCreatePayload = Omit<Destino, 'id'>;

export type DestinoUpdatePayload = Partial<DestinoCreatePayload>;
