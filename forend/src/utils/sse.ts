export async function fetchSSE(
  url: string, 
  options: RequestInit, 
  onMessage: (data: string) => void,
  onDone?: () => void
) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  if (!response.body) {
    throw new Error('Response body is null');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        if (buffer.trim()) {
          const line = buffer.trim();
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data && data !== '[DONE]') {
              onMessage(data);
            }
          }
        }
        onDone?.();
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          
          if (data === '[DONE]') {
            reader.cancel();
            onDone?.();
            return;
          }
          
          if (data) {
            try {
              const parsed = JSON.parse(data);
              onMessage(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
            } catch {
              onMessage(data);
            }
          }
        }
      }
      
      buffer = lines[lines.length - 1];
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      throw error;
    }
  }
}

export function createSSEController() {
  let aborted = false;
  
  return {
    abort: () => { aborted = true; },
    isAborted: () => aborted,
  };
}