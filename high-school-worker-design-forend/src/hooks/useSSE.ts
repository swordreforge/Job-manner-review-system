import { useState, useCallback, useRef } from 'react';
import { fetchSSE, createSSEController } from '../utils/sse';

interface UseSSEOptions {
  onMessage?: (data: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

interface SSEController {
  abort: () => void;
  isAborted: () => boolean;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<SSEController | null>(null);

  const start = useCallback(async (body?: unknown) => {
    const token = localStorage.getItem('token');
    controllerRef.current = createSSEController();
    
    setIsStreaming(true);
    setError(null);

    try {
      await fetchSSE(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        },
        (data) => options.onMessage?.(data),
        () => {
          setIsStreaming(false);
          options.onDone?.();
        }
      );
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsStreaming(false);
      options.onError?.(error);
    }
  }, [url, options]);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { start, stop, isStreaming, error };
}