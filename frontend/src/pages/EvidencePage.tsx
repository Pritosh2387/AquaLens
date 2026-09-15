import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, Radio, Ship, MapPin,
  ArrowDown, Layers, TrendingUp, Zap, Eye, GitBranch,
} from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import { CommandButton } from '../components/ui/CommandButton';

interface EvidenceNode {
  id: string;
  label: string;
  sublabel: string;
  value: string;
  icon: React.ElementType;
  color: string;
  confidence?: number;
  status: 'CONFIRMED' | 'INFERRED' | 'SIMULATED';
  children?: string[];
}

const INC = DEMO_INCIDENT;

const EVIDENCE_NODES: EvidenceNode[] = [
  {
    id: 'incident',
    label: 'INCIDENT',
    sublabel: INC.sceneId,
    value: INC.incidentId,
    icon: Radio,
    color: 'sky',
    status: 'CONFIRMED',
    children: ['detection'],
  },
  {
    id: 'detection',
    label: 'SPILL DETECTION',
    sublabel: 'SAR + Optical Fusion',
    value: `${(INC.spillProbability * 100).toFixed(0)}% probability`,
    icon: Layers,
    color: 'amber',
    confidence: INC.spillProbability,
    status: 'CONFIRMED',
    children: ['hindcast', 'vessel'],
  },
  {
    id: 'hindcast',
    label: 'HINDCAST ORIGIN',
    sublabel: 'Lagrangian Backward Drift',
    value: `${INC.origin.latitude}° N, ${INC.origin.longitude}° E`,
    icon: MapPin,
    color: 'indigo',
    confidence: INC.origin.confidence,
    status: 'INFERRED',
    children: ['attribution'],
  },
  {
    id: 'vessel',
    label: 'AIS ANALYSIS',
    sublabel: '5 candidate vessels',
    value: '3h 22m AIS gap detected',
    icon: Ship,
    color: 'purple',
    confidence: 0.88,
    status: 'CONFIRMED',
    children: ['attribution'],
  },
  {
    id: 'attribution',
    label: 'VESSEL ATTRIBUTION',
    sublabel: INC.suspectedVessel,
    value: `Score ${(INC.attributionScore * 100).toFixed(0)}%`,
    icon: Eye,
    color: 'red',
    confidence: INC.attributionScore,
    status: 'INFERRED',
    children: ['forecast'],
  },
  {
    id: 'forecast',
    label: 'SPILL FORECAST',
    sublabel: '6h / 12h / 24h horizons',
    value: `Shore ETA: ${INC.forecast.shoreImpactEta}`,
    icon: TrendingUp,
    color: 'orange',
    confidence: 0.88,
    status: 'SIMULATED',
    children: ['impact'],
  },
  {
    id: 'impact',
    label: 'IMPACT ASSESSMENT',
    sublabel: 'Ecological + Economic',
    value: `Severity: ${INC.impactAssessment.overallSeverity}`,
    icon: AlertTriangle,
    color: 'rose',
    confidence: INC.impactAssessment.ecologicalRisk,
    status: 'INFERRED',
    children: ['priority'],
  },
  {
    id: 'priority',
    label: 'PRIORITY SCORE',
    sublabel: 'Multi-criteria weighting',
    value: `${INC.priorityScore} / 10`,
    icon: Zap,
    color: 'amber',
    confidence: INC.priorityScore / 10,
    status: 'INFERRED',
    children: ['recommendation'],
  },
  {
    id: 'recommendation',
    label: 'RECOMMENDATION',
    sublabel: INC.recommendation.action,
    value: `${INC.recommendation.confidence * 100}% confidence`,
    icon: ShieldAlert,
    color: 'emerald',
    confidence: INC.recommendation.confidence,
    status: 'INFERRED',
  },
];

const colorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  sky: { text: 'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-400/50', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-400/50', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' },
  indigo: { text: 'text-indigo-300', bg: 'bg-indigo-500/15', border: 'border-indigo-400/50', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.3)]' },
  purple: { text: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-400/50', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
  red: { text: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-400/50', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' },
  orange: { text: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-400/50', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' },
  rose: { text: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-400/50', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-400/50', glow: 'shadow-[0_0_16px_rgba(52,211,153,0.4)]' },
};

const statusBadge = (status: string) => {
  if (status === 'CONFIRMED') return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
  if (status === 'INFERRED') return 'bg-indigo-950 text-indigo-300 border-indigo-500/40';
  return 'bg-sky-950 text-sky-300 border-sky-500/40';
};

export const EvidencePage: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const inc = INC;

  return (
    <div className="space-y-5 font-mono text-xs">
      <SectionHeader
        title="Evidence & Recommendations"
        subtitle={`Intelligence chain analysis — Incident ${inc.incidentId} (Modules M16–M17)`}
        provenance="INFERRED"
        moduleTag="M16,M17"
      />

      {/* Evidence Chain Graph */}
      <CrystallinePanel title="Intelligence Evidence Chain" subtitle="How AquaLens arrived at its recommendation">
        <div className="py-4 overflow-x-auto">
          <div className="flex flex-col items-center gap-0 min-w-[600px]">
            {EVIDENCE_NODES.map((node, idx) => {
              const cls = colorMap[node.color];
              const Icon = node.icon;
              const isActive = hoveredNode === node.id || hoveredNode === null;
              const isLast = idx === EVIDENCE_NODES.length - 1;

              return (
                <div key={node.id} className="flex flex-col items-center w-full">
                  {/* Node */}
                  <div
                    className={`w-full max-w-lg transition-all duration-200 cursor-pointer rounded-xl border ${cls.border} ${cls.bg} ${cls.glow} p-3 flex items-center gap-4 ${
                      !isActive ? 'opacity-40' : ''
                    }`}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div className={`w-9 h-9 rounded-lg ${cls.bg} border ${cls.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${cls.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-black text-[11px] tracking-wider ${cls.text}`}>{node.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${statusBadge(node.status)}`}>
                          {node.status}
                        </span>
                        {node.confidence !== undefined && (
                          <span className="text-[9px] text-slate-400">
                            conf: <span className={`font-bold ${cls.text}`}>{(node.confidence * 100).toFixed(0)}%</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{node.sublabel}</div>
                      <div className={`text-[11px] font-bold ${cls.text} mt-0.5`}>{node.value}</div>
                    </div>
                    {node.confidence !== undefined && (
                      <div className="shrink-0 w-12">
                        <div className="w-full h-1.5 bg-slate-800 rounded-full">
                          <div
                            className={`h-full rounded-full`}
                            style={{
                              width: `${node.confidence * 100}%`,
                              background: node.confidence > 0.8 ? '#10b981' : node.confidence > 0.6 ? '#d97706' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connector Arrow */}
                  {!isLast && (
                    <div className="flex flex-col items-center my-1">
                      <div className="w-0.5 h-4 bg-slate-700" />
                      <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CrystallinePanel>

      {/* Bottom: Full Recommendation + Supporting Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recommendation Panel */}
        <CrystallinePanel
          title="Final Recommendation"
          subtitle="AI decision support directive"
          headerAction={
            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
              inc.priorityLabel === 'HIGH'
                ? 'bg-red-950 text-red-300 border-red-500/40'
                : 'bg-amber-950 text-amber-300 border-amber-500/40'
            }`}>
              {inc.priorityLabel} PRIORITY
            </span>
          }
        >
          <div className="space-y-4">
            {/* Main Action */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-black text-sm tracking-wide">{inc.recommendation.action}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px] mt-2">
                <div>
                  <span className="text-slate-400 block">Urgency Score</span>
                  <span className="text-amber-400 font-black text-lg">{inc.priorityScore} / 10</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Confidence</span>
                  <span className="text-emerald-400 font-black text-lg">{(inc.recommendation.confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Est. Recovery</span>
                  <span className="text-sky-300 font-bold">{inc.recommendation.estimatedRecovery}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Deploy Window</span>
                  <span className="text-amber-300 font-bold">{inc.recommendation.deploymentWindow}</span>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">REASONING</div>
              {inc.recommendation.reasoning.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{r}</span>
                </div>
              ))}
            </div>

            {/* Recommended Resources */}
            <div className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">RECOMMENDED RESOURCES</div>
              {[
                { label: 'Skimmers', value: `${inc.recommendation.resources.skimmers} units` },
                { label: 'Booms', value: `${inc.recommendation.resources.booms} units` },
                { label: 'Response Vessels', value: `${inc.recommendation.resources.responseVessels} ship` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{label}:</span>
                  <span className="text-sky-300 font-bold">{value}</span>
                </div>
              ))}
            </div>

            {/* Human Verification */}
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="text-amber-300 font-bold">HUMAN VERIFICATION REQUIRED</span>
                <p className="text-slate-400 mt-0.5">
                  This recommendation requires human operational command approval before any physical deployment.
                </p>
              </div>
            </div>

            {!accepted ? (
              <CommandButton
                variant="primary"
                size="sm"
                icon={<ShieldAlert className="w-3.5 h-3.5" />}
                onClick={() => setAccepted(true)}
                className="w-full justify-center"
              >
                Accept & Proceed to Deployment
              </CommandButton>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold text-[11px]">ACCEPTED — Deployment order recorded.</span>
              </div>
            )}
          </div>
        </CrystallinePanel>

        {/* Supporting Evidence */}
        <CrystallinePanel title="Supporting Evidence" subtitle="Full intelligence chain summary">
          <div className="space-y-2">
            {[
              {
                title: 'Spill Detection', icon: Layers, status: 'CONFIRMED',
                points: [
                  `SAR contribution: ${(inc.sensor.sarContribution * 100).toFixed(0)}%`,
                  `Optical contribution: ${(inc.sensor.opticalContribution * 100).toFixed(0)}%`,
                  `Fusion confidence: ${(inc.sensor.fusionConfidence * 100).toFixed(0)}%`,
                  `Spill area: ${inc.estimatedAreaStr}`,
                ],
              },
              {
                title: 'Origin & Hindcast', icon: MapPin, status: 'INFERRED',
                points: [
                  `Origin: ${inc.origin.latitude}° N, ${inc.origin.longitude}° E`,
                  `Confidence: ${(inc.origin.confidence * 100).toFixed(0)}%`,
                  `Release window: ${inc.releaseWindow.start.slice(11)}–${inc.releaseWindow.end.slice(11)}`,
                ],
              },
              {
                title: 'Vessel Attribution', icon: Ship, status: 'INFERRED',
                points: [
                  `Primary: ${inc.suspectedVessel}`,
                  `Attribution score: ${(inc.attributionScore * 100).toFixed(0)}%`,
                  'AIS gap: 3h 22m at release window',
                  'SAR dark vessel confirmed at origin',
                ],
              },
              {
                title: 'Spill Forecast', icon: TrendingUp, status: 'SIMULATED',
                points: [
                  `Direction: ${inc.forecast.primaryDirection}`,
                  `Speed: ${inc.metocean.currentSpeedMs} m/s`,
                  `Shore ETA: ${inc.forecast.shoreImpactEta}`,
                  '+24h area: 312.4 km²',
                ],
              },
              {
                title: 'Impact Assessment', icon: AlertTriangle, status: 'INFERRED',
                points: [
                  `Ecological risk: ${(inc.impactAssessment.ecologicalRisk * 100).toFixed(0)}%`,
                  `Fisheries risk: ${(inc.impactAssessment.fisheriesRisk * 100).toFixed(0)}%`,
                  `Shore impact ETA: ${inc.forecast.shoreImpactEta}`,
                  `Affected area: 183.4 km²`,
                ],
              },
            ].map(({ title, icon: Icon, status, points }) => (
              <div key={title} className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-bold text-slate-200 text-[11px]">{title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ml-auto ${statusBadge(status)}`}>
                    {status}
                  </span>
                </div>
                {points.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-5">
                    <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CrystallinePanel>
      </div>
    </div>
  );
};
