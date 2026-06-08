export type UserRole = 'admin' | 'cliente' | 'motorista';

/** Payload decodificado do JWT retornado pela API. */
export interface JwtPayload {
  user_id: number;
  role: UserRole;
  exp: number;
}

/** Resposta crua dos endpoints de login. */
export interface AuthResponse {
  token: string;
}

/** Sessão derivada do token, pronta para uso pela aplicação. */
export interface UsuarioAutenticado {
  userId: number;
  role: UserRole;
  token: string;
  /** Epoch em milissegundos — derivado de `exp * 1000`. */
  expiresAt: number;
}

export interface AdminLoginPayload {
  email: string;
  senha: string;
}

export interface MotoristaLoginPayload {
  cpf: string;
  senha: string;
}

export interface ClienteLoginPayload {
  cpf: string;
  senha: string;
}
