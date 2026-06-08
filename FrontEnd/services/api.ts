import { getStoredToken } from '@/lib/token-storage';

const BASE_URL = process.env.NEXT_PUBLIC_URL_API ?? 'https://bondrota-api.onrender.com/api/v1';

/**
 * Erro de API — preserva o status HTTP e a mensagem em texto puro que a
 * BondRota API devolve nos erros (ex.: "invalid request body").
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** Objeto serializado como JSON no corpo da requisição. */
  body?: unknown;
  /** Anexa `Authorization: Bearer <token>` automaticamente. Padrão: true. */
  auth?: boolean;
}

/**
 * Cliente HTTP único para a BondRota API. Centraliza a base URL, o anexo do
 * JWT e o tratamento de erros (que chegam como texto puro, não JSON).
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token = getStoredToken();
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à BondRota API. Verifique sua conexão.');
  }

  if (!response.ok) {
    const message = (await response.text().catch(() => '')).trim();
    throw new ApiError(response.status, message || response.statusText || 'Erro inesperado da API');
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
