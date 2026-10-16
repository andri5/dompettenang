/**
 * Load private upload as blob URL (sends Authorization header).
 */

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUploadContentPath } from '@/lib/constants';

export function useAuthenticatedFileUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const contentPath = getUploadContentPath(path);
    if (!contentPath) {
      setUrl(null);
      setError(false);
      setIsLoading(false);
      return;
    }

    if (
      contentPath.startsWith('blob:') ||
      contentPath.startsWith('data:') ||
      contentPath.startsWith('http://') ||
      contentPath.startsWith('https://')
    ) {
      setUrl(contentPath);
      setError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    api
      .get(contentPath, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return { url, isLoading, error };
}
