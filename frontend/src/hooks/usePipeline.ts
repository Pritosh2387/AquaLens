import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '../api/pipelineApi';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { PipelineRequestExtended } from '../types/api';
import { FullPipelineResponse } from '../types/pipeline';

export function usePipeline() {
  const queryClient = useQueryClient();
  const {
    currentScene,
    pipelineMode,
    setPipelineData,
    setPipelineRunning,
    setFailedModule,
  } = usePipelineStore();

  const mutation = useMutation({
    mutationFn: async (overrideReq?: Partial<PipelineRequestExtended>): Promise<FullPipelineResponse> => {
      const mode = overrideReq?.include_modules_16_17 !== undefined
        ? (overrideReq.include_modules_16_17 ? 'FULL_DECISION_SUPPORT' : overrideReq.include_modules_11_15 ? 'EXTENDED' : 'DEFAULT')
        : pipelineMode;

      const include_11_15 = mode === 'EXTENDED' || mode === 'FULL_DECISION_SUPPORT';
      const include_16_17 = mode === 'FULL_DECISION_SUPPORT';

      const req: PipelineRequestExtended = {
        scene_id: overrideReq?.scene_id || currentScene,
        config_path: overrideReq?.config_path || 'configs/config.yaml',
        include_modules_11_15: overrideReq?.include_modules_11_15 ?? include_11_15,
        include_modules_16_17: overrideReq?.include_modules_16_17 ?? include_16_17,
      };

      return pipelineApi.runPipeline(req);
    },
    onMutate: () => {
      setPipelineRunning(true);
      useIncidentStore.getState().setPipelineRunning(true);
    },
    onSuccess: (data) => {
      setPipelineData(data);
      useIncidentStore.getState().setPipelineData(data);
      useIncidentStore.getState().setPipelineRunning(false);
      // Pre-seed individual domain caches with pipeline output for instantaneous view rendering
      if (data.spill_origin) {
        queryClient.setQueryData(['hindcast', data.scene_id], data.spill_origin);
      }
      if (data.vessel_attribution) {
        queryClient.setQueryData(['attribution', 'ranking', data.scene_id], data.vessel_attribution);
      }
      if (data.ais_matching) {
        queryClient.setQueryData(['attribution', 'ais', data.scene_id], data.ais_matching);
      }
      if (data.spill_forecast) {
        queryClient.setQueryData(['forecast', data.scene_id], data.spill_forecast);
      }
      if (data.uncertainty) {
        queryClient.setQueryData(['forecast', 'uncertainty', data.scene_id], data.uncertainty);
      }
      if (data.impact) {
        queryClient.setQueryData(['impact', 'prediction', data.scene_id], data.impact);
      }
      if (data.priority) {
        queryClient.setQueryData(['impact', 'priority', data.scene_id], data.priority);
      }
      if (data.resource_optimization) {
        queryClient.setQueryData(['resources', data.scene_id], data.resource_optimization);
      }
      if (data.explainability) {
        queryClient.setQueryData(['evidence', 'graph', data.scene_id], data.explainability);
      }
      if (data.action_recommendation) {
        queryClient.setQueryData(['recommendation', data.scene_id], data.action_recommendation);
      }

      // Invalidate active domain queries so any individual module views refresh with fresh data
      queryClient.invalidateQueries({ queryKey: ['detection'] });
      queryClient.invalidateQueries({ queryKey: ['hindcast'] });
      queryClient.invalidateQueries({ queryKey: ['attribution'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['impact'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['recommendation'] });
    },
    onError: (err: any) => {
      const reason = err?.message || 'Pipeline execution failed';
      console.error('Pipeline run error:', err);
      setFailedModule('Pipeline', reason);
      useIncidentStore.getState().setFailedModule('Pipeline', reason);
    },
  });

  return mutation;
}

// Alias for backwards compatibility
export const useRunPipeline = usePipeline;
