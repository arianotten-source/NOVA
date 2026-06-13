import { useState, useEffect, useCallback } from 'react';
import { fetchSensors } from '@/lib/sensorApi';
import type { SensorAlert, SensorDevice } from '@/types/sensors';

export function useSensors(pollIntervalMs = 15000) {
  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchSensors();
    setDevices(data.devices);
    setAlerts(data.alerts);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  return { devices, alerts, loading, refresh };
}
