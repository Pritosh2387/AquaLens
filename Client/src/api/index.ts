export * from './apiClient';
export * from './healthApi';
export * from './pipelineApi';
export * from './detectionApi';
export * from './hindcastApi';
export * from './attributionApi';
export * from './forecastApi';
export * from './impactApi';
export * from './resourceApi';
export * from './whatIfApi';
export * from './feedbackApi';
export * from './evidenceApi';
export * from './recommendationApi';

import { healthApi } from './healthApi';
import { pipelineApi } from './pipelineApi';
import { detectionApi } from './detectionApi';
import { hindcastApi } from './hindcastApi';
import { attributionApi } from './attributionApi';
import { forecastApi } from './forecastApi';
import { impactApi } from './impactApi';
import { resourceApi } from './resourceApi';
import { whatIfApi } from './whatIfApi';
import { feedbackApi } from './feedbackApi';
import { evidenceApi } from './evidenceApi';
import { recommendationApi } from './recommendationApi';

export const api = {
  health: healthApi,
  pipeline: pipelineApi,
  detection: detectionApi,
  hindcast: hindcastApi,
  attribution: attributionApi,
  forecast: forecastApi,
  impact: impactApi,
  resource: resourceApi,
  whatIf: whatIfApi,
  feedback: feedbackApi,
  evidence: evidenceApi,
  recommendation: recommendationApi,
};

export default api;
