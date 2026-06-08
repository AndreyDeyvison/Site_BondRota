import { apiRequest } from './api';

export type StorageBucket = 'fotos' | 'documentos';

export interface SignedUploadUrlPayload {
  bucket: StorageBucket;
  path: string;
  content_type: string;
  upsert?: boolean;
}

export interface SignedUploadUrlResponse {
  bucket: string;
  path: string;
  signed_url: string;
  token?: string;
}

/**
 * `POST /storage/signed-upload-url` — gera uma URL assinada para upload direto
 * no Supabase Storage. O arquivo deve então ser enviado via `PUT` para `signed_url`
 * (ver `useArquivoUpload`); o `path` retornado é o que se salva em campos como
 * `foto`/`comprovante` (não a URL completa — para visualização existe
 * `POST /storage/signed-download-url`).
 */
export function gerarUrlAssinadaDeUpload(payload: SignedUploadUrlPayload): Promise<SignedUploadUrlResponse> {
  return apiRequest<SignedUploadUrlResponse>('/storage/signed-upload-url', { method: 'POST', body: payload });
}
