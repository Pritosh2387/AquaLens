import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributionApi } from '../api/attributionApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useAISMatch(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['attribution', 'ais-match', activeScene],
    queryFn: () => attributionApi.matchAIS({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useAttribution(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['attribution', 'vessels', activeScene],
    queryFn: () => attributionApi.attributeVessels({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunAttributionMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M8');
      return attributionApi.attributeVessels(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['attribution', 'vessels', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M8', err?.message);
    },
  });
}
