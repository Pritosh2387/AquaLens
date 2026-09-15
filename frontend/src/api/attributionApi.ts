import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import { Module6Response, Module8Response } from '../types/pipeline';
import { Module6ResponseSchema, Module8ResponseSchema, safeValidate } from '../schemas/validation';

export const attributionApi = {
  // M6 — AIS Matching & Anomaly Detection
  async matchAIS(req: SceneRequest = {}): Promise<Module6Response> {
    const response = await apiClient.post<Module6Response>('/api/v1/modules/6/ais-match', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module6ResponseSchema, response.data, 'Module6');
    return data;
  },

  // M8 — Vessel Attribution Engine
  async attributeVessels(req: SceneRequest = {}): Promise<Module8Response> {
    const response = await apiClient.post<Module8Response>('/api/v1/modules/8/attribution', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module8ResponseSchema, response.data, 'Module8');
    return data;
  },
};
