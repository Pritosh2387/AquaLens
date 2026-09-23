import { apiClient } from './apiClient';
import { Module15Request } from '../types/api';
import { Module15Response } from '../types/pipeline';
import { Module15ResponseSchema, safeValidate } from '../schemas/validation';

export const feedbackApi = {
  // M15 — Prediction vs Reality Feedback (Standalone Comparator)
  async compareFeedback(req: Module15Request): Promise<Module15Response> {
    const response = await apiClient.post<Module15Response>('/api/v1/modules/15/feedback', req);
    const { data } = safeValidate(Module15ResponseSchema, response.data, 'Module15');
    return data;
  },
};
