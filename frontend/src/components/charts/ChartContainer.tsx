import React from 'react';
import { CrystallinePanel } from '../ui/CrystallinePanel';
import { DataProvenance } from '../../types/provenance';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { cn } from '../../utils/cn';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  provenance?: DataProvenance;
  action?: React.ReactNode;
  height?: number | string;
  className?: string;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  provenance,
  action,
  height = 260,
  className,
  children,
}) => {
  return (
    <CrystallinePanel
      title={
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100">{title}</span>
          {provenance && <DataProvenanceBadge provenance={provenance} size="xs" />}
        </div>
      }
      subtitle={subtitle}
      headerAction={action}
      className={cn('w-full', className)}
    >
      <div style={{ height, width: '100%' }} className="relative font-mono text-xs">
        {children}
      </div>
    </CrystallinePanel>
  );
};
