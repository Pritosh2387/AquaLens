import { apiClient } from './apiClient';
import { PipelineRequestExtended } from '../types/api';
import { FullPipelineResponse } from '../types/pipeline';
import { FullPipelineResponseSchema, safeValidate } from '../schemas/validation';

export const pipelineApi = {
  async runPipeline(payload: PipelineRequestExtended): Promise<FullPipelineResponse> {
    const response = await apiClient.post<FullPipelineResponse>('/api/v1/pipeline/run', {
      scene_id: payload.scene_id || 'SCENE_001',
      config_path: payload.config_path || 'configs/config.yaml',
      include_modules_11_15: payload.include_modules_11_15 ?? false,
      include_modules_16_17: payload.include_modules_16_17 ?? false,
    });
    const { data } = safeValidate(FullPipelineResponseSchema, response.data, 'PipelineApi');
    return data;
  },
};
