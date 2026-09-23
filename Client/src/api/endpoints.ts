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
import { PipelineRequestExtended, Module14Request, Module15Request, Module13Request } from '../types/api';
import { Module16Response, Module17Response } from '../types/pipeline';

export const apiService = {
  // Health
  getHealth: () => healthApi.getHealth(),

  // Pipeline
  runPipeline: (payload: PipelineRequestExtended) => pipelineApi.runPipeline(payload),

  // Detection M1–M5
  processData: (sceneId?: string, configPath?: string) =>
    detectionApi.processData({ scene_id: sceneId, config_path: configPath }),
  detectSpill: (sceneId?: string, configPath?: string) =>
    detectionApi.detectSpill({ scene_id: sceneId, config_path: configPath }),
  fuseSensors: (sceneId?: string, configPath?: string) =>
    detectionApi.fuseSensors({ scene_id: sceneId, config_path: configPath }),
  evaluateConfidence: (sceneId?: string, configPath?: string) =>
    detectionApi.evaluateConfidence({ scene_id: sceneId, config_path: configPath }),
  detectShips: (sceneId?: string, configPath?: string) =>
    detectionApi.detectShips({ scene_id: sceneId, config_path: configPath }),

  // Hindcast M7
  runHindcast: (sceneId?: string, configPath?: string) =>
    hindcastApi.runHindcast({ scene_id: sceneId, config_path: configPath }),

  // Attribution M6 & M8
  matchAIS: (sceneId?: string, configPath?: string) =>
    attributionApi.matchAIS({ scene_id: sceneId, config_path: configPath }),
  attributeVessels: (sceneId?: string, configPath?: string) =>
    attributionApi.attributeVessels({ scene_id: sceneId, config_path: configPath }),

  // Forecast M9 & M10
  runForecast: (sceneId?: string, configPath?: string) =>
    forecastApi.runForecast({ scene_id: sceneId, config_path: configPath }),
  evaluateUncertainty: (sceneId?: string, configPath?: string) =>
    forecastApi.evaluateUncertainty({ scene_id: sceneId, config_path: configPath }),

  // Impact M11 & M12
  predictImpact: (sceneId?: string, configPath?: string) =>
    impactApi.predictImpact({ scene_id: sceneId, config_path: configPath }),
  scorePriority: (sceneId?: string, configPath?: string) =>
    impactApi.scorePriority({ scene_id: sceneId, config_path: configPath }),

  // Resource Optimization M13
  optimizeResources: (req?: Module13Request) =>
    resourceApi.optimizeResources(req),

  // What-If M14
  simulateWhatIf: (req?: Module14Request) =>
    whatIfApi.simulateWhatIf(req),

  // Feedback M15
  compareFeedback: (req: Module15Request) =>
    feedbackApi.compareFeedback(req),

  // Evidence M16
  getEvidenceGraph: (sceneId?: string, configPath?: string): Promise<Module16Response> =>
    evidenceApi.getEvidence({ scene_id: sceneId, config_path: configPath }),

  // Recommendation M17
  getActionRecommendation: (sceneId?: string, configPath?: string): Promise<Module17Response> =>
    recommendationApi.getRecommendation({ scene_id: sceneId, config_path: configPath }),
};

export {
  healthApi,
  pipelineApi,
  detectionApi,
  hindcastApi,
  attributionApi,
  forecastApi,
  impactApi,
  resourceApi,
  whatIfApi,
  feedbackApi,
  evidenceApi,
  recommendationApi,
};
