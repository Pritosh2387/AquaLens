import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forecastApi } from '../api/forecastApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useForecast(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['forecast', 'plume', activeScene],
    queryFn: () => forecastApi.runForecast({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useUncertainty(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['forecast', 'uncertainty', activeScene],
    queryFn: () => forecastApi.evaluateUncertainty({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunForecastMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M9');
      return forecastApi.runForecast(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['forecast', 'plume', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M9', err?.message);
    },
  });
}
