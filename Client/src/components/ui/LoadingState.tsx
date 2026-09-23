import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'PROCESSING SATELLITE TELEMETRY...',
  submessage = 'Chaining neural segmentation and AIS trajectory solvers',
  className,
}) => {
  return (
    <div
      className={cn(
        'crystalline-panel rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3',
        className
      )}
    >
      <div className="relative">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <div className="absolute inset-0 rounded-full blur-sm bg-cyan-400/20" />
      </div>
      <div>
        <p className="text-xs font-mono font-semibold tracking-wider text-cyan-300">
          {message}
        </p>
        {submessage && (
          <p className="text-[11px] font-mono text-slate-400 mt-1">{submessage}</p>
        )}
      </div>
    </div>
  );
};
