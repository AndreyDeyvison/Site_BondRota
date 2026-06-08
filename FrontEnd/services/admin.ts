import { apiRequest } from './api';
import type { Admin, AdminCreatePayload, AdminUpdatePayload } from '@/types/admin';

export function criarAdmin(payload: AdminCreatePayload): Promise<Admin> {
  return apiRequest<Admin>('/admin/', { method: 'POST', body: payload });
}

export function listarAdmins(): Promise<Admin[]> {
  return apiRequest<Admin[]>('/admin/');
}

export function buscarAdmin(adminId: number): Promise<Admin> {
  return apiRequest<Admin>(`/admin/${adminId}`);
}

export function atualizarAdmin(adminId: number, payload: AdminUpdatePayload): Promise<Admin> {
  return apiRequest<Admin>(`/admin/${adminId}`, { method: 'PUT', body: payload });
}

export function removerAdmin(adminId: number): Promise<void> {
  return apiRequest<void>(`/admin/${adminId}`, { method: 'DELETE' });
}
