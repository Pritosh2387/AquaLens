import { apiClient } from './apiClient';
import { HealthResponse } from '../types/pipeline';
import { HealthResponseSchema, safeValidate } from '../schemas/validation';

export const healthApi = {
  async getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/api/v1/health');
    const { data } = safeValidate(HealthResponseSchema, response.data, 'HealthApi');
    return data;
  },
};
