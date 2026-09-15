import React from 'react';
import { Database } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'NO INCIDENT TELEMETRY LOADED',
  description = 'Execute the end-to-end pipeline or select an active scene to inspect telemetry.',
  action,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'crystalline-panel rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3 border-dashed border-slate-700/60',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
        {icon || <Database className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
          {title}
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
