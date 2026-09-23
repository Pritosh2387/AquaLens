import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, ShieldAlert, Compass } from 'lucide-react';
import { useIncidentStore } from '../../stores/incidentStore';
import { cn } from '../../utils/cn';

const TIME_TICKS = [
  { offset: -48, label: '-48h', phase: 'hindcast' },
  { offset: -24, label: '-24h', phase: 'hindcast' },
  { offset: -12, label: '-12h', phase: 'hindcast' },
  { offset: -6, label: '-6h', phase: 'hindcast' },
  { offset: 0, label: '0h (NOW)', phase: 'now' },
  { offset: 6, label: '+6h', phase: 'forecast' },
  { offset: 12, label: '+12h', phase: 'forecast' },
  { offset: 24, label: '+24h', phase: 'forecast' },
  { offset: 36, label: '+36h', phase: 'forecast' },
  { offset: 48, label: '+48h', phase: 'forecast' },
  { offset: 72, label: '+72h', phase: 'forecast' },
];

interface TimeSliderProps {
  className?: string;
  onOffsetChange?: (offset: number) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({ className, onOffsetChange }) => {
  const { selectedTimeOffset, setSelectedTimeOffset, setActiveHorizon } = useIncidentStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const currentIndex = TIME_TICKS.findIndex((t) => t.offset === selectedTimeOffset);
  const safeIndex = currentIndex >= 0 ? currentIndex : 4; // default to 0h

  const handleSelectOffset = (offset: number) => {
    setSelectedTimeOffset(offset);
    if (offset > 0) {
      const horizonStr = `${offset}h` as '6h' | '12h' | '24h' | '48h' | '72h';
      if (['6h', '12h', '24h', '48h', '72h'].includes(horizonStr)) {
        setActiveHorizon(horizonStr);
      }
    }
    onOffsetChange?.(offset);
  };

  const handleStepNext = () => {
    const nextIdx = (safeIndex + 1) % TIME_TICKS.length;
    handleSelectOffset(TIME_TICKS[nextIdx].offset);
  };

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(400, 1800 / speed);
      timerRef.current = setInterval(() => {
        handleStepNext();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, safeIndex, speed]);

  const currentTick = TIME_TICKS[safeIndex];

  return (
    <div
      className={cn(
        'crystalline-panel p-3.5 rounded-xl font-mono border border-[rgba(56,189,248,0.2)] bg-[#030a1c]/95 shadow-[0_4px_24px_rgba(0,0,0,0.6)] space-y-3',
        className
      )}
    >
      {/* Header Info & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center border shrink-0',
              currentTick.phase === 'hindcast'
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400'
                : currentTick.phase === 'now'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400 animate-pulse'
                : 'bg-sky-950/60 border-sky-500/40 text-sky-400'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
                TEMPORAL SIMULATION SLIDER
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider',
                  currentTick.phase === 'hindcast'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                    : currentTick.phase === 'now'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                    : 'bg-sky-950 text-sky-300 border-sky-500/40'
                )}
              >
                {currentTick.phase === 'hindcast'
                  ? `HINDCAST (${currentTick.label})`
                  : currentTick.phase === 'now'
                  ? 'DETECTION SNAPSHOT (NOW)'
                  : `FORECAST DRIFT (${currentTick.label})`}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {currentTick.phase === 'hindcast'
                ? 'Reverse Lagrangian particle drift & origin estimation'
                : currentTick.phase === 'now'
                ? 'Primary satellite imagery observation (SAR + Optical)'
                : 'Forward multi-horizon slick advection prediction'}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-[#020614] px-2.5 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors',
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-sky-600/30 text-sky-200 hover:bg-sky-600/50 border border-sky-500/40'
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleSelectOffset(0)}
            title="Reset to 0h (Now)"
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-800" />

          {/* Speed toggle */}
          <div className="flex items-center text-[10px] gap-1 text-slate-400">
            <span>SPEED:</span>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'px-1.5 py-0.5 rounded transition-colors',
                  speed === s ? 'bg-sky-500 text-slate-950 font-bold' : 'hover:text-slate-200'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slider Track with Ticks */}
      <div className="relative pt-2 pb-1 px-1">
        {/* Track Line */}
        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 relative overflow-hidden flex">
          {/* Hindcast Zone (Left) */}
          <div className="w-[36%] h-full bg-indigo-950/60 border-r border-indigo-500/30" />
          {/* Now Zone (Middle Point) */}
          <div className="w-[9%] h-full bg-amber-500/40" />
          {/* Forecast Zone (Right) */}
          <div className="w-[55%] h-full bg-sky-950/60" />
        </div>

        {/* Ticks Grid */}
        <div className="relative flex justify-between items-center mt-2.5">
          {TIME_TICKS.map((t, idx) => {
            const isSelected = selectedTimeOffset === t.offset;
            const isPast = t.offset < 0;
            const isNow = t.offset === 0;

            return (
              <button
                key={t.offset}
                onClick={() => handleSelectOffset(t.offset)}
                className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-110 focus:outline-none"
              >
                {/* Dot marker */}
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all',
                    isSelected
                      ? isNow
                        ? 'bg-amber-400 border-white ring-4 ring-amber-500/40 scale-125'
                        : isPast
                        ? 'bg-indigo-400 border-white ring-4 ring-indigo-500/40 scale-125'
                        : 'bg-sky-400 border-white ring-4 ring-sky-500/40 scale-125'
                      : isNow
                      ? 'bg-amber-500/70 border-amber-300'
                      : isPast
                      ? 'bg-indigo-900 border-indigo-500/60 group-hover:border-indigo-400'
                      : 'bg-sky-900 border-sky-500/60 group-hover:border-sky-400'
                  )}
                />

                {/* Tick Label */}
                <span
                  className={cn(
                    'text-[10px] font-bold mt-1.5 transition-colors whitespace-nowrap',
                    isSelected
                      ? isNow
                        ? 'text-amber-300 text-[11px]'
                        : isPast
                        ? 'text-indigo-300 text-[11px]'
                        : 'text-sky-300 text-[11px]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
