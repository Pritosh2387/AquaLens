import { useMutation, useQuery } from '@tanstack/react-query';
import { whatIfApi } from '../api/whatIfApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { Module14Request } from '../types/api';

export function useWhatIf(initialReq?: Module14Request) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = initialReq?.scene_id || currentScene;

  const query = useQuery({
    queryKey: ['what-if', activeScene, initialReq?.delay_hours, initialReq?.additional_resource_type, initialReq?.additional_resource_count],
    queryFn: () =>
      whatIfApi.simulateWhatIf({
        scene_id: activeScene,
        delay_hours: initialReq?.delay_hours ?? 6.0,
        additional_resource_type: initialReq?.additional_resource_type ?? 'skimmer',
        additional_resource_count: initialReq?.additional_resource_count ?? 2,
        alternative_allocation: initialReq?.alternative_allocation,
      }),
    staleTime: 60000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: (req: Module14Request) => whatIfApi.simulateWhatIf(req),
  });

  return {
    ...query,
    simulate: mutation.mutate,
    simulateAsync: mutation.mutateAsync,
    isSimulating: mutation.isPending,
    simulationData: mutation.data || query.data,
    simulationError: mutation.error || query.error,
  };
}
