import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detectionApi } from '../api/detectionApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useProcessData(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['detection', 'm1-process', activeScene],
    queryFn: () => detectionApi.processData({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useSpillDetection(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['detection', 'm2-detect', activeScene],
    queryFn: () => detectionApi.detectSpill({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useSensorFusion(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['detection', 'm3-fuse', activeScene],
    queryFn: () => detectionApi.fuseSensors({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useConfidence(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['detection', 'm4-confidence', activeScene],
    queryFn: () => detectionApi.evaluateConfidence({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useShips(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['detection', 'm5-ships', activeScene],
    queryFn: () => detectionApi.detectShips({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunDetectionMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M2');
      return detectionApi.detectSpill(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['detection', 'm2-detect', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M2', err?.message);
    },
  });
}
