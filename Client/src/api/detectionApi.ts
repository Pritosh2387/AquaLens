import { apiClient } from './apiClient';
import { SceneRequest } from '../types/api';
import {
  Module1Response,
  Module2Response,
  Module3Response,
  Module4Response,
  Module5Response,
} from '../types/pipeline';
import {
  Module1ResponseSchema,
  Module2ResponseSchema,
  Module3ResponseSchema,
  Module4ResponseSchema,
  Module5ResponseSchema,
  safeValidate,
} from '../schemas/validation';

export const detectionApi = {
  // M1 — Data Processing
  async processData(req: SceneRequest = {}): Promise<Module1Response> {
    const response = await apiClient.post<Module1Response>('/api/v1/modules/1/process', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module1ResponseSchema, response.data, 'Module1');
    return data;
  },

  // M2 — Oil Spill Detection (U-Net)
  async detectSpill(req: SceneRequest = {}): Promise<Module2Response> {
    const response = await apiClient.post<Module2Response>('/api/v1/modules/2/detect', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module2ResponseSchema, response.data, 'Module2');
    return data;
  },

  // M3 — Sensor Fusion (SAR + Optical)
  async fuseSensors(req: SceneRequest = {}): Promise<Module3Response> {
    const response = await apiClient.post<Module3Response>('/api/v1/modules/3/fuse', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module3ResponseSchema, response.data, 'Module3');
    return data;
  },

  // M4 — Oil Confidence & Look-Alike
  async evaluateConfidence(req: SceneRequest = {}): Promise<Module4Response> {
    const response = await apiClient.post<Module4Response>('/api/v1/modules/4/confidence', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module4ResponseSchema, response.data, 'Module4');
    return data;
  },

  // M5 — Physical Ship Detection
  async detectShips(req: SceneRequest = {}): Promise<Module5Response> {
    const response = await apiClient.post<Module5Response>('/api/v1/modules/5/ships', {
      scene_id: req.scene_id || 'SCENE_001',
      config_path: req.config_path || 'configs/config.yaml',
    });
    const { data } = safeValidate(Module5ResponseSchema, response.data, 'Module5');
    return data;
  },
};
