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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono animate-fadeIn">
      <div className="crystalline-panel w-full max-w-2xl rounded-2xl border-cyan-500/30 overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#071022]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">{vessel.name}</h3>
                {vessel.isDark && (
                  <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 text-[10px] font-bold border border-red-500/50 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> DARK VESSEL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">IMO: {vessel.imo} • Flag: {vessel.flag} • Type: {vessel.type}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Top Score Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">INVESTIGATION CANDIDATE SCORE</span>
              <div className="text-2xl font-bold text-cyan-300 tabular-nums">
                {vessel.score.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">/ 1.00</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 text-xs font-bold border border-amber-500/50 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Rank #{vessel.rank} Candidate
              </span>
            </div>
          </div>

          {/* Critical Legal Disclaimer */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>DECISION-SUPPORT NOTICE:</strong> AquaLens performs non-legal candidate ranking based on satellite CFAR detection, AIS trajectory matching, and oceanographic hindcasting. This score is for investigation priority only.
            </p>
          </div>

          {/* Detailed Evidence Decomposition */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Evidence Decomposition</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-cyan-400" /> SAR Satellite Detection</span>
                  <span className="text-cyan-300 font-bold">{vessel.sarEvidence}</span>
                </div>
                <p className="text-[10px] text-slate-400">Sentinel-1 C-Band CFAR target extraction match.</p>
              </div>

              <div className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5"><Ship className="w-3.5 h-3.5 text-blue-400" /> AIS Track Corroboration</span>
                  <span className="text-blue-300 font-bold">{vessel.aisEvidence}</span>
                </div>
                <p className="text-[10px] text-slate-400">AIS stream matching &amp; dark vessel anomaly audit.</p>
              </div>

              <div className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-purple-400" /> Trajectory Alignment</span>
                  <span className="text-purple-300 font-bold">{vessel.trajectory}</span>
                </div>
                <p className="text-[10px] text-slate-400">Lagrangian backward drift intersection fit.</p>
              </div>

              <div className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Origin Proximity</span>
                  <span className="text-amber-300 font-bold">{vessel.originProximityKm ?? 2.4} km</span>
                </div>
                <p className="text-[10px] text-slate-400">Distance to estimated slick release point.</p>
              </div>
            </div>
          </div>

          {/* Anomaly Metrics Table */}
          <div className="p-3 rounded-lg bg-[#030814] border border-slate-800 space-y-2 text-xs">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AIS &amp; Physical Anomaly Audit</h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400 block text-[9px]">AIS Gap Duration</span>
                <span className="font-bold text-slate-100">{vessel.aisGapDuration ?? '1h 45m'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">Position Error</span>
                <span className="font-bold text-slate-100">{vessel.positionErrorKm ?? 0.8} km</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">Anomaly Score</span>
                <span className="font-bold text-red-400">{(vessel.anomalyScore ?? 0.76).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#071022] flex justify-end">
          <CommandButton variant="secondary" size="sm" onClick={onClose}>
            Close Intelligence Drawer
          </CommandButton>
        </div>
      </div>
    </div>
  );
};
