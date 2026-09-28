import React from 'react';
import { Ship, X, AlertTriangle, ShieldCheck, Radio, Compass, MapPin, EyeOff } from 'lucide-react';
import { CommandButton } from '../ui/CommandButton';

export interface SuspectVesselDetail {
  rank: number;
  name: string;
  mmsi?: number;
  imo: string;
  type: string;
  flag: string;
  score: number;
  aisEvidence: string;
  sarEvidence: string;
  trajectory: string;
  isDark?: boolean;
  aisGapDuration?: string;
  positionErrorKm?: number;
  anomalyScore?: number;
  originProximityKm?: number;
  timingDeltaHours?: number;
}

interface VesselDetailModalProps {
  vessel: SuspectVesselDetail | null;
  onClose: () => void;
}

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({ vessel, onClose }) => {
  if (!vessel) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md font-mono animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="crystalline-panel w-full max-w-xl rounded-xl border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#071022] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">{vessel.name}</h3>
                {vessel.isDark && (
                  <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 text-[9px] font-bold border border-red-500/50 flex items-center gap-1">
                    <EyeOff className="w-2.5 h-2.5" /> DARK
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">IMO: {vessel.imo} • Flag: {vessel.flag} • {vessel.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0 no-scrollbar">

          {/* Score + Rank Row */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Investigation Score</span>
              <div className="text-xl font-bold text-cyan-300 tabular-nums leading-tight">
                {vessel.score.toFixed(2)}{' '}
                <span className="text-[10px] font-normal text-slate-400">/ 1.00</span>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-amber-950/80 text-amber-300 text-[10px] font-bold border border-amber-500/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Rank #{vessel.rank}
            </span>
          </div>

          {/* Disclaimer */}
          <div className="px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-200/90 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>DECISION-SUPPORT NOTICE:</strong> Non-legal candidate ranking based on SAR detection, AIS matching & hindcasting. For investigation priority only.
            </p>
          </div>

          {/* Evidence Grid */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Evidence Decomposition</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                { icon: <Radio className="w-3 h-3 text-cyan-400" />, label: 'SAR Detection', value: vessel.sarEvidence, color: 'text-cyan-300', desc: 'Sentinel-1 CFAR match' },
                { icon: <Ship className="w-3 h-3 text-blue-400" />, label: 'AIS Corroboration', value: vessel.aisEvidence, color: 'text-blue-300', desc: 'AIS stream & dark audit' },
                { icon: <Compass className="w-3 h-3 text-purple-400" />, label: 'Trajectory', value: vessel.trajectory, color: 'text-purple-300', desc: 'Lagrangian drift fit' },
                { icon: <MapPin className="w-3 h-3 text-amber-400" />, label: 'Origin Proximity', value: `${vessel.originProximityKm ?? 2.4} km`, color: 'text-amber-300', desc: 'Distance to release point' },
              ].map(({ icon, label, value, color, desc }) => (
                <div key={label} className="p-2 rounded-lg bg-[#030814] border border-slate-800 space-y-0.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">{icon} {label}</span>
                    <span className={`${color} font-bold`}>{value}</span>
                  </div>
                  <p className="text-[9px] text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Metrics */}
          <div className="p-3 rounded-lg bg-[#030814] border border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">AIS & Anomaly Audit</h4>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300">
              <div>
                <span className="text-slate-500 block text-[9px]">AIS Gap</span>
                <span className="font-bold text-slate-100">{vessel.aisGapDuration ?? '1h 45m'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Position Error</span>
                <span className="font-bold text-slate-100">{vessel.positionErrorKm ?? 0.8} km</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Anomaly Score</span>
                <span className="font-bold text-red-400">{(vessel.anomalyScore ?? 0.76).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#071022] flex justify-end shrink-0">
          <CommandButton variant="secondary" size="sm" onClick={onClose}>
            Close Intelligence Drawer
          </CommandButton>
        </div>
      </div>
    </div>
  );
};
