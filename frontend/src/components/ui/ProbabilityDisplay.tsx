import React from 'react';
import { cn } from '../../utils/cn';

interface ProbabilityDisplayProps {
  probability: number; // 0 to 1
  label?: string;
  source?: string;
  isLookalike?: boolean;
  className?: string;
}

export const ProbabilityDisplay: React.FC<ProbabilityDisplayProps> = ({
  probability,
  label = 'DETECTION PROBABILITY',
  source,
  isLookalike = false,
  className,
}) => {
  const clamped = Math.min(Math.max(probability, 0), 1);
  const percentage = (clamped * 100).toFixed(1);

  // Probability is about whether a feature IS an oil slick vs lookalike
  const isHighProbability = clamped >= 0.7;
  const isModerateProbability = clamped >= 0.4 && clamped < 0.7;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border font-mono transition-all',
        isLookalike
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
          : isHighProbability
          ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
          : 'bg-slate-900/40 border-slate-800 text-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
        <span className="instrument-label">{label}</span>
        {source && (
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 uppercase">
            {source}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold instrument-value tracking-tight">
            {clamped.toFixed(3)}
          </span>
          <span className="text-xs text-slate-400">({percentage}%)</span>
        </div>

        <div className="text-right">
          {isLookalike ? (
            <span className="text-[10px] font-bold text-amber-400 block tracking-wider uppercase">
              POTENTIAL LOOK-ALIKE
            </span>
          ) : isHighProbability ? (
            <span className="text-[10px] font-bold text-cyan-400 block tracking-wider uppercase">
              HIGH PROBABILITY SPILL
            </span>
          ) : isModerateProbability ? (
            <span className="text-[10px] font-bold text-amber-400 block tracking-wider uppercase">
              ANOMALOUS SLICK
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-500 block tracking-wider uppercase">
              BASELINE / LOW PROBABILITY
            </span>
          )}
        </div>
      </div>

      {/* Thin Probability Progress Line */}
      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-2">
        <div
          className={cn(
            'h-full transition-all duration-500',
            isLookalike
              ? 'bg-amber-400'
              : isHighProbability
              ? 'bg-cyan-400'
              : 'bg-slate-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
