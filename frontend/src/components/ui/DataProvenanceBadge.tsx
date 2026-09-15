import React from 'react';
import { DataProvenance } from '../../types/provenance';
import { getProvenanceConfig } from '../../utils/provenance';
import { cn } from '../../utils/cn';

interface DataProvenanceBadgeProps {
  provenance: DataProvenance | string;
  size?: 'xs' | 'sm' | 'md';
  showDescription?: boolean;
  className?: string;
}

export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
  provenance,
  size = 'sm',
  showDescription = false,
  className,
}) => {
  const config = getProvenanceConfig(provenance);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={cn('crystalline-badge transition-all', sizeClasses[size], className)}
      style={{
        backgroundColor: config.badgeBg,
        color: config.badgeText,
        borderColor: config.badgeBorder,
      }}
      title={config.description}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: config.indicatorColor }}
      />
      {config.label}
      {showDescription && (
        <span className="text-[11px] font-normal text-slate-400 ml-1">
          — {config.description}
        </span>
      )}
    </span>
  );
};

export const ProvenanceBadge = DataProvenanceBadge;
export type { DataProvenanceBadgeProps, DataProvenanceBadgeProps as ProvenanceBadgeProps };

