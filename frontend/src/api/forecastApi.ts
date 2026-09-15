import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import { Module9Response, Module10Response } from '../types/pipeline';
import { Module9ResponseSchema, Module10ResponseSchema, safeValidate } from '../schemas/validation';

export const forecastApi = {
  // M9 — Forward Plume Forecast (6h, 12h, 24h, 48h, 72h)
  async runForecast(req: SceneRequest = {}): Promise<Module9Response> {
    const response = await apiClient.post<Module9Response>('/api/v1/modules/9/forecast', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module9ResponseSchema, response.data, 'Module9');
    return data;
  },

  // M10 — Uncertainty Quantification (Monte Carlo)
  async evaluateUncertainty(req: SceneRequest = {}): Promise<Module10Response> {
    const response = await apiClient.post<Module10Response>('/api/v1/modules/10/uncertainty', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module10ResponseSchema, response.data, 'Module10');
    return data;
  },
};
