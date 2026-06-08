export interface Admin {
  id: number;
  email: string;
  cidade?: string;
}

/** Payload de `POST /admin/`. */
export interface AdminCreatePayload {
  email: string;
  senha: string;
  cidade?: string;
}

/** Payload de `PUT /admin/{adminID}` — apenas o e-mail é atualizável. */
export interface AdminUpdatePayload {
  email: string;
}
