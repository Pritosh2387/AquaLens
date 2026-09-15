import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { ForecastProgressionChart } from '../components/charts/ForecastProgressionChart';
import { Play, Pause, Wind, Waves, Thermometer, Compass, ArrowRight, AlertTriangle } from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_FORECAST_6H,
  DEMO_FORECAST_12H,
  DEMO_FORECAST_24H,
  DEMO_FORWARD_TRAJECTORY,
} from '../data/demoMapData';
import { DEMO_FORECAST_HORIZONS, DEMO_METOCEAN } from '../data/demoForecast';

export const ForecastPage: React.FC = () => {
  const inc = DEMO_INCIDENT;
  const [selectedHorizon, setSelectedHorizon] = useState<'ALL' | '0h' | '6h' | '12h' | '24h'>('ALL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);

  const horizons = DEMO_FORECAST_HORIZONS.slice(0, 4); // 0h, 6h, 12h, 24h

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveFrame((prev) => (prev + 1) % horizons.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, horizons.length]);

  const metRows = [
    { icon: Wind, label: 'Wind Speed', value: `${inc.metocean.windSpeedKmh} km/h`, dir: `SE (${inc.metocean.windDirectionDeg}°)`, color: 'text-sky-400' },
    { icon: Waves, label: 'Ocean Current', value: `${inc.metocean.currentSpeedMs} m/s`, dir: `SE (${inc.metocean.currentDirectionDeg}°)`, color: 'text-blue-400' },
    { icon: Waves, label: 'Wave Height', value: `${inc.metocean.waveHeightM} m`, dir: '', color: 'text-amber-400' },
    { icon: Thermometer, label: 'Sea Temp', value: `${inc.metocean.seaTempC} °C`, dir: '', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-5 font-mono text-xs">
      <SectionHeader
        title="Spill Forecast"
        subtitle={`Drift & spread prediction — Incident ${inc.incidentId} (Module M9)`}
        provenance="SIMULATED"
        moduleTag="M9"
      />

      {/* Horizon Filter Pills */}
      <div className="crystalline-panel p-3 rounded-xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[11px] mr-1">Horizon:</span>
          {(['ALL', '0h', '6h', '12h', '24h'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedHorizon === h
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_#38bdf8]'
                  : 'bg-[#030814] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {h === 'ALL' ? 'Show All' : `+${h}`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sky-400 font-bold text-xs shrink-0">
          <span>CURRENT</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>+6h</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>+12h</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>+24h</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Forecast Map */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`DRIFT FORECAST MAP — ${inc.sceneId}`}
            subtitle="Current → +6h → +12h → +24h opacity-graduated polygons"
            provenance="SIMULATED"
            spillPolygons={selectedHorizon === 'ALL' || selectedHorizon === '0h' ? DEMO_ALL_SPILL_POLYGONS : []}
            forecast6h={selectedHorizon === 'ALL' || selectedHorizon === '6h' ? DEMO_FORECAST_6H : null}
            forecast12h={selectedHorizon === 'ALL' || selectedHorizon === '12h' ? DEMO_FORECAST_12H : null}
            forecast24h={selectedHorizon === 'ALL' || selectedHorizon === '24h' ? DEMO_FORECAST_24H : null}
            forwardTrajectory={DEMO_FORWARD_TRAJECTORY}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          {/* Opacity legend */}
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex flex-wrap items-center justify-between gap-3 text-slate-300">
            <span className="text-slate-400 font-bold">OPACITY ZONES:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-700" /> Current (100%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-600/80" /> +6h (82%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-600/65" /> +12h (65%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-600/48" /> +24h (48%)</span>
            </div>
          </div>
        </div>

        {/* Right: Summary + MetOc */}
        <div className="space-y-4">
          <CrystallinePanel title="Forecast Summary" subtitle="Plume area & drift estimates">
            <div className="space-y-1.5">
              {DEMO_FORECAST_HORIZONS.slice(0, 4).map((h) => (
                <div key={h.key} className="flex justify-between border-b border-slate-800 pb-1.5 text-[11px]">
                  <span className="text-slate-400">{h.label}:</span>
                  <div className="text-right">
                    <span className={`font-bold tabular-nums ${h.key === '0h' ? 'text-sky-300' : h.area_km2 > 200 ? 'text-red-400' : h.area_km2 > 100 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {h.area_km2} km²
                    </span>
                    {h.coastalProximityKm && (
                      <div className="text-[9px] text-slate-500">{h.coastalProximityKm} km from shore</div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-[11px] border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Primary Direction:</span>
                <span className="flex items-center gap-1"><Compass className="w-3 h-3 text-sky-400" /> {inc.forecast.primaryDirection}</span>
              </div>
              <div className="flex justify-between text-[11px] border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Drift Speed:</span>
                <span className="text-slate-200">{inc.metocean.currentSpeedMs} m/s</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Shore Impact:</span>
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {inc.forecast.shoreImpactEta}
                </span>
              </div>
            </div>
          </CrystallinePanel>

          <CrystallinePanel title="Environmental Conditions" subtitle="MetOc parameters">
            <div className="grid grid-cols-2 gap-2">
              {metRows.map(({ icon: Icon, label, value, dir, color }) => (
                <div key={label} className="p-2.5 rounded bg-[#030814] border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-[10px] text-slate-400">{label}</span>
                  </div>
                  <div className="font-bold text-slate-100">{value}</div>
                  {dir && <div className="text-[9px] text-slate-500">{dir}</div>}
                </div>
              ))}
            </div>
          </CrystallinePanel>
        </div>
      </div>

      {/* Bottom: Timeline + Chart */}
      <div className="crystalline-panel p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 border border-blue-500/40 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <span className="font-bold text-slate-100 text-xs">FORECAST TIMELINE ANIMATION</span>
            {isPlaying && (
              <span className="text-[10px] text-sky-400 animate-pulse">● PLAYING — {horizons[activeFrame].label}</span>
            )}
          </div>
        </div>

        {/* Horizon thumbnails */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {horizons.map((h, idx) => (
            <div
              key={h.key}
              onClick={() => setActiveFrame(idx)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                idx === activeFrame
                  ? 'bg-blue-950/60 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                  : 'bg-[#030814] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className="aspect-video rounded mb-1.5 border border-slate-800 flex items-center justify-center"
                style={{ background: `${h.color}20`, borderColor: h.color + '40' }}
              >
                <span className="text-[10px] font-bold" style={{ color: h.color }}>{h.label}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-100">{h.label}</div>
              <div className="text-[9px] text-slate-400">{h.timestamp.slice(11)}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: h.color }}>{h.area_km2} km²</div>
            </div>
          ))}
        </div>

        <ForecastProgressionChart />
      </div>
    </div>
  );
};
