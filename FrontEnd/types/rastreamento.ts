/**
 * Posição em tempo real de um motorista, espelhando o nó `rotas_ativas/{cpf}`
 * do Firebase Realtime Database (escrito pelo app Android do motorista).
 */
export interface MotoristaAtivo {
  /** CPF do motorista — chave do nó em `rotas_ativas`, somente números. */
  cpf: string;
  latitude: number;
  longitude: number;
  /** Timestamp do servidor (epoch em milissegundos). */
  timestamp: number;
}
