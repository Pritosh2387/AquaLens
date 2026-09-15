import React from 'react';
import { cn } from '../../utils/cn';
import { DataProvenance } from '../../types/provenance';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { LucideIcon, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type MetricStatus = 'nominal' | 'caution' | 'critical' | 'informational' | 'neutral';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  secondaryContext?: string;
  sublabel?: string; // alias for secondaryContext
  secondary?: string; // alias for secondaryContext
  provenance?: DataProvenance;
  icon?: LucideIcon;
  status?: MetricStatus;
  statusColor?: string; // backward-compatibility alias
  tabularNums?: boolean;
  trend?: {
    value: string;
    direction?: 'up' | 'down' | 'neutral';
    positive?: boolean;
  };
  tooltip?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  secondaryContext,
  sublabel,
  secondary,
  provenance,
  icon: Icon,
  status = 'informational',
  statusColor,
  tabularNums = true,
  trend,
  tooltip,
  className,
}) => {
  const displaySecondary = secondaryContext ?? sublabel ?? secondary;
  const effectiveStatus: MetricStatus =
    statusColor === 'cyan'
      ? 'informational'
      : statusColor === 'emerald'
      ? 'nominal'
      : statusColor === 'amber'
      ? 'caution'
      : statusColor === 'red'
      ? 'critical'
      : status;
  const statusStyles: Record<MetricStatus, { text: string; border: string; glow: string }> = {
    nominal: {
      text: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
      glow: 'group-hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    },
    caution: {
      text: 'text-amber-400',
      border: 'hover:border-amber-500/40',
      glow: 'group-hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    },
    critical: {
      text: 'text-red-400',
      border: 'hover:border-red-500/40',
      glow: 'group-hover:shadow-[0_0_12px_rgba(239,68,68,0.15)]',
    },
    informational: {
      text: 'text-cyan-400',
      border: 'hover:border-cyan-500/40',
      glow: 'group-hover:shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    },
    neutral: {
      text: 'text-slate-200',
      border: 'hover:border-slate-500/40',
      glow: '',
    },
  };

  const currentStyle = statusStyles[effectiveStatus];

  return (
    <div
      className={cn(
        'crystalline-panel rounded-lg p-3.5 flex flex-col justify-between relative group transition-all duration-300',
        currentStyle.border,
        currentStyle.glow,
        className
      )}
    >
      {/* Top Header Row: Label, Tooltip, Provenance & Icon */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="instrument-label truncate" title={label}>
            {label}
          </span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-slate-500 hover:text-cyan-300 transition-colors">
              <HelpCircle className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {provenance && <DataProvenanceBadge provenance={provenance} size="xs" />}
          {Icon && (
            <Icon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1.5 my-1.5">
        <span
          className={cn(
            'text-2xl font-bold instrument-value',
            tabularNums && 'tabular-nums',
            currentStyle.text
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {/* Footer Row: Secondary Context & Optional Trend */}
      {(displaySecondary || trend) && (
        <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-slate-400 pt-1.5 border-t border-slate-800/60">
          {displaySecondary ? (
            <span className="truncate pr-1 text-slate-400">{displaySecondary}</span>
          ) : (
            <span />
          )}

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 shrink-0 font-medium',
                trend.positive ? 'text-emerald-400' : 'text-amber-400'
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

