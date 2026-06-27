import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CACAO_URL = import.meta.env.VITE_CACAO_URL || 'http://localhost:8001';

const CHECK_URLS = [
  `${API_URL}/health`,
  `${CACAO_URL}/`,
  `${CACAO_URL}/health/ollama`,
];

type SystemHealth = 'unknown' | 'ok' | 'degraded' | 'down';

async function pingUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status !== 'error';
  } catch {
    return false;
  }
}

export function useSystemStatus(): SystemHealth {
  const [health, setHealth] = useState<SystemHealth>('unknown');

  useEffect(() => {
    let cancelled = false;
    Promise.all(CHECK_URLS.map(pingUrl)).then(results => {
      if (cancelled) return;
      const upCount = results.filter(Boolean).length;
      if (upCount === results.length) setHealth('ok');
      else if (upCount === 0) setHealth('down');
      else setHealth('degraded');
    });
    return () => { cancelled = true; };
  }, []);

  return health;
}
