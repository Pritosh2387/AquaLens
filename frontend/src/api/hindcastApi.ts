import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import { Module7Response } from '../types/pipeline';
import { Module7ResponseSchema, safeValidate } from '../schemas/validation';

export const hindcastApi = {
  // M7 — Hindcast / Origin Estimation
  async runHindcast(req: SceneRequest = {}): Promise<Module7Response> {
    const response = await apiClient.post<Module7Response>('/api/v1/modules/7/hindcast', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module7ResponseSchema, response.data, 'Module7');
    return data;
  },
};
