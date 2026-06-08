import { apiRequest } from './api';
import type {
  AdminLoginPayload,
  AuthResponse,
  ClienteLoginPayload,
  MotoristaLoginPayload,
} from '@/types/auth';

export function loginAdmin(payload: AdminLoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/admin/login', { method: 'POST', body: payload, auth: false });
}

export function loginMotorista(payload: MotoristaLoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/motoristas/login', { method: 'POST', body: payload, auth: false });
}

export function loginCliente(payload: ClienteLoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/clientes/login', { method: 'POST', body: payload, auth: false });
}
