import React from 'react';
import { cn } from '../../utils/cn';

interface ConfidenceIndicatorProps {
  score: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  label,
  showPercentage = true,
  size = 'md',
  className,
}) => {
  const percentage = Math.round(Math.min(Math.max(score, 0), 1) * 100);

  // Confidence color grading
  let color = '#ef4444'; // Low < 50
  let level = 'LOW';
  if (percentage >= 80) {
    color = '#10b981'; // High
    level = 'HIGH';
  } else if (percentage >= 60) {
    color = '#06b6d4'; // Good
    level = 'MODERATE';
  } else if (percentage >= 40) {
    color = '#f59e0b'; // Medium/Warning
    level = 'CAUTION';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className={cn('w-full font-mono', className)}>
      <div className="flex items-center justify-between text-xs mb-1 text-slate-300">
        <span className="text-[11px] text-slate-400">{label || 'CONFIDENCE'}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold" style={{ color }}>
            {level}
          </span>
          {showPercentage && <span className="font-bold">{percentage}%</span>}
        </div>
      </div>
      <div className={cn('w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50', heightClasses[size])}>
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
};
