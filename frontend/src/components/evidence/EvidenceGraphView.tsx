import React, { useState } from 'react';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';
import { DataProvenance } from '../../types/provenance';
import { CheckCircle, AlertTriangle, Clock, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EvidenceGraphNode {
  id: string;
  moduleCode: string; // e.g. M1, M2, M6, M7, etc.
  label: string;
  category: 'INGESTION' | 'DETECTION' | 'DRIFT' | 'ATTRIBUTION' | 'IMPACT' | 'DIRECTIVE';
  status: 'VERIFIED' | 'NOMINAL' | 'WARNING' | 'PENDING';
  provenance: DataProvenance;
  confidence?: number;
  metric?: string;
  explanation?: string;
  connectedTo?: string[]; // array of node IDs this node flows into
}

interface EvidenceGraphViewProps {
  nodes?: EvidenceGraphNode[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: EvidenceGraphNode) => void;
  className?: string;
}

const defaultPipelineNodes: EvidenceGraphNode[] = [
  {
    id: 'node-incident',
    moduleCode: 'INCIDENT',
    label: 'Incident SCENE_001',
    category: 'INGESTION',
    status: 'VERIFIED',
    provenance: 'OBSERVED',
    confidence: 0.99,
    metric: 'Arabian Sea (18.9°N, 72.8°E)',
    explanation: 'Surveillance alert triggered by Sentinel constellation pass.',
    connectedTo: ['node-sar', 'node-opt', 'node-ais'],
  },
  {
    id: 'node-sar',
    moduleCode: 'M1/M2',
    label: 'Sentinel-1 SAR Detection',
    category: 'DETECTION',
    status: 'VERIFIED',
    provenance: 'OBSERVED',
    confidence: 0.94,
    metric: 'Area: 3.8 km² | Prob: 0.91',
    explanation: 'Deep UNet VV-polarization backscatter dark-patch extraction.',
    connectedTo: ['node-fusion'],
  },
  {
    id: 'node-opt',
    moduleCode: 'M1/M3',
    label: 'Sentinel-2 Optical NDVI/NDWI',
    category: 'DETECTION',
    status: 'NOMINAL',
    provenance: 'OBSERVED',
    confidence: 0.82,
    metric: 'Spectral reflectance anomaly',
    explanation: 'Optical spectral confirmation of high contrast surface slick.',
    connectedTo: ['node-fusion'],
  },
  {
    id: 'node-fusion',
    moduleCode: 'M3/M4',
    label: 'SAR + Optical Confidence Fusion',
    category: 'DETECTION',
    status: 'VERIFIED',
    provenance: 'INFERRED',
    confidence: 0.88,
    metric: 'Spill Conf: 88% (Lookalike: 8%)',
    explanation: 'Dual-sensor Bayesian fusion verifying slick against biogenic look-alikes.',
    connectedTo: ['node-hindcast', 'node-forecast'],
  },
  {
    id: 'node-hindcast',
    moduleCode: 'M7',
    label: 'Hindcast Origin Trajectory',
    category: 'DRIFT',
    status: 'VERIFIED',
    provenance: 'SIMULATED',
    confidence: 0.84,
    metric: 'Top Zone A (40% Prob)',
    explanation: '500-particle Runge-Kutta 4th-order backward metocean drift simulation.',
    connectedTo: ['node-attribution'],
  },
  {
    id: 'node-ais',
    moduleCode: 'M5/M6',
    label: 'Satellite AIS Match & Anomaly',
    category: 'ATTRIBUTION',
    status: 'NOMINAL',
    provenance: 'OBSERVED',
    confidence: 0.85,
    metric: '1 Proximate Target',
    explanation: 'Physical vessel detection correlated with real-time AIS transponder broadcast.',
    connectedTo: ['node-attribution'],
  },
  {
    id: 'node-attribution',
    moduleCode: 'M8',
    label: 'Candidate Vessel Attribution',
    category: 'ATTRIBUTION',
    status: 'WARNING',
    provenance: 'INFERRED',
    confidence: 0.74,
    metric: 'MV_TANKER_ALPHA (Score: 74.2%)',
    explanation: 'Spatiotemporal proximity analysis during estimated release window. Non-legal candidate score.',
    connectedTo: ['node-evidence'],
  },
  {
    id: 'node-forecast',
    moduleCode: 'M9/M10',
    label: '72h Plume Forecast & Uncertainty',
    category: 'DRIFT',
    status: 'NOMINAL',
    provenance: 'SIMULATED',
    confidence: 0.76,
    metric: '+72h Plume: 27.2 km²',
    explanation: 'Forward multi-horizon hydrodynamic drift model with 100 Monte Carlo perturbation iterations.',
    connectedTo: ['node-impact'],
  },
  {
    id: 'node-impact',
    moduleCode: 'M11/M12',
    label: 'Asset Vulnerability & Priority',
    category: 'IMPACT',
    status: 'WARNING',
    provenance: 'INFERRED',
    confidence: 0.85,
    metric: 'Priority: 67 / 100 [HIGH]',
    explanation: 'Marine sanctuary and coastal fishing zone collision probability evaluation.',
    connectedTo: ['node-resources', 'node-directive'],
  },
  {
    id: 'node-resources',
    moduleCode: 'M13',
    label: 'Containment Fleet Optimization',
    category: 'IMPACT',
    status: 'NOMINAL',
    provenance: 'SIMULATED',
    confidence: 0.90,
    metric: '3/15 Vessels Allocated',
    explanation: 'Linear programming allocation maximizing boom and skimmer coverage within 4h response window.',
    connectedTo: ['node-directive'],
  },
  {
    id: 'node-directive',
    moduleCode: 'M17',
    label: 'Recommended Operational Action',
    category: 'DIRECTIVE',
    status: 'VERIFIED',
    provenance: 'SIMULATED',
    confidence: 0.73,
    metric: 'ACTION: DEPLOY_RESOURCES',
    explanation: 'High-urgency containment deployment with mandatory human-in-the-loop verification.',
    connectedTo: [],
  },
];

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  nodes = defaultPipelineNodes,
  selectedNodeId,
  onSelectNode,
  className,
}) => {
  const [activeNode, setActiveNode] = useState<EvidenceGraphNode>(
    nodes.find((n) => n.id === selectedNodeId) || nodes[0]
  );

  const handleNodeClick = (node: EvidenceGraphNode) => {
    setActiveNode(node);
    onSelectNode?.(node);
  };

  const getStatusIcon = (status: EvidenceGraphNode['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'NOMINAL':
        return <CheckCircle className="w-3.5 h-3.5 text-sky-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'PENDING':
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className={cn('crystalline-panel rounded-xl flex flex-col font-mono text-xs', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#09152b]/90 border-b border-[rgba(56,189,248,0.18)]">
        <div className="flex items-center gap-2">
          <span className="text-sky-400 font-bold">●</span>
          <span className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            END-TO-END EVIDENCE & DECISION GRAPH (M16 / M17)
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          {nodes.length} VERIFIED TRACE NODES
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Pipeline Sequence Grid */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {nodes.map((node) => {
              const isSelected = activeNode.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={cn(
                    'p-3 rounded-lg border transition-all cursor-pointer select-none flex flex-col justify-between relative group',
                    isSelected
                      ? 'bg-blue-950/50 border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.3)]'
                      : 'bg-[#050e1f]/70 border-slate-800 hover:border-slate-700 hover:bg-[#071329]'
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 border border-slate-700 text-sky-300">
                        {node.moduleCode}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{node.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DataProvenanceBadge provenance={node.provenance} size="xs" />
                      {getStatusIcon(node.status)}
                    </div>
                  </div>

                  <h4 className="font-bold text-xs text-slate-100 truncate mt-0.5">{node.label}</h4>

                  {node.metric && (
                    <div className="mt-2 text-[11px] font-mono text-sky-300 truncate">
                      {node.metric}
                    </div>
                  )}

                  {node.confidence !== undefined && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                      <span>CONFIDENCE</span>
                      <span className="font-bold text-slate-200">
                        {(node.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-sky-400 rounded-l" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Node Inspector / Detail Trace */}
        <div className="crystalline-panel rounded-xl p-4 bg-[#030914]/90 border-blue-500/30 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="instrument-label">EVIDENCE INSPECTOR</span>
              <DataProvenanceBadge provenance={activeNode.provenance} size="xs" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-sky-300 border border-blue-500/40">
                  {activeNode.moduleCode}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{activeNode.label}</h3>
              </div>
              <p className="text-[10px] text-slate-400 uppercase mt-0.5 tracking-wider">
                CATEGORY: {activeNode.category}
              </p>
            </div>

            {activeNode.metric && (
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">PRIMARY METRIC</span>
                <span className="text-xs font-bold text-sky-300">{activeNode.metric}</span>
              </div>
            )}

            {activeNode.explanation && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase mb-1">
                  SCIENTIFIC EXPLANATION
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#061022]/80 p-2.5 rounded border border-slate-800/80">
                  {activeNode.explanation}
                </p>
              </div>
            )}

            {activeNode.connectedTo && activeNode.connectedTo.length > 0 && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase mb-1">
                  DOWNSTREAM DATA FLOW
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeNode.connectedTo.map((targetId) => {
                    const target = nodes.find((n) => n.id === targetId);
                    return (
                      <span
                        key={targetId}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-blue-950/40 border border-blue-500/30 text-sky-300"
                      >
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span>{target?.moduleCode || targetId}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Click any node to trace algorithmic reasoning and evidence provenance.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

