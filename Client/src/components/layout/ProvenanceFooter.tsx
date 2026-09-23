import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { DISCLAIMERS } from '../../config/constants';
import { DualRingSonarLens } from '../ui/DualRingSonarLens';

export const ProvenanceFooter: React.FC = () => {
  return (
    <footer className="mt-8 pt-5 pb-6 px-5 rounded-2xl border-t-2 border-blue-500/50 border-x border-b border-blue-900/40 bg-gradient-to-r from-[#030919]/95 via-[#08183a]/95 to-[#040a1b]/95 backdrop-blur-2xl text-[11px] font-mono text-slate-300 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_-8px_35px_rgba(37,99,235,0.25)]">
      <div className="flex items-center gap-2 text-slate-200">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong className="text-white">OPERATIONAL DISCLAIMER:</strong> {DISCLAIMERS.SYNTHETIC}{' '}
          {DISCLAIMERS.ATTRIBUTION}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0 text-slate-200">
        <span className="flex items-center gap-1 font-bold text-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Human-in-the-Loop Protocol
        </span>
        <span className="text-blue-500/40">|</span>
        <div className="flex items-center gap-2 font-extrabold text-blue-300 tracking-wider">
          <DualRingSonarLens size="sm" />
          <span>AQUALENS v2.0.0</span>
        </div>
      </div>
    </footer>
  );
};
