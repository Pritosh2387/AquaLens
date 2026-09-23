import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evidenceApi } from '../api/evidenceApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { SceneRequest } from '../types/api';

export function useEvidence(sceneId?: string) {
  const currentScene = usePipelineStore((s) => s.currentScene);
  const activeScene = sceneId || currentScene;

  return useQuery({
    queryKey: ['evidence', 'graph', activeScene],
    queryFn: () => evidenceApi.getEvidence({ scene_id: activeScene }),
    staleTime: 60000,
    retry: 1,
  });
}

export function useRunEvidenceMutation() {
  const queryClient = useQueryClient();
  const setRunningModule = usePipelineStore((s) => s.setRunningModule);
  const setFailedModule = usePipelineStore((s) => s.setFailedModule);

  return useMutation({
    mutationFn: async (req: SceneRequest) => {
      setRunningModule('M16');
      return evidenceApi.getEvidence(req);
    },
    onSuccess: (data, variables) => {
      setRunningModule(null);
      queryClient.setQueryData(['evidence', 'graph', variables.scene_id || 'SCENE_001'], data);
    },
    onError: (err: any) => {
      setFailedModule('M16', err?.message);
    },
  });
}
