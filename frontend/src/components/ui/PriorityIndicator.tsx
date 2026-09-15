import React from 'react';
import { cn } from '../../utils/cn';
import { AlertOctagon, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface PriorityIndicatorProps {
  score: number; // 0 to 100
  urgencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  showIcon?: boolean;
  className?: string;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  score,
  urgencyLevel,
  showIcon = true,
  className,
}) => {
  const level =
    urgencyLevel ||
    (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');

  const configs: Record<
    string,
    { color: string; bg: string; border: string; icon: React.ElementType }
  > = {
    CRITICAL: {
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: AlertOctagon,
    },
    HIGH: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: AlertTriangle,
    },
    MEDIUM: {
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      icon: Info,
    },
    LOW: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: CheckCircle,
    },
  };

  const config = configs[level] || configs.LOW;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded border font-mono text-xs',
        config.bg,
        config.border,
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="w-4 h-4 animate-pulse" />}
      <span className="font-bold tracking-wider">{level}_PRIORITY</span>
      <span className="opacity-70">({score.toFixed(1)}/100)</span>
    </div>
  );
};
