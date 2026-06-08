'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';

/** Acesso à sessão e aos três fluxos de login (admin, motorista, cliente). */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>.');
  }
  return context;
}
