import { apiClient } from './apiClient';
import { Module14Request } from '../types/api';
import { Module14Response } from '../types/pipeline';
import { Module14ResponseSchema, safeValidate } from '../schemas/validation';

export const whatIfApi = {
  // M14 — What-If Response Simulation (Standalone Scenario Engine)
  async simulateWhatIf(req: Module14Request = {}): Promise<Module14Response> {
    const payload: Record<string, any> = {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
      delay_hours: req.delay_hours ?? 6.0,
      additional_resource_type: req.additional_resource_type || 'skimmer',
      additional_resource_count: req.additional_resource_count ?? 2,
    };
    if (req.alternative_allocation) {
      payload.alternative_allocation = req.alternative_allocation;
    }
    const response = await apiClient.post<Module14Response>('/api/v1/modules/14/what-if', payload);
    const { data } = safeValidate(Module14ResponseSchema, response.data, 'Module14');
    return data;
  },
};
