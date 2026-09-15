import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hindcastApi } from '../api/hindcastApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useHindcast(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['hindcast', activeScene],
    queryFn: () => hindcastApi.runHindcast({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunHindcastMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M7');
      return hindcastApi.runHindcast(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['hindcast', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M7', err?.message);
    },
  });
}
