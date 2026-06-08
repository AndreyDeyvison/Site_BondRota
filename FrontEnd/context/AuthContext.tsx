'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { decodeJwt } from '@/lib/jwt';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/token-storage';
import { loginAdmin, loginCliente, loginMotorista } from '@/services/auth';
import type { JwtPayload, UsuarioAutenticado } from '@/types/auth';

export interface AuthContextValue {
  /** Sessão atual (null enquanto carrega ou quando deslogado). */
  user: UsuarioAutenticado | null;
  /** Token JWT bruto, útil para chamadas manuais. */
  token: string | null;
  /** true durante a checagem inicial do token salvo em localStorage. */
  loading: boolean;
  loginAsAdmin: (email: string, senha: string) => Promise<UsuarioAutenticado>;
  loginAsMotorista: (cpf: string, senha: string) => Promise<UsuarioAutenticado>;
  loginAsCliente: (cpf: string, senha: string) => Promise<UsuarioAutenticado>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function toUsuarioAutenticado(token: string): UsuarioAutenticado | null {
  const payload = decodeJwt<JwtPayload>(token);
  if (!payload) return null;
  return {
    userId: payload.user_id,
    role: payload.role,
    token,
    expiresAt: payload.exp * 1000,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [loading, setLoading] = useState(true);
  const expirationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpirationTimer = useCallback(() => {
    if (expirationTimer.current) {
      clearTimeout(expirationTimer.current);
      expirationTimer.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearExpirationTimer();
    clearStoredToken();
    setUser(null);
  }, [clearExpirationTimer]);

  /** Agenda o logout automático para o instante exato em que o JWT expira (`exp`). */
  const scheduleExpiration = useCallback((expiresAt: number) => {
    clearExpirationTimer();
    const msUntilExpiration = expiresAt - Date.now();
    if (msUntilExpiration <= 0) {
      logout();
      return;
    }
    expirationTimer.current = setTimeout(logout, msUntilExpiration);
  }, [clearExpirationTimer, logout]);

  const applyToken = useCallback((token: string): UsuarioAutenticado => {
    const authenticated = toUsuarioAutenticado(token);
    if (!authenticated) {
      throw new Error('Token recebido da API é inválido.');
    }
    setStoredToken(token);
    setUser(authenticated);
    scheduleExpiration(authenticated.expiresAt);
    return authenticated;
  }, [scheduleExpiration]);

  // Restaura a sessão a partir do token salvo (se ainda for válido).
  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = getStoredToken();
      if (stored) {
        const authenticated = toUsuarioAutenticado(stored);
        if (authenticated && authenticated.expiresAt > Date.now()) {
          setUser(authenticated);
          scheduleExpiration(authenticated.expiresAt);
        } else {
          clearStoredToken();
        }
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearExpirationTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginAsAdmin = useCallback(async (email: string, senha: string) => {
    const { token } = await loginAdmin({ email, senha });
    return applyToken(token);
  }, [applyToken]);

  const loginAsMotorista = useCallback(async (cpf: string, senha: string) => {
    const { token } = await loginMotorista({ cpf, senha });
    return applyToken(token);
  }, [applyToken]);

  const loginAsCliente = useCallback(async (cpf: string, senha: string) => {
    const { token } = await loginCliente({ cpf, senha });
    return applyToken(token);
  }, [applyToken]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token: user?.token ?? null,
    loading,
    loginAsAdmin,
    loginAsMotorista,
    loginAsCliente,
    logout,
  }), [user, loading, loginAsAdmin, loginAsMotorista, loginAsCliente, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
