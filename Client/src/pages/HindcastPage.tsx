import React from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { MapPin, Clock, Compass, History, Wind, Waves, Thermometer, ChevronRight, FlaskConical, Play } from 'lucide-react';
import { getDemoIncident } from '../data/demoIncident';
import {
  DEMO_ALL_SPILL_POLYGONS,
  DEMO_ORIGIN_ZONE,
  DEMO_SECONDARY_ORIGIN_ZONES,
  DEMO_HINDCAST_TRAJECTORY,
} from '../data/demoMapData';
import { DEMO_METOCEAN } from '../data/demoForecast';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useRunPipeline } from '../hooks/usePipeline';
import { CommandButton } from '../components/ui/CommandButton';

const HINDCAST_STEPS = [
  { time: '−3h 50m', label: 'T −3.8h', lat: 15.910, lon: 68.580, desc: 'Probable release at origin zone.' },
  { time: '−2h 30m', label: 'T −2.5h', lat: 15.893, lon: 68.600, desc: 'Early drift SE under 0.82 m/s current.' },
  { time: '−1h 30m', label: 'T −1.5h', lat: 15.870, lon: 68.643, desc: 'Oil film beginning to spread.' },
  { time: '−45m', label: 'T −0.75h', lat: 15.848, lon: 68.690, desc: 'Slick visible in SAR backscatter.' },
  { time: 'Now', label: 'Detection', lat: 15.820, lon: 68.740, desc: 'Full satellite detection at current extent.' },
];

export const HindcastPage: React.FC = () => {
  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode } = useIncidentStore();
  const runPipelineMutation = useRunPipeline();
  const inc = getDemoIncident(selectedSceneId);

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  const kpiCards = [
    {
      icon: MapPin,
      label: 'Estimated Origin',
      value: `${inc.origin.latitude.toFixed(2)}° N, ${inc.origin.longitude.toFixed(2)}° E`,
      sub: `± ${inc.origin.uncertaintyRadiusKm} km radius`,
      color: 'sky',
    },
    {
      icon: Clock,
      label: 'Release Window',
      value: '18:20 UTC',
      sub: `to 22:10 UTC, 14 Sep 2026`,
      color: 'blue',
    },
    {
      icon: Compass,
      label: 'Drift Direction',
      value: 'NW → SE',
      sub: `${inc.metocean.currentDirectionDeg}° at ${inc.metocean.currentSpeedMs} m/s`,
      color: 'purple',
    },
    {
      icon: History,
      label: 'Hindcast Confidence',
      value: `${(inc.origin.confidence * 100).toFixed(0)}%`,
      sub: 'Lagrangian backward trajectory',
      color: 'emerald',
    },
    {
      icon: FlaskConical,
      label: 'Spill Age',
      value: '3.5 – 4.2 h',
      sub: 'SAR NRCS · Early emulsification',
      color: 'amber',
    },
  ];

  const colorCls: Record<string, string> = {
    sky: 'bg-sky-500/15 border-sky-400/40 text-sky-300',
    blue: 'bg-blue-500/15 border-blue-400/40 text-blue-300',
    purple: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    emerald: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    amber: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
  };

  const metRows = [
    { icon: Wind, label: 'Wind Speed', value: `${inc.metocean.windSpeedKmh} km/h`, dir: `SE (${inc.metocean.windDirectionDeg}°)`, color: 'text-sky-400' },
    { icon: Waves, label: 'Ocean Current', value: `${inc.metocean.currentSpeedMs} m/s`, dir: `SE (${inc.metocean.currentDirectionDeg}°)`, color: 'text-blue-400' },
    { icon: Waves, label: 'Wave Height', value: `${inc.metocean.waveHeightM} m`, dir: '', color: 'text-amber-400' },
    { icon: Thermometer, label: 'Sea Temp', value: `${inc.metocean.seaTempC} °C`, dir: '', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-5 font-mono text-xs">
      {!pipelineExecuted && (
        <div className="crystalline-panel rounded-xl p-6 flex flex-col items-center gap-4 border-blue-500/30 bg-blue-950/10">
          <div className="text-slate-400 text-sm font-mono text-center">
            Run the pipeline to reconstruct the backward trajectory, origin zone and hindcast timeline.
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
      {pipelineExecuted && (<>
      <SectionHeader
        title="Origin & Hindcast"
        subtitle={`Backward drift reconstruction — Incident ${inc.incidentId} (Module M7)`}
        provenance="INFERRED"
        moduleTag="M7"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((c) => {
          const Icon = c.icon;
          const cls = colorCls[c.color];
          return (
            <div key={c.label} className="crystalline-panel p-3.5 rounded-xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${cls}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{c.label}</div>
                <div className={`text-xs font-bold tabular-nums ${cls.split(' ')[2]}`}>{c.value}</div>
                <div className="text-[10px] text-slate-400">{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Map + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title={`HINDCAST MAP — ${inc.sceneId}`}
            subtitle="Reverse Lagrangian particle drift • Current spill → Backward trajectory → Probable origin"
            provenance="INFERRED"
            spillPolygons={DEMO_ALL_SPILL_POLYGONS}
            originZone={DEMO_ORIGIN_ZONE}
            secondaryOriginZones={DEMO_SECONDARY_ORIGIN_ZONES}
            backwardTrajectory={DEMO_HINDCAST_TRAJECTORY}
            metocean={DEMO_METOCEAN}
            showCalloutLabels={true}
            height="460px"
          />
          {/* Flow indicator */}
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              <span className="font-bold text-slate-100">Current Spill</span>
            </div>
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <ChevronRight className="w-4 h-4" />
              <span className="text-indigo-300">Backward Trajectory (3h 50m)</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-amber-400">Probable Origin (87% conf.)</span>
            </div>
          </div>
        </div>

        {/* Right: Analysis + Env Conditions */}
        <div className="space-y-4">
          <CrystallinePanel title="Hindcast Analysis" subtitle="Lagrangian backward trajectory model">
            <div className="space-y-2.5 text-[11px]">
              {[
                ['Estimated Origin', `${inc.origin.latitude}° N, ${inc.origin.longitude}° E`],
                ['Uncertainty Radius', `± ${inc.origin.uncertaintyRadiusKm} km`],
                ['Release Window', `${inc.releaseWindow.start} — ${inc.releaseWindow.end}`],
                ['Hindcast Duration', '3 hours 50 minutes'],
                ['Drift Model', 'NOAA GNOME + Lagrangian Particles'],
                ['Particles Simulated', '10,000'],
                ['Current Source', 'HYCOM 1/12° Reanalysis'],
                ['Wind Source', 'ERA5 Reanalysis'],
                ['Origin Confidence', `${(inc.origin.confidence * 100).toFixed(0)}% (High)`],
                ['Attribution Link', 'MV Ocean Crest (score 0.91)'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-800/70 pb-1.5">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-slate-200 font-medium text-right max-w-[140px]">{v}</span>
                </div>
              ))}
            </div>
          </CrystallinePanel>

          <CrystallinePanel title="Environmental Conditions" subtitle="Historical metocean at origin">
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

      </>)}
    </div>
  );
};
