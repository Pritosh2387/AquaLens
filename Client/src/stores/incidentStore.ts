import { create } from 'zustand';
import { DEFAULT_SCENE_ID, AVAILABLE_SCENES } from '../config/constants';
import { FullPipelineResponse } from '../types/pipeline';
import { usePipelineStore, PipelineMode } from './pipelineStore';

interface IncidentState {
  selectedSceneId: string;
  availableScenes: string[];
  activeHorizon: '6h' | '12h' | '24h' | '48h' | '72h';
  selectedTimeOffset: number; // in hours: -48, -24, -12, -6, 0, 6, 12, 24, 36, 48, 72
  pipelineData: FullPipelineResponse | null;
  isPipelineRunning: boolean;
  lastRunTimestamp: string | null;
  operationalMode: string;
  pipelineMode: PipelineMode;
  includeFullDecisionSupport: boolean;
  failedModule: string | null;
  failureReason: string | null;

  setSceneId: (sceneId: string) => void;
  setActiveHorizon: (horizon: '6h' | '12h' | '24h' | '48h' | '72h') => void;
  setSelectedTimeOffset: (offset: number) => void;
  setPipelineData: (data: FullPipelineResponse | null) => void;
  setPipelineRunning: (running: boolean) => void;
  setPipelineMode: (mode: PipelineMode) => void;
  setFailedModule: (module: string | null, reason?: string | null) => void;
  toggleDecisionSupport: () => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  selectedSceneId: DEFAULT_SCENE_ID,
  availableScenes: AVAILABLE_SCENES,
  activeHorizon: '24h',
  selectedTimeOffset: 0,
  pipelineData: null,
  isPipelineRunning: false,
  lastRunTimestamp: null,
  operationalMode: 'MOCK',
  pipelineMode: 'FULL_DECISION_SUPPORT',
  includeFullDecisionSupport: true,
  failedModule: null,
  failureReason: null,

  setSceneId: (sceneId) => {
    set({ selectedSceneId: sceneId });
    usePipelineStore.getState().setCurrentScene(sceneId);
    usePipelineStore.getState().resetPipeline();
  },
  setActiveHorizon: (horizon) => set({ activeHorizon: horizon }),
  setSelectedTimeOffset: (offset) => set({ selectedTimeOffset: offset }),
  setPipelineData: (data) => {
    set({
      pipelineData: data,
      lastRunTimestamp: data ? new Date().toISOString() : null,
      failedModule: null,
      failureReason: null,
    });
    usePipelineStore.getState().setPipelineData(data);
  },
  setPipelineRunning: (running) => {
    set({ isPipelineRunning: running });
    usePipelineStore.getState().setPipelineRunning(running);
  },
  setPipelineMode: (mode) => {
    set({
      pipelineMode: mode,
      includeFullDecisionSupport: mode === 'FULL_DECISION_SUPPORT',
    });
    usePipelineStore.getState().setPipelineMode(mode);
  },
  setFailedModule: (module, reason = null) => {
    set({ failedModule: module, failureReason: reason, isPipelineRunning: false });
    usePipelineStore.getState().setFailedModule(module, reason);
  },
  toggleDecisionSupport: () =>
    set((state) => {
      const nextMode: PipelineMode =
        state.pipelineMode === 'FULL_DECISION_SUPPORT' ? 'EXTENDED' : 'FULL_DECISION_SUPPORT';
      usePipelineStore.getState().setPipelineMode(nextMode);
      return {
        pipelineMode: nextMode,
        includeFullDecisionSupport: nextMode === 'FULL_DECISION_SUPPORT',
      };
    }),
}));

