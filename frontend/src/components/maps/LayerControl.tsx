import React from 'react';
import { useMapStore, MapLayers } from '../../stores/mapStore';
import { Layers } from 'lucide-react';

interface LayerDef {
  key: keyof MapLayers;
  label: string;
  color: string;
  group: string;
}

const LAYER_DEFS: LayerDef[] = [
  // Detection
  { key: 'slicks', label: 'Spill Boundary', color: '#f59e0b', group: 'DETECTION' },
  { key: 'spillProbability', label: 'Spill Probability', color: '#fbbf24', group: 'DETECTION' },
  // Metocean
  { key: 'currentVectors', label: 'Ocean Current', color: '#38bdf8', group: 'METOCEAN' },
  { key: 'windVectors', label: 'Wind Vectors', color: '#a78bfa', group: 'METOCEAN' },
  // Vessels
  { key: 'vessels', label: 'AIS Vessels', color: '#ef4444', group: 'VESSELS' },
  { key: 'darkVessels', label: 'Dark Vessels', color: '#7c3aed', group: 'VESSELS' },
  { key: 'aisTracks', label: 'Vessel Tracks', color: '#f87171', group: 'VESSELS' },
  // Hindcast / Forecast
  { key: 'hindcastOrigin', label: 'Hindcast Trajectory', color: '#818cf8', group: 'TRAJECTORY' },
  { key: 'forecast6h', label: 'Forecast +6h', color: '#ea580c', group: 'TRAJECTORY' },
  { key: 'forecast12h', label: 'Forecast +12h', color: '#d97706', group: 'TRAJECTORY' },
  { key: 'forecast24h', label: 'Forecast +24h', color: '#7c3aed', group: 'TRAJECTORY' },
  // Impact / Response
  { key: 'impactAssets', label: 'Impact Assets', color: '#a78bfa', group: 'IMPACT' },
  { key: 'impactZones', label: 'Impact Zones', color: '#dc2626', group: 'IMPACT' },
  { key: 'responseZones', label: 'Response Zones', color: '#10b981', group: 'IMPACT' },
];

const GROUPS = ['DETECTION', 'METOCEAN', 'VESSELS', 'TRAJECTORY', 'IMPACT'];

export const LayerControl: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { layers, toggleLayer } = useMapStore();

  return (
    <div className="absolute bottom-14 right-4 z-[500]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#050c1e]/95 border border-[rgba(56,189,248,0.35)] text-sky-300 text-xs font-mono font-bold shadow-lg hover:border-sky-400 transition-colors cursor-pointer"
        title="Toggle map layers"
      >
        <Layers className="w-4 h-4" />
        <span>LAYERS</span>
      </button>

      {open && (
        <div className="absolute bottom-10 right-0 w-56 bg-[#060d20]/97 border border-[rgba(56,189,248,0.25)] rounded-xl shadow-2xl p-3 font-mono text-xs space-y-3 backdrop-blur-md">
          <div className="text-[10px] text-cyan-400 font-bold tracking-widest border-b border-slate-800 pb-2">
            MAP LAYERS
          </div>
          {GROUPS.map((group) => {
            const groupLayers = LAYER_DEFS.filter((l) => l.group === group);
            return (
              <div key={group} className="space-y-1">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold pt-0.5">
                  {group}
                </div>
                {groupLayers.map((def) => (
                  <label
                    key={def.key}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={layers[def.key]}
                      onChange={() => toggleLayer(def.key)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-sky-400"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: def.color }}
                    />
                    <span className="text-slate-300 group-hover:text-slate-100 transition-colors text-[11px]">
                      {def.label}
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
