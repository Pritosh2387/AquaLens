import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import { Module17Response } from '../types/pipeline';
import { Module17ResponseSchema, safeValidate } from '../schemas/validation';

export const recommendationApi = {
  // M17 — Action Recommendation & Decision Support
  async getRecommendation(req: SceneRequest = {}): Promise<Module17Response> {
    const response = await apiClient.post<Module17Response>('/api/v1/modules/17/recommend', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module17ResponseSchema, response.data, 'Module17');
    return data;
  },
};
