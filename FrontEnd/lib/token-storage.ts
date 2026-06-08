const TOKEN_KEY = 'bondrota:token';

/**
 * Wrapper sobre localStorage — sempre verifica `window` porque o App Router
 * renderiza estes módulos também no servidor (onde localStorage não existe).
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}
