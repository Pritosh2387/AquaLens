import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { CommandButton } from './CommandButton';
import { cn } from '../../utils/cn';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'PIPELINE ERROR DETECTED',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'crystalline-panel rounded-lg p-6 border-red-500/30 flex flex-col items-center justify-center text-center gap-3 bg-red-950/20',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xs font-mono font-bold tracking-wider text-red-300">
          {title}
        </h4>
        <p className="text-xs text-slate-300 mt-1 max-w-md font-mono">{message}</p>
      </div>
      {onRetry && (
        <CommandButton
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onRetry}
          className="mt-1"
        >
          Retry Request
        </CommandButton>
      )}
    </div>
  );
};
