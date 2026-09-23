import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../api/healthApi';

export type HealthConnectionState = 'Connected' | 'Connecting' | 'Degraded' | 'Offline/Error';

export function useHealth() {
  const query = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthApi.getHealth(),
    refetchInterval: 15000,
    retry: 2,
    staleTime: 10000,
  });

  let connectionState: HealthConnectionState = 'Connecting';

  if (query.isLoading && !query.data) {
    connectionState = 'Connecting';
  } else if (query.isError || !query.data || query.data.status !== 'ok') {
    connectionState = 'Offline/Error';
  } else {
    // Check if any module is degraded / not available
    const moduleStatuses = Object.values(query.data.modules || {});
    const allAvailable = moduleStatuses.length > 0 && moduleStatuses.every((s) => s === 'available');
    connectionState = allAvailable ? 'Connected' : 'Degraded';
  }

  return {
    ...query,
    connectionState,
    isHealthy: connectionState === 'Connected',
  };
}
