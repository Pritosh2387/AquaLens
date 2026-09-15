import React from 'react';
import { cn } from '../../utils/cn';

interface ProbabilityMeterProps {
  value: number; // 0 to 1
  segments?: number;
  label?: string;
  className?: string;
}

export const ProbabilityMeter: React.FC<ProbabilityMeterProps> = ({
  value,
  segments = 10,
  label,
  className,
}) => {
  const clamped = Math.min(Math.max(value, 0), 1);
  const activeCount = Math.round(clamped * segments);

  return (
    <div className={cn('flex flex-col gap-1 font-mono', className)}>
      {label && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span className="text-cyan-400 font-semibold">{clamped.toFixed(2)}</span>
        </div>
      )}
      <div className="flex gap-1 items-center">
        {Array.from({ length: segments }).map((_, idx) => {
          const isActive = idx < activeCount;
          let activeColor = 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]';
          if (idx >= 8) activeColor = 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]';
          else if (idx >= 6) activeColor = 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]';

          return (
            <div
              key={idx}
              className={cn(
                'h-3 flex-1 rounded-[1px] transition-all duration-300',
                isActive ? activeColor : 'bg-slate-800/80 border border-slate-700/30'
              )}
            />
          );
        })}
      </div>
    </div>
  );
};
