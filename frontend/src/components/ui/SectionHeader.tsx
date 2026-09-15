import React from 'react';
import { cn } from '../../utils/cn';
import { DataProvenance } from '../../types/provenance';
import { DataProvenanceBadge } from './DataProvenanceBadge';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  provenance?: DataProvenance;
  moduleTag?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  provenance,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3',
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
            {title}
          </h2>
          {provenance && <DataProvenanceBadge provenance={provenance} size="xs" />}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};
