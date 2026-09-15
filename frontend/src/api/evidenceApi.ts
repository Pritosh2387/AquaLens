import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import { Module16Response } from '../types/pipeline';
import { Module16ResponseSchema, safeValidate } from '../schemas/validation';

export const evidenceApi = {
  // M16 — Explainability & Evidence Graph
  async getEvidence(req: SceneRequest = {}): Promise<Module16Response> {
    const response = await apiClient.post<Module16Response>('/api/v1/modules/16/evidence', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module16ResponseSchema, response.data, 'Module16');
    return data;
  },
};
