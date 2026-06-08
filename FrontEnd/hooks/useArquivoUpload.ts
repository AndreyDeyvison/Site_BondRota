'use client';

import { useCallback, useState } from 'react';
import { ApiError } from '@/services/api';
import { gerarUrlAssinadaDeUpload, type StorageBucket } from '@/services/storage';

interface UseArquivoUploadResult {
  /** Assina a URL, envia o arquivo via `PUT` ao Supabase Storage e retorna o `path` salvo. */
  enviar: (file: File, options: { bucket: StorageBucket; path: string }) => Promise<string>;
  uploading: boolean;
  error: string | null;
}

export function useArquivoUpload(): UseArquivoUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = useCallback(async (file: File, options: { bucket: StorageBucket; path: string }) => {
    setUploading(true);
    setError(null);
    try {
      const signed = await gerarUrlAssinadaDeUpload({
        bucket: options.bucket,
        path: options.path,
        content_type: file.type,
        upsert: true,
      });
      const response = await fetch(signed.signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) {
        throw new ApiError(response.status, 'Falha ao enviar o arquivo para o armazenamento.');
      }
      return signed.path;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o arquivo.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { enviar, uploading, error };
}
