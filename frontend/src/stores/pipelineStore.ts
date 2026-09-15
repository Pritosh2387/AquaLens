import { create } from 'zustand';
import { DataProvenance } from '../types/provenance';
import {
  FullPipelineResponse,
  Module1Response,
  Module2Response,
  Module3Response,
  Module4Response,
  Module5Response,
  Module6Response,
  Module7Response,
  Module8Response,
  Module9Response,
  Module10Response,
  Module11Response,
  Module12Response,
  Module13Response,
  Module14Response,
  Module15Response,
  Module16Response,
  Module17Response,
} from '../types/pipeline';
import { DEFAULT_SCENE_ID, AVAILABLE_SCENES } from '../config/constants';

export type PipelineMode = 'DEFAULT' | 'EXTENDED' | 'FULL_DECISION_SUPPORT';

export interface ModuleOutputsMap {
  m1?: Module1Response;
  m2?: Module2Response;
  m3?: Module3Response;
  m4?: Module4Response;
  m5?: Module5Response;
  m6?: Module6Response;
  m7?: Module7Response;
  m8?: Module8Response;
  m9?: Module9Response;
  m10?: Module10Response;
  m11?: Module11Response;
  m12?: Module12Response;
  m13?: Module13Response;
  m14?: Module14Response;
  m15?: Module15Response;
  m16?: Module16Response;
  m17?: Module17Response;
}

export interface PipelineState {
  currentScene: string;
  activeIncident: string;
  availableScenes: string[];
  pipelineMode: PipelineMode;
  completedModules: string[];
  runningModule: string | null;
  failedModule: string | null;
  failureReason: string | null;
  moduleOutputs: ModuleOutputsMap;
  pipelineData: FullPipelineResponse | null;
  provenance: DataProvenance;
  lastSuccessfulExecution: string | null;
  isPipelineRunning: boolean;

  // Actions
  setCurrentScene: (sceneId: string) => void;
  setPipelineMode: (mode: PipelineMode) => void;
  setRunningModule: (module: string | null) => void;
  setFailedModule: (module: string | null, reason?: string | null) => void;
  setPipelineRunning: (running: boolean) => void;
  setPipelineData: (data: FullPipelineResponse | null) => void;
  setModuleOutput: <K extends keyof ModuleOutputsMap>(key: K, output: ModuleOutputsMap[K]) => void;
  isModuleAvailable: (moduleCode: string) => boolean;
  clearErrors: () => void;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  currentScene: DEFAULT_SCENE_ID,
  activeIncident: `${DEFAULT_SCENE_ID} [ARABIAN_SEA]`,
  availableScenes: AVAILABLE_SCENES,
  pipelineMode: 'FULL_DECISION_SUPPORT',
  completedModules: [],
  runningModule: null,
  failedModule: null,
  failureReason: null,
  moduleOutputs: {},
  pipelineData: null,
  provenance: 'OBSERVED',
  lastSuccessfulExecution: null,
  isPipelineRunning: false,

  setCurrentScene: (sceneId: string) =>
    set({
      currentScene: sceneId,
      activeIncident: `${sceneId} [ARABIAN_SEA]`,
    }),

  setPipelineMode: (mode: PipelineMode) => set({ pipelineMode: mode }),

  setRunningModule: (module) => set({ runningModule: module }),

  setFailedModule: (module, reason = null) =>
    set({
      failedModule: module,
      failureReason: reason,
      isPipelineRunning: false,
      runningModule: null,
    }),

  setPipelineRunning: (running) =>
    set({
      isPipelineRunning: running,
      runningModule: running ? 'Pipeline' : null,
      failedModule: running ? null : get().failedModule,
      failureReason: running ? null : get().failureReason,
    }),

  setPipelineData: (data: FullPipelineResponse | null) => {
    if (!data) {
      set({
        pipelineData: null,
        completedModules: [],
        moduleOutputs: {},
      });
      return;
    }

    const mode = get().pipelineMode;
    const completed: string[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'];

    if (mode === 'EXTENDED' || mode === 'FULL_DECISION_SUPPORT') {
      if (data.impact) completed.push('M11');
      if (data.priority) completed.push('M12');
      if (data.resource_optimization) completed.push('M13');
    }

    if (mode === 'FULL_DECISION_SUPPORT') {
      if (data.explainability) completed.push('M16');
      if (data.action_recommendation) completed.push('M17');
    }

    set({
      pipelineData: data,
      completedModules: completed,
      runningModule: null,
      failedModule: null,
      failureReason: null,
      isPipelineRunning: false,
      lastSuccessfulExecution: new Date().toISOString(),
      provenance: (data.mode as DataProvenance) || 'OBSERVED',
      moduleOutputs: {
        ...get().moduleOutputs,
        m11: data.impact || undefined,
        m12: data.priority || undefined,
        m13: data.resource_optimization || undefined,
        m16: data.explainability || undefined,
        m17: data.action_recommendation || undefined,
      },
    });
  },

  setModuleOutput: (key, output) =>
    set((state) => ({
      moduleOutputs: {
        ...state.moduleOutputs,
        [key]: output,
      },
      completedModules: state.completedModules.includes(key.toUpperCase())
        ? state.completedModules
        : [...state.completedModules, key.toUpperCase()],
    })),

  isModuleAvailable: (moduleCode: string) => {
    const code = moduleCode.toUpperCase();
    const mode = get().pipelineMode;

    // M1 to M10 are always available in all modes
    const baseModules = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'];
    if (baseModules.includes(code)) return true;

    // M14 & M15 are standalone endpoints callable on demand
    if (code === 'M14' || code === 'M15') return true;

    // M11-M13 available in EXTENDED and FULL_DECISION_SUPPORT
    if (['M11', 'M12', 'M13'].includes(code)) {
      return mode === 'EXTENDED' || mode === 'FULL_DECISION_SUPPORT';
    }

    // M16-M17 available in FULL_DECISION_SUPPORT
    if (['M16', 'M17'].includes(code)) {
      return mode === 'FULL_DECISION_SUPPORT';
    }

    return false;
  },

  clearErrors: () => set({ failedModule: null, failureReason: null }),

  resetPipeline: () =>
    set({
      completedModules: [],
      runningModule: null,
      failedModule: null,
      failureReason: null,
      moduleOutputs: {},
      pipelineData: null,
      lastSuccessfulExecution: null,
      isPipelineRunning: false,
    }),
}));
