import React from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CrystallinePanel } from '../components/ui/CrystallinePanel';
import { CommandMapFrame } from '../components/maps/CommandMapFrame';
import { CheckCircle2, XCircle, Target, BarChart3, ArrowRight, TrendingUp, Play } from 'lucide-react';
import { DEMO_INCIDENT } from '../data/demoIncident';
import { DEMO_PREDICTED_POLYGON, DEMO_OBSERVED_POLYGON } from '../data/demoMapData';
import { usePipelineStore } from '../stores/pipelineStore';
import { useIncidentStore } from '../stores/incidentStore';
import { useRunPipeline } from '../hooks/usePipeline';
import { CommandButton } from '../components/ui/CommandButton';

const pvr = DEMO_INCIDENT.predictionVsReality;

const METRICS = [
  {
    label: 'Spatial Overlap (IoU)',
    value: pvr.iou.toFixed(2),
    target: '> 0.80',
    pass: pvr.iou > 0.80,
    description: 'Intersection over Union of predicted vs observed spill polygons.',
    color: 'text-emerald-400',
  },
  {
    label: 'Centroid Error',
    value: `${pvr.centroidErrorKm} km`,
    target: '< 5 km',
    pass: pvr.centroidErrorKm < 5,
    description: 'Geographic distance between predicted and observed centroid.',
    color: 'text-emerald-400',
  },
  {
    label: 'Area Error',
    value: `${pvr.areaErrorPct}%`,
    target: '< 15%',
    pass: pvr.areaErrorPct < 15,
    description: 'Relative difference in predicted vs observed spill area.',
    color: 'text-emerald-400',
  },
  {
    label: 'Direction Error',
    value: `${pvr.directionErrorDeg}°`,
    target: '< 15°',
    pass: pvr.directionErrorDeg < 15,
    description: 'Angular difference in predicted vs observed drift vector.',
    color: 'text-emerald-400',
  },
  {
    label: 'ETA Error',
    value: `${pvr.etaErrorMin} min`,
    target: '< 60 min',
    pass: pvr.etaErrorMin < 60,
    description: 'Difference in predicted vs actual arrival time at waypoint.',
    color: 'text-emerald-400',
  },
];

export const FeedbackPage: React.FC = () => {
  const { pipelineExecuted, isPipelineRunning } = usePipelineStore();
  const { selectedSceneId, pipelineMode } = useIncidentStore();
  const runPipelineMutation = useRunPipeline();
  const inc = DEMO_INCIDENT;

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      scene_id: selectedSceneId,
      include_modules_11_15: pipelineMode === 'EXTENDED' || pipelineMode === 'FULL_DECISION_SUPPORT',
      include_modules_16_17: pipelineMode === 'FULL_DECISION_SUPPORT',
    });
  };

  const passCount = METRICS.filter((m) => m.pass).length;
  const overallGrade = passCount === 5 ? 'EXCELLENT' : passCount >= 3 ? 'GOOD' : 'NEEDS IMPROVEMENT';
  const gradeColor = passCount === 5 ? 'text-emerald-400' : passCount >= 3 ? 'text-sky-400' : 'text-amber-400';

  return (
    <div className="space-y-5 font-mono text-xs">
      {!pipelineExecuted && (
        <div className="crystalline-panel rounded-xl p-6 flex flex-col items-center gap-4 border-blue-500/30 bg-blue-950/10">
          <div className="text-slate-400 text-sm font-mono text-center">
            Run the pipeline to compare model predictions against satellite observations.
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
        title="Prediction vs Reality"
        subtitle={`Model accuracy validation — Incident ${inc.incidentId} (Module M10)`}
        provenance="OBSERVED"
        moduleTag="M10"
      />

      {/* Overall Score Banner */}
      <div className="crystalline-panel rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-sky-500/30 bg-sky-950/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Model Accuracy Assessment</div>
            <div className={`text-2xl font-black ${gradeColor}`}>{overallGrade}</div>
            <div className="text-[11px] text-slate-400">{passCount}/5 metrics within acceptance threshold</div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center p-3 rounded-xl bg-[#030814] border border-slate-800">
            <div className="text-2xl font-black text-emerald-400">{(pvr.iou * 100).toFixed(0)}%</div>
            <div className="text-[9px] text-slate-400 uppercase">Spatial Overlap</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#030814] border border-slate-800">
            <div className="text-2xl font-black text-sky-400">{pvr.centroidErrorKm} km</div>
            <div className="text-[9px] text-slate-400 uppercase">Centroid Error</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#030814] border border-slate-800">
            <div className="text-2xl font-black text-amber-400">{pvr.etaErrorMin} min</div>
            <div className="text-[9px] text-slate-400 uppercase">ETA Error</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Map + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overlay Map (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <CommandMapFrame
            title="PREDICTED vs OBSERVED OVERLAY"
            subtitle="Cyan = Model prediction • Amber = New satellite observation"
            provenance="OBSERVED"
            predictedPolygon={DEMO_PREDICTED_POLYGON}
            observedPolygon={DEMO_OBSERVED_POLYGON}
            showCalloutLabels={true}
            height="460px"
          />
          <div className="crystalline-panel p-2.5 rounded-lg text-[11px] flex items-center gap-6 text-slate-300">
            <span className="font-bold text-slate-400">LEGEND:</span>
            <span className="flex items-center gap-2">
              <span className="w-8 h-3 rounded bg-cyan-600/50 border-2 border-cyan-400 border-dashed" />
              <span>Model Prediction (46.1 km²)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-8 h-3 rounded bg-amber-700/60 border-2 border-amber-500" />
              <span>Observed (SAR) (42.7 km²)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-400" />
              <span className="text-emerald-400">Overlap Zone</span>
            </span>
          </div>
        </div>

        {/* Metrics Panel (1/3) */}
        <div className="space-y-3">
          <CrystallinePanel title="Accuracy Metrics" subtitle="Prediction vs satellite observation">
            <div className="space-y-3">
              {METRICS.map((m) => (
                <div key={m.label} className="p-2.5 rounded bg-[#030814] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{m.label}</span>
                    {m.pass ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-black tabular-nums ${m.color}`}>{m.value}</span>
                    <span className="text-[9px] text-slate-500">target: {m.target}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full">
                    <div className={`h-full rounded-full ${m.pass ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${m.pass ? 85 : 65}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500">{m.description}</p>
                </div>
              ))}
            </div>
          </CrystallinePanel>
        </div>
      </div>

      {/* Bottom: Error Analysis + Updated Forecast Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Error Analysis */}
        <CrystallinePanel title="Error Analysis" subtitle="Breakdown of model deviation sources">
          <div className="space-y-3">
            {[
              { source: 'Wind Field Uncertainty', contribution: 42, color: 'bg-amber-500' },
              { source: 'Current Model Resolution', contribution: 31, color: 'bg-sky-500' },
              { source: 'Initial Condition Error', contribution: 18, color: 'bg-purple-500' },
              { source: 'Spill Thickness Variation', contribution: 9, color: 'bg-emerald-500' },
            ].map((e) => (
              <div key={e.source} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">{e.source}</span>
                  <span className="text-slate-400 font-bold">{e.contribution}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full">
                  <div className={`h-full rounded-full ${e.color}`} style={{ width: `${e.contribution * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CrystallinePanel>

        {/* Updated Forecast Flow */}
        <CrystallinePanel title="Model Update Flow" subtitle="How the new observation improves future predictions">
          <div className="space-y-3">
            {[
              { step: '1', label: 'Previous Prediction', desc: 'Model forecast from T-6h initialization.', color: 'text-sky-300', icon: BarChart3 },
              { step: '2', label: 'New Satellite Observation', desc: `Sentinel-1B pass at ${inc.sensor.passTime}. Actual spill: 42.7 km².`, color: 'text-amber-300', icon: TrendingUp },
              { step: '3', label: 'Error Analysis', desc: `IoU 0.82, centroid shift 3.4 km NE of prediction.`, color: 'text-purple-300', icon: Target },
              { step: '4', label: 'Updated Forecast', desc: 'Re-initialized forecast with corrected boundary. Shore ETA updated to 22h.', color: 'text-emerald-300', icon: ArrowRight },
            ].map(({ step, label, desc, color, icon: Icon }, i, arr) => (
              <div key={step} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${color.replace('text-', 'border-')} bg-[#030814]`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-[11px] ${color}`}>{label}</div>
                  <div className="text-[10px] text-slate-400">{desc}</div>
                </div>
                {i < arr.length - 1 && <div className="absolute left-3.5 mt-7 h-4 w-0.5 bg-slate-700" />}
              </div>
            ))}
          </div>
        </CrystallinePanel>
      </div>
      </>)}
    </div>
  );
};
