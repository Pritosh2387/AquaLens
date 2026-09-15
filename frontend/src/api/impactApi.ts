import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import { Module11Response, Module12Response } from '../types/pipeline';
import { Module11ResponseSchema, Module12ResponseSchema, safeValidate } from '../schemas/validation';

export const impactApi = {
  // M11 — Impact Prediction
  async predictImpact(req: SceneRequest = {}): Promise<Module11Response> {
    const response = await apiClient.post<Module11Response>('/api/v1/modules/11/impact', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module11ResponseSchema, response.data, 'Module11');
    return data;
  },

  // M12 — Priority & Urgency Scoring
  async scorePriority(req: SceneRequest = {}): Promise<Module12Response> {
    const response = await apiClient.post<Module12Response>('/api/v1/modules/12/priority', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module12ResponseSchema, response.data, 'Module12');
    return data;
  },
};
