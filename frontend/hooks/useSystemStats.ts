import { useState, useEffect, useCallback } from 'react';
import { getSystemStats } from '@/lib/storage';

interface SystemStats {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  storage: { used: number; total: number; percent: number };
  network: { online: boolean; type: string };
  platform: string;
  hostname: string;
}

const DEFAULT_STATS: SystemStats = {
  cpu: 0,
  ram: { used: 0, total: 0, percent: 0 },
  storage: { used: 0, total: 0, percent: 0 },
  network: { online: true, type: 'unknown' },
  platform: '',
  hostname: '',
};

export function useSystemStats(intervalMs = 3000) {
  const [stats, setStats] = useState<SystemStats>(DEFAULT_STATS);

  const refresh = useCallback(async () => {
    const data = await getSystemStats();
    setStats(data);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return stats;
}
