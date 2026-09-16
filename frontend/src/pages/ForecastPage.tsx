import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { ForecastProgressionChart } from '../components/charts/ForecastProgressionChart';
import { Play, Pause, Wind, Waves, Thermometer, Compass, AlertTriangle } from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_FORECAST_6H,
  DEMO_FORECAST_12H,
  DEMO_FORECAST_24H,
  DEMO_FORWARD_TRAJECTORY,
} from '../data/demoMapData';
import { DEMO_FORECAST_HORIZONS, DEMO_METOCEAN } from '../data/demoForecast';
import { usePipelineStore } from '../stores/pipelineStore';
import { useRunPipeline } from '../hooks/usePipeline';
import { useIncidentStore } from '../stores/incidentStore';
import { CommandButton } from '../components/ui/CommandButton';

export const ForecastPage: React.FC = () => {
  const inc = DEMO_INCIDENT;
  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode } = useIncidentStore();
  const runPipelineMutation = useRunPipeline();

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);

  const horizons = DEMO_FORECAST_HORIZONS.slice(0, 4); // 0h, 6h, 12h, 24h

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveFrame((prev) => {
          const next = (prev + 1) % horizons.length;
          // Stop playing after reaching last frame
          if (next === 0) {
            setIsPlaying(false);
          }
          return next;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, horizons.length]);

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  // Map props driven by activeFrame (for Task 2: connected timeline)
  const getMapPropsForFrame = (frame: number) => {
    switch (frame) {
      case 0: // Current (0h) — show only the current spill
        return {
          spillPolygons: DEMO_ALL_SPILL_POLYGONS,
          forecast6h: null,
          forecast12h: null,
          forecast24h: null,
          forwardTrajectory: DEMO_FORWARD_TRAJECTORY,
        };
      case 1: // +6h
        return {
          spillPolygons: DEMO_ALL_SPILL_POLYGONS,
          forecast6h: DEMO_FORECAST_6H,
          forecast12h: null,
          forecast24h: null,
          forwardTrajectory: DEMO_FORWARD_TRAJECTORY.slice(0, 3),
        };
      case 2: // +12h
        return {
          spillPolygons: DEMO_ALL_SPILL_POLYGONS,
          forecast6h: DEMO_FORECAST_6H,
          forecast12h: DEMO_FORECAST_12H,
          forecast24h: null,
          forwardTrajectory: DEMO_FORWARD_TRAJECTORY.slice(0, 5),
        };
      case 3: // +24h
        return {
          spillPolygons: DEMO_ALL_SPILL_POLYGONS,
          forecast6h: DEMO_FORECAST_6H,
          forecast12h: DEMO_FORECAST_12H,
          forecast24h: DEMO_FORECAST_24H,
          forwardTrajectory: DEMO_FORWARD_TRAJECTORY,
        };
      default:
        return {
          spillPolygons: DEMO_ALL_SPILL_POLYGONS,
          forecast6h: DEMO_FORECAST_6H,
          forecast12h: DEMO_FORECAST_12H,
          forecast24h: DEMO_FORECAST_24H,
          forwardTrajectory: DEMO_FORWARD_TRAJECTORY,
        };
    }
  };

  const activeHorizon = horizons[activeFrame];
  const mapProps = getMapPropsForFrame(activeFrame);

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

      {/* Horizon Filter Pills / Timeline indicator */}
      <div className="crystalline-panel p-3 rounded-xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[11px] mr-1">Timeline:</span>
          {horizons.map((h, idx) => (
            <button
              key={h.key}
              onClick={() => { setActiveFrame(idx); setIsPlaying(false); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                idx === activeFrame
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_#38bdf8]'
                  : 'bg-[#030814] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {h.key === '0h' ? 'Current' : `+${h.key}`}
            </button>
          ))}
        </div>
        {/* Active horizon area display */}
        {pipelineExecuted && (
          <div className="flex items-center gap-2 font-bold text-xs shrink-0" style={{ color: activeHorizon.color }}>
            <span>{activeHorizon.label}</span>
            <span className="text-slate-400">—</span>
            <span>{activeHorizon.area_km2} km²</span>
          </div>
        )}
      </div>

      {/* Before pipeline: call-to-action */}
      {!pipelineExecuted && (
        <div className="crystalline-panel rounded-xl p-6 flex flex-col items-center gap-4 border-blue-500/30 bg-blue-950/10">
          <div className="text-slate-400 text-sm font-mono text-center">
            Run the pipeline to load forecast data, drift trajectories and spill extent predictions.
          </div>
          <CommandButton
            variant="primary"
            size="lg"
            loading={isPipelineRunning}
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={handleRunPipeline}
            className="px-8"
          >
            {isPipelineRunning ? 'Running Pipeline...' : 'RUN PIPELINE'}
          </CommandButton>
        </div>
      )}

      {/* Main Grid — only after pipeline */}
      {pipelineExecuted && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Forecast Map — driven by activeFrame */}
            <div className="lg:col-span-2 space-y-3">
              <CommandMapFrame
                title={`DRIFT FORECAST MAP — ${inc.sceneId} · ${activeHorizon.label}`}
                subtitle={`Showing forecast extent at ${activeHorizon.label} • ${activeHorizon.area_km2} km²`}
                provenance="SIMULATED"
                spillPolygons={mapProps.spillPolygons}
                forecast6h={mapProps.forecast6h}
                forecast12h={mapProps.forecast12h}
                forecast24h={mapProps.forecast24h}
                forwardTrajectory={mapProps.forwardTrajectory}
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
                  {DEMO_FORECAST_HORIZONS.slice(0, 4).map((h, idx) => (
                    <div
                      key={h.key}
                      className={`flex justify-between border-b border-slate-800 pb-1.5 text-[11px] cursor-pointer rounded px-1 transition-colors ${
                        idx === activeFrame ? 'bg-blue-950/40 border-sky-500/40' : 'hover:bg-slate-800/30'
                      }`}
                      onClick={() => { setActiveFrame(idx); setIsPlaying(false); }}
                    >
                      <span className="text-slate-400">{h.label}:</span>
                      <div className="text-right">
                        <span className={`font-bold tabular-nums ${idx === activeFrame ? 'text-sky-300' : h.area_km2 > 200 ? 'text-red-400' : h.area_km2 > 100 ? 'text-amber-400' : 'text-slate-200'}`}>
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
                  <span className="text-[10px] text-sky-400 animate-pulse">● PLAYING — {activeHorizon.label}</span>
                )}
              </div>
              {/* Active frame stats during playback */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-400">Area:</span>
                <span className="font-bold tabular-nums" style={{ color: activeHorizon.color }}>
                  {activeHorizon.area_km2} km²
                </span>
                {activeHorizon.coastalProximityKm && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Shore:</span>
                    <span className="font-bold text-amber-400">{activeHorizon.coastalProximityKm} km</span>
                  </>
                )}
              </div>
            </div>

            {/* Horizon thumbnails — clickable, drives map */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {horizons.map((h, idx) => (
                <div
                  key={h.key}
                  onClick={() => { setActiveFrame(idx); setIsPlaying(false); }}
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
        </>
      )}
    </div>
  );
};
