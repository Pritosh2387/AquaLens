import React from 'react';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { PriorityIndicator } from '../ui/PriorityIndicator';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { cn } from '../../utils/cn';

interface RecommendationBannerProps {
  action: 'MONITOR' | 'VERIFY' | 'INVESTIGATE' | 'DEPLOY_RESOURCES' | 'URGENT_RESPONSE' | 'ESCALATE' | string;
  priority: string;
  urgencyScore: number;
  confidence: number;
  reasoning: string[];
  disclaimer?: string;
  className?: string;
}

export const RecommendationBanner: React.FC<RecommendationBannerProps> = ({
  action,
  priority,
  urgencyScore,
  confidence,
  reasoning,
  disclaimer,
  className,
}) => {
  const isHighAction = action === 'DEPLOY_RESOURCES' || action === 'URGENT_RESPONSE' || action === 'ESCALATE';

  return (
    <div
      className={cn(
        'crystalline-panel rounded-xl p-5 border-l-4 font-mono transition-all',
        isHighAction
          ? 'border-l-amber-500 bg-amber-950/10'
          : 'border-l-blue-500 bg-blue-950/20',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center border',
              isHighAction
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-blue-600/20 border-blue-500/40 text-sky-400'
            )}
          >
            {isHighAction ? (
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 tracking-wider">
                RECOMMENDED OPERATIONAL DIRECTIVE
              </span>
              <DataProvenanceBadge provenance="SIMULATED" size="xs" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide mt-0.5">
              {action.replace(/_/g, ' ')}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PriorityIndicator score={urgencyScore} urgencyLevel={priority} />
          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px]">CONFIDENCE</span>
            <span className="text-sky-300 font-bold">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Decision Reasoning Trace:
        </h4>
        <ul className="space-y-1 text-xs text-slate-300">
          {reasoning.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-sky-400 text-sm leading-none">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {disclaimer && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-amber-400/90 italic">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{disclaimer}</span>
        </div>
      )}
    </div>
  );
};

