/**
 * Decodifica o payload de um JWT (sem validar assinatura — a validação é feita pela API).
 * Usado apenas para extrair `user_id`, `role` e `exp` do token retornado no login.
 */
export function decodeJwt<T>(token: string): T | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}
