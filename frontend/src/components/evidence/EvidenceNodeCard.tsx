import React from 'react';
import { EvidenceNode } from '../../types/pipeline';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { cn } from '../../utils/cn';

interface EvidenceNodeCardProps {
  node: EvidenceNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const EvidenceNodeCard: React.FC<EvidenceNodeCardProps> = ({
  node,
  selected = false,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'crystalline-panel rounded-xl p-3.5 transition-all cursor-pointer font-mono text-xs',
        selected
          ? 'border-sky-400 bg-blue-950/40 shadow-[0_0_16px_rgba(56,189,248,0.3)]'
          : 'hover:border-slate-600',
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-sky-300 font-bold text-[10px]">
            {node.source_module}
          </span>
          <span className="text-[11px] font-semibold text-slate-200">
            {node.type.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        <DataProvenanceBadge provenance={node.provenance} size="xs" />
      </div>

      <p className="text-slate-300 text-xs mt-1 line-clamp-2">{node.description}</p>

      {node.confidence !== undefined && node.confidence !== null && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <span>Confidence:</span>
          <span className="text-sky-300 font-bold">
            {(node.confidence * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

