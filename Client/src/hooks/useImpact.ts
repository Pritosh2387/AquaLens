import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { impactApi } from '../api/impactApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useImpact(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['impact', 'prediction', activeScene],
    queryFn: () => impactApi.predictImpact({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function usePriority(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['impact', 'priority', activeScene],
    queryFn: () => impactApi.scorePriority({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunImpactMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M11');
      return impactApi.predictImpact(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['impact', 'prediction', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M11', err?.message);
    },
  });
}
