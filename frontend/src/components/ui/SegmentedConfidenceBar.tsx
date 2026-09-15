import React from 'react';
import { cn } from '../../utils/cn';

interface SegmentedConfidenceBarProps {
  confidence: number; // 0 to 1
  label?: string;
  segments?: number;
  showLabels?: boolean;
  className?: string;
}

export const SegmentedConfidenceBar: React.FC<SegmentedConfidenceBarProps> = ({
  confidence,
  label = 'MODEL CONFIDENCE',
  segments = 8,
  showLabels = true,
  className,
}) => {
  const clamped = Math.min(Math.max(confidence, 0), 1);
  const activeCount = Math.round(clamped * segments);

  let stateLabel = 'LOW';
  let activeColor = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]';
  let textColor = 'text-red-400';

  if (clamped >= 0.8) {
    stateLabel = 'HIGH / VERIFIED';
    activeColor = 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]';
    textColor = 'text-emerald-400';
  } else if (clamped >= 0.6) {
    stateLabel = 'MODERATE';
    activeColor = 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]';
    textColor = 'text-cyan-400';
  } else if (clamped >= 0.4) {
    stateLabel = 'CAUTION';
    activeColor = 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]';
    textColor = 'text-amber-400';
  }

  return (
    <div className={cn('w-full font-mono text-xs', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="instrument-label text-[10px] text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-bold uppercase', textColor)}>{stateLabel}</span>
          <span className="instrument-value font-bold text-slate-200">
            {(clamped * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 h-3">
        {Array.from({ length: segments }).map((_, idx) => {
          const isActive = idx < activeCount;
          return (
            <div
              key={idx}
              className={cn(
                'h-full flex-1 rounded-[1px] transition-all duration-300',
                isActive
                  ? activeColor
                  : 'bg-slate-900/80 border border-slate-800/80'
              )}
            />
          );
        })}
      </div>

      {showLabels && (
        <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase font-mono tracking-wider">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};
