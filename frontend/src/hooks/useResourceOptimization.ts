import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceApi } from '../api/resourceApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { Module13Request } from '../types/api';

export function useResourceOptimization(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['resources', 'optimization', activeScene],
    queryFn: () => resourceApi.optimizeResources({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunResourceOptimizationMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: Module13Request) => {
      setRunningModule('M13');
      return resourceApi.optimizeResources(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['resources', 'optimization', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M13', err?.message);
    },
  });
}
