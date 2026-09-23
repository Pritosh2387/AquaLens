import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationApi } from '../api/recommendationApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useRecommendation(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['recommendation', activeScene],
    queryFn: () => recommendationApi.getRecommendation({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunRecommendationMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M17');
      return recommendationApi.getRecommendation(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['recommendation', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M17', err?.message);
    },
  });
}
