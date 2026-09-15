import { apiClient } from './apiClient';
import { Module13Request } from '../types/api';
import { Module13Response } from '../types/pipeline';
import { Module13ResponseSchema, safeValidate } from '../schemas/validation';

export const resourceApi = {
  // M13 — Resource Optimization
  async optimizeResources(req: Module13Request = {}): Promise<Module13Response> {
    const payload: Record<string, any> = {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    };
    if (req.resource_override) {
      payload.resource_override = req.resource_override;
    }
    const response = await apiClient.post<Module13Response>('/api/v1/modules/13/optimize', payload);
    const { data } = safeValidate(Module13ResponseSchema, response.data, 'Module13');
    return data;
  },
};
