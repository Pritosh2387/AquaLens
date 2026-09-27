import React, { useState, useEffect } from 'react';
import { useIncidentStore } from '../../stores/incidentStore';
import { usePipelineStore } from '../../stores/pipelineStore';
import { useUIStore } from '../../stores/uiStore';
import { useRunPipeline } from '../../hooks/usePipeline';
import { CommandButton } from '../ui/CommandButton';
import { formatUtcTime } from '../../utils/formatters';
import { Play, Menu, Sparkles, Waves } from 'lucide-react';
import { cn } from '../../utils/cn';

export const TopCommandBar: React.FC = () => {
  const {
    selectedSceneId,
    setSceneId,
    availableScenes,
    pipelineMode,
  } = useIncidentStore();

  const { isPipelineRunning, runningModule, pipelineExecuted } = usePipelineStore();
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const runPipelineMutation = useRunPipeline();

  const [currentTime, setCurrentTime] = useState(formatUtcTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatUtcTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-[#060e20]/96 border-b border-[rgba(56,189,248,0.22)] backdrop-blur-2xl transition-all duration-300 flex items-center justify-between px-4 sm:px-6 font-mono shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
        sidebarCollapsed ? 'left-16' : 'left-0 md:left-64'
      )}
    >
      {/* Left Section: Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center Text Headline: AI FOR OCEANS */}
      <div className="flex flex-col items-center justify-center mx-auto text-center pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400 animate-pulse hidden sm:inline-block" />
          <span className="font-mono font-black text-base sm:text-lg md:text-xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-sky-400 to-blue-400 drop-shadow-[0_0_14px_rgba(56,189,248,0.85)] uppercase">
            AI FOR OCEANS
          </span>
          <Waves className="w-4 h-4 text-sky-400 animate-pulse hidden sm:inline-block" />
        </div>
        <span className="text-[9px] font-mono text-sky-300/80 font-bold tracking-[0.22em] uppercase hidden sm:block -mt-0.5">
          Predictive Maritime Intelligence Engine
        </span>
      </div>

      {/* Right Controls: Live Dot, UTC Time, Scene Selector & Execute */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs">
        {/* Live Data Dot Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span>Live Data</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden md:block text-slate-300 text-xs tabular-nums bg-[#030814] px-2.5 py-1 rounded-lg border border-blue-900/60">
          {currentTime}
        </div>

        {/* Scene Selector — only visible after pipeline has been run */}
        {pipelineExecuted && (
          <select
            value={selectedSceneId}
            onChange={(e) => setSceneId(e.target.value)}
            className="bg-[#030814] border border-blue-500/40 text-sky-300 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400 cursor-pointer shadow-inner hidden sm:block hover:border-sky-400/60 transition-colors"
          >
            {availableScenes.map((scene) => (
              <option key={scene} value={scene}>
                {scene}
              </option>
            ))}
          </select>
        )}

        {/* Run Pipeline Command Button */}
        <CommandButton
          variant="primary"
          size="sm"
          loading={isPipelineRunning}
          icon={<Play className="w-3.5 h-3.5 fill-current" />}
          onClick={handleRunPipeline}
          className="whitespace-nowrap shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          {isPipelineRunning ? (runningModule ? `Run ${runningModule}` : 'Running...') : 'Run Pipeline'}
        </CommandButton>
      </div>
    </header>
  );
};

