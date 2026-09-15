import React, { useState } from 'react';
import { Satellite, Radio, History, Ship, Wind, AlertTriangle, ShieldAlert, CheckCircle2, ArrowDown, MapPin } from 'lucide-react';
import { DataProvenanceBadge } from '../ui/DataProvenanceBadge';

export interface EvidenceNodeData {
  id: string;
  label: string;
  category: string;
  provenance: 'MOCK' | 'OBSERVED' | 'INFERRED' | 'SIMULATED' | 'FEEDBACK';
  confidence: number;
  icon: any;
  summary: string;
  details: Record<string, string | number>;
  explanation: string;
}

const NODES: EvidenceNodeData[] = [
  {
    id: 'incident',
    label: 'Incident',
    category: 'Target Scene Ingestion',
    provenance: 'OBSERVED',
    confidence: 1.0,
    icon: Radio,
    summary: 'SAR Scene Ingested: SCENE_001 [Arabian Sea Sector]',
    details: { 'Scene ID': 'SCENE_001', Coordinates: '18.97° N, 72.82° E', Resolution: '10m', Sensor: 'Sentinel-1 SAR' },
    explanation: 'Satellite radar pass acquired over Mumbai offshore oil transport corridor.',
  },
  {
    id: 'inputs',
    label: 'Satellite + AIS + Environment',
    category: 'Multi-Sensor Data Fusion',
    provenance: 'OBSERVED',
    confidence: 0.95,
    icon: Satellite,
    summary: 'Sentinel-1 SAR + Sentinel-2 Optical + AIS Streams',
    details: { 'SAR Backscatter': 'Dark Slick Feature', 'Optical Cover': 'NDVI Obscured 8.4%', 'AIS Stream': '5 Proximate Vessels' },
    explanation: 'Cross-sensor integration combining synthetic aperture radar, optical multispectral imagery, and real-time AIS tracks.',
  },
  {
    id: 'detection',
    label: 'Spill Detection',
    category: 'Detection Engine',
    provenance: 'OBSERVED',
    confidence: 0.87,
    icon: Radio,
    summary: 'Confirmed Oil Slick (12.4 km²)',
    details: { 'Slick Area': '12.4 km²', Probability: '91%', Verification: 'VERIFIED', 'Look-Alike Risk': '8%' },
    explanation: 'Convolutional U-Net segmentation on Sentinel-1 C-band backscatter corroborated by optical reflectance drop.',
  },
  {
    id: 'hindcast',
    label: 'Hindcast Trajectory',
    category: 'Backward Lagrangian Drift',
    provenance: 'INFERRED',
    confidence: 0.78,
    icon: History,
    summary: '48h Reverse Particle Drift Model',
    details: { Method: 'Lagrangian Backward Drift', Lookback: '48 hours', 'Particle Count': 1000 },
    explanation: 'Reverse hydrodynamic drift integration reversing ocean currents and wind force vectors over the preceding 48 hours.',
  },
  {
    id: 'origin',
    label: 'Origin Zone',
    category: 'Release Location',
    provenance: 'INFERRED',
    confidence: 0.78,
    icon: MapPin,
    summary: 'Estimated Origin: 18.92° N, 72.05° E (±25 km)',
    details: { Coords: '18.92° N, 72.05° E', 'Release Window': '10 Sep 03:00 UTC (±3h)', 'Uncertainty Radius': '25 km' },
    explanation: 'Probable spill release centroid calculated from backward trajectory convergence.',
  },
  {
    id: 'attribution',
    label: 'Vessel Ranking',
    category: 'Candidate Matcher',
    provenance: 'INFERRED',
    confidence: 0.91,
    icon: Ship,
    summary: '#1 Candidate: Ocean Pride (Attribution Score: 0.91)',
    details: { 'Top Match': 'Ocean Pride', MMSI: 9234567, Score: 0.91, 'Trajectory Match': '0.92', 'AIS Gap': '2h 15m' },
    explanation: 'Multi-criteria non-legal attribution matching vessel track intersection with hindcast origin zone and AIS anomaly gaps.',
  },
  {
    id: 'forecast',
    label: 'Forecast Plume',
    category: 'Forward Hydrodynamics',
    provenance: 'SIMULATED',
    confidence: 0.85,
    icon: Wind,
    summary: '+24h Forecast: 312.4 km² Plume Expansion',
    details: { Horizons: '6h, 12h, 24h, 48h, 72h', '+24h Area': '312.4 km²', Direction: 'SE (135°)', 'Drift Speed': '0.8 m/s' },
    explanation: 'Runge-Kutta 4th-order forward particle dispersion modeling under predicted wind and ocean current vector fields.',
  },
  {
    id: 'impact',
    label: 'Impact Assessment',
    category: 'Risk Evaluator',
    provenance: 'SIMULATED',
    confidence: 0.82,
    icon: AlertTriangle,
    summary: 'High Coastal Risk: Sensitive Ecosystems Exposed',
    details: { 'Max Impact Prob': '68%', 'Ecological Sensitivity': '0.82', 'Est. Arrival': '~18 hours' },
    explanation: 'Vulnerability scoring evaluating shoreline asset exposure, fishing zone proximity, and coastal population centers.',
  },
  {
    id: 'priority',
    label: 'Priority Score',
    category: 'Multi-Criteria Risk Engine',
    provenance: 'SIMULATED',
    confidence: 0.87,
    icon: ShieldAlert,
    summary: 'Incident Priority: 87 / 100 [HIGH URGENCY]',
    details: { Score: '87 / 100', Urgency: 'HIGH', 'Impact Factor': '25.5', 'Time Factor': '22.5' },
    explanation: 'Weighted risk matrix synthesizing slick velocity, asset proximity, spill severity, and confidence metrics.',
  },
  {
    id: 'recommendation',
    label: 'Recommended Action',
    category: 'Decision Support Engine',
    provenance: 'SIMULATED',
    confidence: 0.85,
    icon: CheckCircle2,
    summary: 'Directive: DEPLOY_RESOURCES (Human Verification Required)',
    details: { Action: 'DEPLOY_RESOURCES', Priority: 'HIGH', 'Urgency Score': 87, 'Human Oversight': 'MANDATORY' },
    explanation: 'Synthesized decision support directive proposing immediate boom and skimmer deployment to Zone A.',
  },
];

export const EvidenceFlowGraph: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('recommendation');

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) || NODES[NODES.length - 1];

  return (
    <div className="space-y-4 font-mono">
      {/* Evidence Graph Container */}
      <div className="crystalline-panel rounded-xl p-4 border-blue-500/30 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
              EVIDENCE DIRECTED GRAPH
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Click any node to inspect context</span>
        </div>

        {/* Chain Flowchart Visualizer */}
        <div className="space-y-2 py-1">
          {NODES.map((node, index) => {
            const Icon = node.icon;
            const isSelected = node.id === selectedNodeId;
            return (
              <React.Fragment key={node.id}>
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 overflow-hidden ${
                    isSelected
                      ? 'bg-blue-950/60 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-sky-400'
                      : 'bg-[#030914] border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600/20 text-sky-300 border border-sky-400/50' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-100 text-xs truncate max-w-[110px] sm:max-w-[160px]">{node.label}</span>
                        <DataProvenanceBadge provenance={node.provenance} size="xs" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{node.summary}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2 border-l border-slate-800/80">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Conf</span>
                    <span className="text-xs font-bold text-sky-300 tabular-nums">
                      {(node.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {index < NODES.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <ArrowDown className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400 animate-bounce' : 'text-slate-700'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Node Evidence Inspector Modal/Drawer */}
      {selectedNode && (
        <div className="crystalline-panel rounded-xl p-4 border-blue-500/40 bg-[#071022] space-y-3 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <selectedNode.icon className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-slate-100 text-xs uppercase">{selectedNode.label} Evidence Context</span>
            </div>
            <DataProvenanceBadge provenance={selectedNode.provenance} size="xs" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-[#030814] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Summary &amp; Reasoning</span>
              <p className="text-slate-200 mt-0.5 leading-relaxed">{selectedNode.explanation}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              {Object.entries(selectedNode.details).map(([k, v]) => (
                <div key={k} className="p-2 rounded bg-[#030814] border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">{k}</span>
                  <span className="text-sky-300 font-bold text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

