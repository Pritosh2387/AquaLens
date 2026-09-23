import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface HorizonStep {
  id: string;
  label: string;
  hours: number;
  areaKm2?: number;
  confidence?: number;
  centroid?: [number, number];
  weather?: { windKts: number; currentKts: number };
}

interface ForecastTimelineProps {
  horizons?: HorizonStep[];
  selectedHorizon: string;
  onSelectHorizon: (id: string) => void;
  className?: string;
}

const defaultHorizons: HorizonStep[] = [
  { id: '0h', label: 'CURRENT (0h)', hours: 0, areaKm2: 3.8, confidence: 0.92 },
  { id: '6h', label: '+6 HOURS', hours: 6, areaKm2: 5.4, confidence: 0.88 },
  { id: '12h', label: '+12 HOURS', hours: 12, areaKm2: 8.1, confidence: 0.82 },
  { id: '24h', label: '+24 HOURS', hours: 24, areaKm2: 12.6, confidence: 0.75 },
  { id: '48h', label: '+48 HOURS', hours: 48, areaKm2: 19.5, confidence: 0.64 },
  { id: '72h', label: '+72 HOURS', hours: 72, areaKm2: 27.2, confidence: 0.52 },
];

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  horizons = defaultHorizons,
  selectedHorizon,
  onSelectHorizon,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto progression playback
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      const currentIndex = horizons.findIndex((h) => h.id === selectedHorizon);
      const nextIndex = (currentIndex + 1) % horizons.length;
      onSelectHorizon(horizons[nextIndex].id);
    }, 2000);

    return () => clearInterval(timer);
  }, [isPlaying, selectedHorizon, horizons, onSelectHorizon]);

  const handleStepPrev = () => {
    const currentIndex = horizons.findIndex((h) => h.id === selectedHorizon);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : horizons.length - 1;
    onSelectHorizon(horizons[prevIndex].id);
  };

  const handleStepNext = () => {
    const currentIndex = horizons.findIndex((h) => h.id === selectedHorizon);
    const nextIndex = (currentIndex + 1) % horizons.length;
    onSelectHorizon(horizons[nextIndex].id);
  };

  const currentHorizonData = horizons.find((h) => h.id === selectedHorizon) || horizons[0];

  return (
    <div className={cn('crystalline-panel rounded-lg p-4 font-mono select-none', className)}>
      {/* Header: Title, Playback Controls, Active Horizon Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            FORECAST TRAJECTORY TIMELINE (M9)
          </span>
        </div>

        {/* Playback Button Group */}
        <div className="flex items-center gap-1.5 bg-[#040a17] border border-slate-800 rounded p-1">
          <button
            onClick={handleStepPrev}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors"
            title="Step Previous Horizon"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors',
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            )}
            title={isPlaying ? 'Pause Simulation Playback' : 'Play Forward Trajectory'}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
          <button
            onClick={handleStepNext}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors"
            title="Step Next Horizon"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Horizontal Progression Bar */}
      <div className="mt-4 relative">
        {/* Connecting Baseline Track */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -translate-y-1/2" />

        {/* Dynamic Progress Fill */}
        {(() => {
          const activeIdx = horizons.findIndex((h) => h.id === selectedHorizon);
          const progressPct = (activeIdx / (horizons.length - 1)) * 100;
          return (
            <div
              className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-cyan-500 to-amber-500 -translate-y-1/2 transition-all duration-300"
              style={{ width: `calc(${progressPct}% - 12px)` }}
            />
          );
        })()}

        {/* Horizon Step Nodes */}
        <div className="relative flex justify-between items-start">
          {horizons.map((h, idx) => {
            const isSelected = h.id === selectedHorizon;
            const isPast = horizons.findIndex((item) => item.id === selectedHorizon) >= idx;

            // Forecast uncertainty increases opacity/dispersion over time
            const nodeOpacity = Math.max(0.4, 1 - idx * 0.1);

            return (
              <div
                key={h.id}
                onClick={() => onSelectHorizon(h.id)}
                className="flex flex-col items-center cursor-pointer group"
                style={{ opacity: isPast ? 1 : nodeOpacity }}
              >
                {/* Visual Ring Node */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-[#040a17]',
                    isSelected
                      ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-110'
                      : isPast
                      ? 'border-cyan-400 group-hover:border-cyan-300'
                      : 'border-slate-700 group-hover:border-slate-500'
                  )}
                >
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-colors',
                      isSelected
                        ? 'bg-amber-400 animate-pulse'
                        : isPast
                        ? 'bg-cyan-400'
                        : 'bg-slate-700'
                    )}
                  />
                </div>

                {/* Node Label */}
                <span
                  className={cn(
                    'mt-2 text-[11px] font-bold tracking-tight text-center transition-colors',
                    isSelected ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                >
                  {h.label}
                </span>

                {h.areaKm2 !== undefined && (
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {h.areaKm2} km²
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Horizon Telemetry Pill */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 bg-[#040a17]/50 p-2 rounded">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[10px] uppercase">SELECTED HORIZON:</span>
          <span className="font-bold text-amber-400">{currentHorizonData.label}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">EXPANSION:</span>
          <span className="text-slate-200 font-semibold">{currentHorizonData.areaKm2 || '—'} km²</span>
        </div>

        {currentHorizonData.confidence !== undefined && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <AlertCircle className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">CONFIDENCE:</span>
            <span className="text-cyan-300 font-bold">
              {(currentHorizonData.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
