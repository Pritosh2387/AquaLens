import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const legendItems = [
    { label: 'Oil Spill Slick (M2)', color: 'bg-amber-500 border-amber-400' },
    { label: 'Forecast Plume (M9)', color: 'bg-cyan-500/50 border-cyan-400' },
    { label: 'Spill Origin Zone (M7)', color: 'bg-indigo-500/40 border-indigo-400' },
    { label: 'Backward Trajectory (M7)', color: 'border-indigo-400 border-dashed bg-indigo-900/60' },
    { label: 'Attributed Vessel (M8)', color: 'bg-red-500 border-red-400' },
    { label: 'AIS Vessel Track (M6)', color: 'bg-emerald-400 border-emerald-300' },
    { label: 'Protected Marine Asset (M11)', color: 'bg-purple-500/40 border-purple-400' },
  ];

  return (
    <div className="absolute bottom-4 right-4 z-[400] crystalline-panel rounded-lg shadow-xl text-xs font-mono w-56 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-900/90 text-slate-200 border-b border-slate-800"
      >
        <span className="flex items-center gap-1.5 font-semibold text-[11px]">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          MAP INTELLIGENCE LEGEND
        </span>
        {collapsed ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="p-2.5 space-y-1.5 bg-slate-950/80">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className={cn('w-3.5 h-3.5 rounded-sm border shrink-0', item.color)} />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
